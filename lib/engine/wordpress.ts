import type { Report } from './types'

// WordPress integration via the core REST API + Application Passwords
// (self-hosted WordPress 5.6+). Credentials are supplied per-request from the
// browser and never stored server-side. All write actions are explicit and
// previewable — nothing is changed without the user approving it.

export interface WpConnection {
  site: string // e.g. https://example.com
  username: string
  appPassword: string
}

export interface WpPostRef {
  id: number
  type: 'posts' | 'pages'
  link: string
  title: string
}

function authHeader(conn: WpConnection): string {
  // Application passwords are shown with spaces; the API accepts them with spaces removed.
  const token = Buffer.from(`${conn.username}:${conn.appPassword.replace(/\s+/g, '')}`).toString('base64')
  return `Basic ${token}`
}

function apiBase(site: string): string {
  return site.replace(/\/+$/, '') + '/wp-json/wp/v2'
}

async function wpFetch(url: string, conn: WpConnection, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader(conn),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(25_000),
  })
}

export class WpError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message)
    this.name = 'WpError'
  }
}

/** Verifies the connection and returns the authenticated user's name. */
export async function wpTestConnection(conn: WpConnection): Promise<{ ok: boolean; user?: string; message: string }> {
  let res: Response
  try {
    res = await wpFetch(`${apiBase(conn.site)}/users/me?context=edit`, conn)
  } catch (err) {
    return { ok: false, message: `Could not reach ${conn.site}. Check the address (it should look like https://yoursite.com).` }
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, message: 'WordPress rejected the username or application password. Double-check both (the app password is the one generated under Users → Profile → Application Passwords).' }
  }
  if (res.status === 404) {
    return { ok: false, message: 'The WordPress REST API was not found at that address. Make sure it is a self-hosted WordPress site and the URL is correct.' }
  }
  if (!res.ok) {
    return { ok: false, message: `WordPress returned an error (HTTP ${res.status}).` }
  }
  const me = (await res.json()) as { name?: string; capabilities?: Record<string, boolean> }
  const canEdit = me.capabilities?.edit_posts || me.capabilities?.edit_pages
  if (canEdit === false) {
    return { ok: false, message: 'Connected, but this user cannot edit content. Use an Administrator or Editor account.' }
  }
  return { ok: true, user: me.name, message: `Connected as ${me.name ?? 'user'}.` }
}

/** Finds the post or page that matches a given URL (by slug, then by link). */
export async function wpFindPost(conn: WpConnection, pageUrl: string): Promise<WpPostRef | null> {
  let slug = ''
  try {
    const path = new URL(pageUrl).pathname.replace(/\/+$/, '')
    slug = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '')
  } catch {
    return null
  }
  if (!slug) {
    // Likely the homepage — try the site's front page id via settings.
    return null
  }

  for (const type of ['pages', 'posts'] as const) {
    try {
      const res = await wpFetch(`${apiBase(conn.site)}/${type}?slug=${encodeURIComponent(slug)}&context=edit`, conn)
      if (!res.ok) continue
      const items = (await res.json()) as Array<{ id: number; link: string; title?: { rendered?: string } }>
      if (items.length > 0) {
        return { id: items[0].id, type, link: items[0].link, title: stripHtml(items[0].title?.rendered ?? slug) }
      }
    } catch {
      // try next type
    }
  }
  return null
}

export type WpChangeKind = 'title' | 'metaDescription' | 'faq' | 'shortAnswer'

export interface WpChangeResult {
  kind: WpChangeKind
  applied: boolean
  message: string
}

export interface WpApplyOptions {
  title?: string
  metaDescription?: string
  faqHtml?: string
  shortAnswerHtml?: string
}

/** Applies the selected changes to a post/page. Each change reports its own result. */
export async function wpApplyChanges(conn: WpConnection, ref: WpPostRef, opts: WpApplyOptions): Promise<WpChangeResult[]> {
  const results: WpChangeResult[] = []
  const endpoint = `${apiBase(conn.site)}/${ref.type}/${ref.id}`

  // Read current content so we can append safely.
  let currentContent = ''
  try {
    const res = await wpFetch(`${endpoint}?context=edit`, conn)
    if (res.ok) {
      const data = (await res.json()) as { content?: { raw?: string; rendered?: string } }
      currentContent = data.content?.raw ?? data.content?.rendered ?? ''
    }
  } catch {
    // continue with empty — appends will still work
  }

  const body: Record<string, unknown> = {}
  if (opts.title) body.title = opts.title

  let newContent = currentContent
  if (opts.shortAnswerHtml) newContent = `${opts.shortAnswerHtml}\n\n${newContent}`
  if (opts.faqHtml) newContent = `${newContent}\n\n${opts.faqHtml}`
  if (opts.shortAnswerHtml || opts.faqHtml) body.content = newContent

  // AIOSEO meta description (best-effort — AIOSEO stores SEO data in its own table,
  // so we attempt the legacy postmeta keys and verify; if it doesn't take, we say so.)
  if (opts.metaDescription) {
    body.meta = { _aioseo_description: opts.metaDescription, _aioseo_og_description: opts.metaDescription }
  }

  if (Object.keys(body).length === 0) return results

  let res: Response
  try {
    res = await wpFetch(endpoint, conn, { method: 'POST', body: JSON.stringify(body) })
  } catch (err) {
    throw new WpError('WP update request failed', `Could not reach your site to apply changes: ${err instanceof Error ? err.message : 'unknown error'}`)
  }
  if (res.status === 401 || res.status === 403) {
    throw new WpError('WP auth failed on write', 'Your site rejected the change — the account may not have permission to edit this page.')
  }
  if (!res.ok) {
    throw new WpError(`WP update HTTP ${res.status}`, `Your site returned an error while saving (HTTP ${res.status}).`)
  }
  const updated = (await res.json()) as { content?: { raw?: string }; meta?: Record<string, unknown> }

  if (opts.title) results.push({ kind: 'title', applied: true, message: 'Page title updated.' })
  if (opts.shortAnswerHtml) results.push({ kind: 'shortAnswer', applied: true, message: 'Short-answer paragraph added to the top of the page.' })
  if (opts.faqHtml) results.push({ kind: 'faq', applied: true, message: 'FAQ section added to the page.' })
  if (opts.metaDescription) {
    const took = updated.meta?._aioseo_description === opts.metaDescription
    results.push({
      kind: 'metaDescription',
      applied: took,
      message: took
        ? 'Meta description updated.'
        : 'Meta description could not be set automatically (AIOSEO stores it separately). Copy the suggested text and paste it into the AIOSEO “Meta Description” box on this page — it is shown above.',
    })
  }
  return results
}

// ── Content builders (used to turn report suggestions into WordPress blocks) ──

export function buildFaqBlock(questions: { q: string; a: string }[]): string {
  if (questions.length === 0) return ''
  const parts = ['<!-- wp:heading --><h2>Frequently Asked Questions</h2><!-- /wp:heading -->']
  for (const { q, a } of questions) {
    parts.push(`<!-- wp:heading {"level":3} --><h3>${escapeHtml(q)}</h3><!-- /wp:heading -->`)
    parts.push(`<!-- wp:paragraph --><p>${escapeHtml(a)}</p><!-- /wp:paragraph -->`)
  }
  return parts.join('\n')
}

export function buildShortAnswerBlock(text: string): string {
  if (!text) return ''
  return `<!-- wp:paragraph --><p>${escapeHtml(text)}</p><!-- /wp:paragraph -->`
}

/** Picks the most useful WordPress changes out of a finished report. */
export function proposeChangesFromReport(report: Report): {
  title?: string
  metaDescription?: string
  faq?: { q: string; a: string }[]
  shortAnswer?: string
} {
  const r = report.results
  if (!r) return {}
  const out: ReturnType<typeof proposeChangesFromReport> = {}

  const suggestedTitle = r.ai?.suggestedTitles?.[0]
  if (suggestedTitle) out.title = suggestedTitle

  const suggestedMeta = r.ai?.suggestedMetaDescriptions?.[0]
  if (suggestedMeta) out.metaDescription = suggestedMeta

  if (r.ai?.shortAnswerBlock) out.shortAnswer = r.ai.shortAnswerBlock

  const faqQuestions = r.ai?.faqSuggestions ?? []
  if (faqQuestions.length > 0) {
    out.faq = faqQuestions.slice(0, 6).map((q) => ({
      q,
      a: 'Write a concise 40–60 word answer here before publishing.',
    }))
  }
  return out
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
