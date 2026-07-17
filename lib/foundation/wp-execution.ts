// Server-side WordPress execution (A6).
//
// Every change: capture BEFORE from the live site, apply, re-read to VERIFY,
// and persist the full record (before/after/approver/reason/verification/
// rollback data) in the store. Rollback re-applies the captured before
// values and is itself verified. Nothing depends on browser state.

import { createHash, randomUUID } from 'crypto'
import { decryptSecret } from './crypto'
import { getStore } from './store'
import type { WpConnection, WpDeployment } from './types'

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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  const res = await fetch(`${conn.siteUrl}/wp-json/wp/v2${path}`, {
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

function updatePayload(
  conn: WpConnection,
  changes: { title?: string; metaDescription?: string }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (changes.title !== undefined) payload.title = changes.title
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
  changes: { title?: string; metaDescription?: string }
  approvedBy: string
  reason: string
  recommendationId?: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const now = new Date().toISOString()

  // 1. Capture BEFORE from the live site. If this fails the deployment is
  // aborted — a change without rollback data is never applied.
  const before = await readPost(opts.connection, opts.postType, opts.postId)

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
    after: opts.changes,
    approvedBy: opts.approvedBy,
    approvedAt: now,
    reason: opts.reason,
    recommendationId: opts.recommendationId,
    status: 'applied',
    verification: null,
    result: '',
    createdAt: now,
  }

  // 2. Apply.
  try {
    await wpFetch(opts.connection, `/${opts.postType}/${opts.postId}`, {
      method: 'POST',
      body: updatePayload(opts.connection, opts.changes),
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
    const titleMatches = opts.changes.title === undefined ? null : afterRead.title === opts.changes.title
    const metaMatches =
      opts.changes.metaDescription === undefined
        ? null
        : afterRead.metaDescription === opts.changes.metaDescription
    const allOk = [titleMatches, metaMatches].every((v) => v !== false)
    dep.status = allOk ? 'verified' : 'verify_failed'
    dep.verification = {
      checkedAt: new Date().toISOString(),
      titleMatches,
      metaMatches,
      note: allOk
        ? 'Re-read the post after applying; all requested fields match.'
        : 'Some fields did not persist (plugin may store them separately). The change was applied but could not be fully verified.',
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

  const restore: { title?: string; metaDescription?: string } = {}
  if (dep.after.title !== undefined) restore.title = dep.before.title
  if (dep.after.metaDescription !== undefined) restore.metaDescription = dep.before.metaDescription

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
