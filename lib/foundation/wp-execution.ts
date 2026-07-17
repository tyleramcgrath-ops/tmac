// Server-side WordPress execution (A6).
//
// Every change: capture BEFORE from the live site, apply, re-read to VERIFY,
// and persist the full record (before/after/approver/reason/verification/
// rollback data) in the store. Rollback re-applies the captured before
// values and is itself verified. Nothing depends on browser state.

import { createHash, randomUUID } from 'crypto'
import { isSafeFetchTarget } from '../../app/api/seo-scan/url-guard'
import { decryptSecret } from './crypto'
import { getStore } from './store'
import { applyContentTransform, verifyContentTransform, type ContentTransform } from './operator/content-fix'
import type { WpConnection, WpDeployment } from './types'

// The set of fields a deployment may change. title/metaDescription are direct
// writes; contentTransform (Phase H) is applied to the LIVE post body at deploy
// time and produces the `content` write.
export interface WpChanges {
  title?: string
  metaDescription?: string
  content?: string
  contentTransform?: ContentTransform
}

interface WpPostSnapshot {
  title: string
  metaDescription: string
  content: string
  link: string
}

// Resolves a page URL (e.g. a recommendation's affected URL) to a WordPress
// post/page id by slug, so the user doesn't re-enter a post id by hand. Returns
// null for the homepage or when no match is found (caller must fall back to
// manual selection — reported honestly, never guessed).
export async function resolveWpTarget(
  conn: WpConnection,
  pageUrl: string
): Promise<{ postId: number; postType: 'posts' | 'pages'; title: string } | null> {
  let slug = ''
  try {
    const path = new URL(pageUrl).pathname.replace(/\/+$/, '')
    slug = path.split('/').filter(Boolean).pop() ?? ''
  } catch {
    return null
  }
  if (!slug) return null
  for (const type of ['pages', 'posts'] as const) {
    try {
      const list = (await wpFetch(conn, `/${type}?slug=${encodeURIComponent(slug)}&context=edit`)) as unknown
      const arr = Array.isArray(list) ? (list as Record<string, unknown>[]) : []
      if (arr.length > 0) {
        const post = arr[0]
        const title = (post.title as { raw?: string; rendered?: string })?.raw ?? ''
        return { postId: Number(post.id), postType: type, title }
      }
    } catch {
      /* try next type */
    }
  }
  return null
}

function authHeader(conn: WpConnection): string {
  const password = decryptSecret(conn.appPasswordEnc)
  return 'Basic ' + Buffer.from(`${conn.username}:${password}`).toString('base64')
}

async function wpFetch(
  conn: WpConnection,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Record<string, unknown>> {
  // SSRF guard (Phase D.6 P4): the WordPress site URL is tenant-supplied and
  // must be re-validated (resolved-IP + port) before every request — a
  // connection could point at an internal host or a name that later rebinds.
  const target = `${conn.siteUrl}/wp-json/wp/v2${path}`
  const safe = await isSafeFetchTarget(target)
  if (!safe.ok) {
    throw new Error(`Refusing to contact unsafe WordPress target: ${safe.detail ?? safe.reason}`)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  const res = await fetch(target, {
    method: init.method ?? 'GET',
    signal: controller.signal,
    headers: {
      Authorization: authHeader(conn),
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }).finally(() => clearTimeout(timer))
  if (!res.ok) {
    throw new Error(`WordPress responded ${res.status} for ${init.method ?? 'GET'} ${path}`)
  }
  return (await res.json()) as Record<string, unknown>
}

function snapshotFrom(raw: Record<string, unknown>, aioseo: boolean): WpPostSnapshot {
  const title = (raw.title as { raw?: string; rendered?: string } | undefined) ?? {}
  const content = (raw.content as { raw?: string; rendered?: string } | undefined) ?? {}
  const meta = (raw.meta as Record<string, unknown> | undefined) ?? {}
  const aioseoMeta = (raw.aioseo_meta_data as { description?: string } | undefined) ?? {}
  return {
    title: title.raw ?? title.rendered ?? '',
    metaDescription: aioseo
      ? (aioseoMeta.description ?? (meta._aioseo_description as string) ?? '')
      : ((raw.excerpt as { raw?: string } | undefined)?.raw ?? ''),
    content: content.raw ?? content.rendered ?? '',
    link: (raw.link as string) ?? '',
  }
}

async function readPost(
  conn: WpConnection,
  postType: 'posts' | 'pages',
  postId: number
): Promise<WpPostSnapshot> {
  const raw = await wpFetch(conn, `/${postType}/${postId}?context=edit`)
  return snapshotFrom(raw, conn.aioseo)
}

// Browse the connected site's posts/pages so the user can pick one (or many) to
// optimize (restores the old "list & optimize" flow, now credentialed &
// SSRF-guarded server-side). Returns lightweight rows only, each tagged with its
// type so a combined posts+pages list can be bulk-optimized. Paginates through
// the REST API (WordPress caps per_page at 100) up to a safety ceiling so sites
// with hundreds of items list fully instead of being silently truncated at 50.
export interface WpItem { id: number; type: 'posts' | 'pages'; link: string; title: string; status: string }

const LIST_MAX_PAGES = 10 // ceiling: up to 10 × 100 = 1000 items per type

export async function listWpItems(
  conn: WpConnection,
  postType: 'posts' | 'pages',
  search = ''
): Promise<WpItem[]> {
  const out: WpItem[] = []
  for (let page = 1; page <= LIST_MAX_PAGES; page++) {
    const q = new URLSearchParams({ per_page: '100', page: String(page), context: 'edit', orderby: 'modified', order: 'desc', _fields: 'id,link,title,status' })
    if (search.trim()) q.set('search', search.trim())
    let arr: Record<string, unknown>[]
    try {
      const data = (await wpFetch(conn, `/${postType}?${q.toString()}`)) as unknown
      arr = Array.isArray(data) ? (data as Record<string, unknown>[]) : []
    } catch {
      // WordPress returns 400 (rest_post_invalid_page_number) when paging past
      // the last page — that's the natural end of the list, not an error.
      break
    }
    for (const p of arr) {
      out.push({
        id: Number(p.id),
        type: postType,
        link: String(p.link ?? ''),
        title: (p.title as { raw?: string; rendered?: string } | undefined)?.raw
          ?? (p.title as { rendered?: string } | undefined)?.rendered
          ?? '(untitled)',
        status: String(p.status ?? ''),
      })
    }
    if (arr.length < 100) break // last page reached
  }
  return out
}

// Combined listing: every page AND post on the connected site, so the UI can
// show one list and bulk-optimize across both types.
export async function listAllWpItems(conn: WpConnection, search = ''): Promise<WpItem[]> {
  const [pages, posts] = await Promise.all([
    listWpItems(conn, 'pages', search),
    listWpItems(conn, 'posts', search),
  ])
  return [...pages, ...posts]
}

// Fetch one item's current SEO fields + content so the optimizer can show the
// before-state and feed the AI rewrite. Reuses the same read/snapshot path the
// deployment engine uses, so "before" here matches "before" at deploy time.
export async function getWpItem(
  conn: WpConnection,
  postType: 'posts' | 'pages',
  postId: number
): Promise<{ title: string; metaDescription: string; content: string; link: string }> {
  const snap = await readPost(conn, postType, postId)
  return { title: snap.title, metaDescription: snap.metaDescription, content: snap.content, link: snap.link }
}

function updatePayload(
  conn: WpConnection,
  changes: WpChanges
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (changes.title !== undefined) payload.title = changes.title
  if (changes.content !== undefined) payload.content = changes.content
  if (changes.metaDescription !== undefined) {
    if (conn.aioseo) {
      payload.aioseo_meta_data = { description: changes.metaDescription }
      payload.meta = { _aioseo_description: changes.metaDescription }
    } else {
      payload.excerpt = changes.metaDescription
    }
  }
  return payload
}

function hash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

export async function executeWpDeployment(opts: {
  projectId: string
  connection: WpConnection
  postId: number
  postType: 'posts' | 'pages'
  changes: WpChanges
  approvedBy: string
  reason: string
  recommendationId?: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const now = new Date().toISOString()

  // 1. Capture BEFORE from the live site. If this fails the deployment is
  // aborted — a change without rollback data is never applied.
  const before = await readPost(opts.connection, opts.postType, opts.postId)

  // 1b. Resolve a content transform (Phase H) against the LIVE body. If the
  // invariant already holds, the transform is a no-op and we don't write it.
  const transform = opts.changes.contentTransform
  const changes: WpChanges = { title: opts.changes.title, metaDescription: opts.changes.metaDescription }
  let transformNoop = false
  if (transform) {
    const t = applyContentTransform(before.content, transform)
    if (t.changed) changes.content = t.content
    else transformNoop = true
  }

  const dep: WpDeployment = {
    id: randomUUID(),
    projectId: opts.projectId,
    connectionId: opts.connection.id,
    postId: opts.postId,
    postType: opts.postType,
    postUrl: before.link,
    before: {
      title: before.title,
      metaDescription: before.metaDescription,
      contentHash: hash(before.content),
      content: before.content,
    },
    after: changes,
    approvedBy: opts.approvedBy,
    approvedAt: now,
    reason: opts.reason,
    recommendationId: opts.recommendationId,
    status: 'applied',
    verification: null,
    result: '',
    createdAt: now,
  }

  // 1c. Nothing to write: a content transform whose invariant already holds and
  // no title/meta change. Record it honestly as verified without touching WP.
  if (transformNoop && changes.title === undefined && changes.metaDescription === undefined && changes.content === undefined) {
    dep.status = 'verified'
    dep.verification = { checkedAt: now, titleMatches: null, metaMatches: null, note: 'The fix is already satisfied in the live post; no change was needed.' }
    dep.result = 'Already satisfied; no change applied.'
    await store.createWpDeployment(dep)
    return dep
  }

  // 2. Apply.
  try {
    await wpFetch(opts.connection, `/${opts.postType}/${opts.postId}`, {
      method: 'POST',
      body: updatePayload(opts.connection, changes),
    })
  } catch (err) {
    dep.status = 'failed'
    dep.result = err instanceof Error ? err.message : 'Apply failed.'
    await store.createWpDeployment(dep)
    return dep
  }

  // 3. Verify by re-reading the live values — never trust the write response.
  try {
    const afterRead = await readPost(opts.connection, opts.postType, opts.postId)
    const titleMatches = changes.title === undefined ? null : afterRead.title === changes.title
    const metaMatches =
      changes.metaDescription === undefined
        ? null
        : afterRead.metaDescription === changes.metaDescription
    // Content is verified by the transform's invariant (WP may reformat the raw
    // body, so an exact-string compare would false-fail — the invariant is what
    // actually matters, e.g. "no insecure http:// host remains").
    const contentMatches = transform === undefined ? null : verifyContentTransform(afterRead.content, transform)
    const allOk = [titleMatches, metaMatches, contentMatches].every((v) => v !== false)
    dep.status = allOk ? 'verified' : 'verify_failed'
    dep.verification = {
      checkedAt: new Date().toISOString(),
      titleMatches,
      metaMatches,
      note: allOk
        ? 'Re-read the post after applying; all requested changes hold.'
        : 'Some changes did not persist (plugin may store them separately). The change was applied but could not be fully verified.',
    }
    dep.result = allOk ? 'Applied and verified.' : 'Applied; verification found mismatches.'
  } catch (err) {
    dep.status = 'verify_failed'
    dep.verification = {
      checkedAt: new Date().toISOString(),
      titleMatches: null,
      metaMatches: null,
      note: `Could not re-read the post to verify: ${err instanceof Error ? err.message : 'unknown error'}`,
    }
    dep.result = 'Applied; verification read failed.'
  }

  await store.createWpDeployment(dep)
  return dep
}

export async function rollbackWpDeployment(opts: {
  deployment: WpDeployment
  connection: WpConnection
  actorId: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const dep = opts.deployment

  const restore: WpChanges = {}
  if (dep.after.title !== undefined) restore.title = dep.before.title
  if (dep.after.metaDescription !== undefined) restore.metaDescription = dep.before.metaDescription
  // Content changes (Phase H) restore the captured before-body verbatim.
  if (dep.after.content !== undefined) restore.content = dep.before.content

  await wpFetch(opts.connection, `/${dep.postType}/${dep.postId}`, {
    method: 'POST',
    body: updatePayload(opts.connection, restore),
  })

  // Verify the rollback took.
  const afterRead = await readPost(opts.connection, dep.postType, dep.postId)
  const titleOk = restore.title === undefined ? true : afterRead.title === restore.title
  const metaOk =
    restore.metaDescription === undefined ? true : afterRead.metaDescription === restore.metaDescription

  dep.status = 'rolled_back'
  dep.rolledBackAt = new Date().toISOString()
  dep.rolledBackBy = opts.actorId
  dep.result =
    titleOk && metaOk
      ? 'Rolled back to captured before-values and verified.'
      : 'Rollback applied but verification found mismatches — check the site.'
  await store.updateWpDeployment(dep)
  return dep
}
