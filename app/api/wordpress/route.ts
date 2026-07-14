// WordPress connector for the /app tool.
//
// Read: verify connection, detect AIOSEO, list posts/pages, fetch a single
// item for editing, and analyze its live URL.
// Write: apply SEO fixes (title / meta description / content incl. JSON-LD
// schema) back to the site via the REST API using an Application Password.
//
// Credentials come from the request body (entered in the UI, kept in the user's
// browser) or from server env (WP_SITE_URL / WP_USER / WP_APP_PASSWORD).
// Nothing is persisted server-side. Writes require valid authentication.

import { extractSignals, fetchHtml } from '../seo-scan/analyze'
import { checkOutboundUrl } from '@/lib/ssrf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function creds(body: Record<string, unknown>) {
  const siteUrl = String(body.siteUrl ?? process.env.WP_SITE_URL ?? '').trim().replace(/\/+$/, '')
  const username = String(body.username ?? process.env.WP_USER ?? '').trim()
  const appPassword = String(body.appPassword ?? process.env.WP_APP_PASSWORD ?? '').trim()
  return { siteUrl, username, appPassword }
}

function authHeaders(username: string, appPassword: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' }
  if (username && appPassword) {
    h.Authorization = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64')
  }
  return h
}

async function wpFetch(
  url: string,
  headers: Record<string, string>,
  opts: { method?: string; body?: string; timeoutMs?: number } = {}
) {
  const blocked = await checkOutboundUrl(url)
  if (blocked) {
    throw new Error(`Blocked outbound URL: ${blocked}`)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12_000)
  try {
    return await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const action = String(body.action ?? 'test')
  const { siteUrl, username, appPassword } = creds(body)
  if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(siteUrl)) {
    return Response.json({ error: 'Enter your WordPress site URL, e.g. https://example.com' }, { status: 400 })
  }
  const headers = authHeaders(username, appPassword)
  const authed = !!(username && appPassword)
  const type = body.type === 'pages' ? 'pages' : 'posts'

  try {
    // ── test ──
    if (action === 'test') {
      const res = await wpFetch(`${siteUrl}/wp-json`, headers)
      if (!res.ok) {
        return Response.json({ error: `WordPress REST API returned ${res.status}. Check the URL and that the REST API is enabled.` }, { status: 502 })
      }
      const data = await res.json()
      const namespaces: string[] = Array.isArray(data?.namespaces) ? data.namespaces : []
      let authValid = false
      if (authed) {
        const probe = await wpFetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=1&context=edit`, headers)
        authValid = probe.ok
      }
      return Response.json({
        ok: true,
        name: data?.name ?? siteUrl,
        description: data?.description ?? '',
        hasAioseo: namespaces.some((n) => n.toLowerCase().includes('aioseo')),
        authProvided: authed,
        authValid,
        namespaces: namespaces.slice(0, 40),
      })
    }

    // ── list ──
    if (action === 'posts' || action === 'pages') {
      const t = action
      const res = await wpFetch(`${siteUrl}/wp-json/wp/v2/${t}?per_page=20&_fields=id,link,title,modified,status`, headers)
      if (!res.ok) return Response.json({ error: `Could not list ${t} (${res.status}).` }, { status: 502 })
      const data = await res.json()
      const items = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => ({
        id: p.id,
        link: p.link,
        title: typeof p.title === 'object' && p.title ? String((p.title as Record<string, unknown>).rendered ?? '') : String(p.title ?? ''),
        modified: p.modified ?? null,
        status: p.status ?? null,
      }))
      return Response.json({ ok: true, type: t, items })
    }

    // ── get one for editing (+ live analysis) ──
    if (action === 'get') {
      const id = Number(body.id)
      if (!id) return Response.json({ error: 'Missing post id.' }, { status: 400 })
      const res = await wpFetch(`${siteUrl}/wp-json/wp/v2/${type}/${id}?context=edit&_fields=id,link,title,excerpt,content,status,aioseo_meta_data`, headers)
      if (!res.ok) {
        return Response.json({ error: res.status === 401 ? 'Authentication required to read this item for editing.' : `Could not load item (${res.status}).` }, { status: 502 })
      }
      const d = await res.json()
      const raw = (k: string) => {
        const v = d?.[k]
        return v && typeof v === 'object' ? String(v.raw ?? '') : String(v ?? '')
      }
      // AIOSEO SEO title/description (its own fields — the real <title>/meta).
      const aioseo = d?.aioseo_meta_data && typeof d.aioseo_meta_data === 'object' ? d.aioseo_meta_data : {}
      const aioseoTitle = typeof aioseo.title === 'string' ? aioseo.title : ''
      const aioseoDescription = typeof aioseo.description === 'string' ? aioseo.description : ''
      const link = String(d?.link ?? '')
      let analysis: Record<string, unknown> | null = null
      try {
        const { html, finalUrl, status } = await fetchHtml(link, 8000)
        if (html) {
          const s = extractSignals(html, finalUrl, status)
          analysis = {
            title: s.title,
            titleLength: s.titleLength,
            metaDescription: s.metaDescription,
            metaDescriptionLength: s.metaDescriptionLength,
            h1Count: s.h1Count,
            wordCount: s.wordCount,
            schemaTypes: s.schemaTypes,
            hasOpenGraph: s.hasOpenGraph,
          }
        }
      } catch {
        /* analysis optional */
      }
      return Response.json({
        ok: true,
        post: { id, type, link, title: raw('title'), excerpt: raw('excerpt'), content: raw('content'), status: d?.status ?? null, aioseoTitle, aioseoDescription },
        analysis,
      })
    }

    // ── apply (write) ──
    if (action === 'apply') {
      if (!authed) {
        return Response.json({ error: 'Connect with an Application Password to deploy changes.' }, { status: 401 })
      }
      const id = Number(body.id)
      if (!id) return Response.json({ error: 'Missing post id.' }, { status: 400 })
      const payload: Record<string, unknown> = {}
      if (typeof body.title === 'string') payload.title = body.title
      if (typeof body.excerpt === 'string') payload.excerpt = body.excerpt
      if (typeof body.content === 'string') payload.content = body.content
      // AIOSEO SEO title/description via its REST-exposed field.
      const aioseo: Record<string, string> = {}
      if (typeof body.aioseoTitle === 'string') aioseo.title = body.aioseoTitle
      if (typeof body.aioseoDescription === 'string') aioseo.description = body.aioseoDescription
      if (Object.keys(aioseo).length > 0) payload.aioseo_meta_data = aioseo
      if (Object.keys(payload).length === 0) {
        return Response.json({ error: 'No changes to apply.' }, { status: 400 })
      }
      const res = await wpFetch(`${siteUrl}/wp-json/wp/v2/${type}/${id}`, { ...headers, 'Content-Type': 'application/json' }, { method: 'POST', body: JSON.stringify(payload), timeoutMs: 15_000 })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return Response.json({ error: data?.message ?? `Update failed (${res.status}). The account may lack edit permission.` }, { status: 502 })
      }
      return Response.json({
        ok: true,
        id,
        link: data?.link ?? null,
        applied: Object.keys(payload),
      })
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Could not reach the WordPress site. Check the URL and that it is publicly accessible.' }, { status: 502 })
  }
}
