// Server-side WordPress execution.
//
// Ported from the root RankForge app's lib/foundation/wp-execution.ts (594
// lines, live-validated against a real WordPress install — see
// LIVE_WORDPRESS_VALIDATION.md there), which this file's own prior version
// named as the real implementation it was simulating. WpConnection and
// WpDeployment are byte-identical between the two apps, so the port is
// mechanical: same wire format, same verify-by-read-back guarantee, same
// SSRF guard (now ported too — see url-guard.ts).
//
// Every change: capture BEFORE from the live site, apply, re-read to VERIFY,
// and persist the full record (before/after/approver/reason/verification/
// rollback data) in the store. Rollback re-applies the captured before
// values and is itself verified. Nothing depends on browser state.
//
// Deliberately NOT ported (nothing in this app calls them): installWpPlugin,
// listWpItems/listAllWpItems, getWpItem, createWpDraftPost. Porting unused
// surface area is dead code; add them when a real caller needs them.
//
// Verified against a local HTTP test double (scripts/check-wordpress.mts),
// not a real WordPress site — none is reachable from this environment. See
// that script's own header for exactly what that does and does not prove.

import { createHash, randomUUID } from 'crypto'
import { isSafeFetchTarget } from './url-guard'
import { decryptSecret } from './crypto'
import { getStore } from './store'
import { applyContentTransform, verifyContentTransform, type ContentTransform } from './operator/content-fix'
import { emitActivity } from './activity/emit'
import type { SeoPlugin, WpConnection, WpDeployment } from './types'

// Resolve the effective SEO plugin for a connection, honouring the legacy
// `aioseo` boolean on records created before `seoPlugin` existed.
export function pluginOf(conn: WpConnection): SeoPlugin {
  return conn.seoPlugin ?? (conn.aioseo ? 'aioseo' : 'core')
}

// Detect which SEO plugin manages meta storage from the site's advertised
// REST namespaces, so writes land in the field that plugin actually renders
// (AIOSEO → aioseo_meta_data, Rank Math → rank_math_*, Yoast → _yoast_wpseo_*,
// otherwise the native excerpt). Used when a connection is first made.
export async function detectSeoPlugin(siteUrl: string): Promise<SeoPlugin> {
  const target = `${siteUrl}/wp-json`
  const safe = await isSafeFetchTarget(target)
  if (!safe.ok) return 'core'
  const probe = await fetch(target).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  const namespaces = Array.isArray((probe as { namespaces?: string[] } | null)?.namespaces)
    ? (probe as { namespaces: string[] }).namespaces
    : []
  const has = (prefix: string) => namespaces.some((n) => n.startsWith(prefix))
  return has('aioseo') ? 'aioseo' : has('rankmath') ? 'rankmath' : has('yoast') ? 'yoast' : 'core'
}

// Post-meta keys each plugin uses to store the SEO meta description. Reading
// and writing both go through these so a Rank Math / Yoast site's description
// lands in (and is read back from) the field the plugin actually renders.
const META_DESC_KEY: Record<Exclude<SeoPlugin, 'core' | 'aioseo'>, string> = {
  rankmath: 'rank_math_description',
  yoast: '_yoast_wpseo_metadesc',
}

// The set of fields a deployment may change. title/metaDescription are direct
// writes; contentTransform is applied to the LIVE post body at deploy time
// and produces the `content` write.
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
// post/page id by slug, so the user doesn't re-enter a post id by hand.
// Returns null for the homepage or when no match is found (caller must fall
// back to manual selection — reported honestly, never guessed).
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
  // SSRF guard: the WordPress site URL is tenant-supplied and must be
  // re-validated (resolved-IP + port) before every request — a connection
  // could point at an internal host or a name that later rebinds.
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

function snapshotFrom(raw: Record<string, unknown>, plugin: SeoPlugin): WpPostSnapshot {
  const title = (raw.title as { raw?: string; rendered?: string } | undefined) ?? {}
  const content = (raw.content as { raw?: string; rendered?: string } | undefined) ?? {}
  const meta = (raw.meta as Record<string, unknown> | undefined) ?? {}
  const aioseoMeta = (raw.aioseo_meta_data as { description?: string } | undefined) ?? {}
  // Read the meta description from the field the active plugin actually uses,
  // so "before" reflects what the site renders (and matches "after" at verify).
  let metaDescription: string
  switch (plugin) {
    case 'aioseo':
      metaDescription = aioseoMeta.description ?? (meta._aioseo_description as string) ?? ''
      break
    case 'rankmath':
      metaDescription = (meta[META_DESC_KEY.rankmath] as string) ?? ''
      break
    case 'yoast':
      metaDescription = (meta[META_DESC_KEY.yoast] as string) ?? ''
      break
    default:
      metaDescription = (raw.excerpt as { raw?: string } | undefined)?.raw ?? ''
  }
  return {
    title: title.raw ?? title.rendered ?? '',
    metaDescription,
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
  return snapshotFrom(raw, pluginOf(conn))
}

function updatePayload(conn: WpConnection, changes: WpChanges): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  // Title is written to the native post title for every plugin. Absent a
  // per-plugin title override, the post title is what renders in <title>.
  if (changes.title !== undefined) payload.title = changes.title
  if (changes.content !== undefined) payload.content = changes.content
  if (changes.metaDescription !== undefined) {
    // Route the meta description to the field the detected plugin renders
    // from. Read-back verification (executeWpDeployment step 3) confirms it
    // persisted, so a plugin that blocks the write surfaces as
    // verify_failed, never a false success.
    switch (pluginOf(conn)) {
      case 'aioseo':
        payload.aioseo_meta_data = { description: changes.metaDescription }
        payload.meta = { _aioseo_description: changes.metaDescription }
        break
      case 'rankmath':
        payload.meta = { [META_DESC_KEY.rankmath]: changes.metaDescription }
        break
      case 'yoast':
        payload.meta = { [META_DESC_KEY.yoast]: changes.metaDescription }
        break
      default:
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
  orgId: string
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

  // 1b. Resolve a content transform against the LIVE body. If the invariant
  // already holds, the transform is a no-op and we don't write it.
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

  // 1c. Nothing to write: a content transform whose invariant already holds
  // and no title/meta change. Record it honestly as verified without
  // touching WP.
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
    // Content is verified by the transform's invariant (WP may reformat the
    // raw body, so an exact-string compare would false-fail — the invariant
    // is what actually matters, e.g. "no insecure http:// host remains").
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

  // Outcome-measurement flywheel: only a CONFIRMED live change is worth
  // measuring — a verify_failed/failed deployment has no trustworthy
  // "before this change" baseline distinct from "after". Scheduled 14 days
  // out so Search Console has real before/after windows to compare. Built
  // inline rather than importing a scheduler `makeJob` helper — north-star-hq
  // has no lib/foundation/scheduler module (the root app's job-construction
  // helper is a few trivial field assignments, not worth adding a subsystem
  // for); `outcome_capture` is already a recognized JobKind here (types.ts)
  // and store.enqueueJob already exists.
  if (dep.status === 'verified') {
    const nowIso = new Date().toISOString()
    await store.enqueueJob({
      id: randomUUID(),
      orgId: opts.orgId,
      projectId: opts.projectId,
      kind: 'outcome_capture',
      status: 'queued',
      runAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      payload: { deploymentId: dep.id },
      attempts: 0,
      maxAttempts: 3,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      result: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  }

  return dep
}

export async function rollbackWpDeployment(opts: {
  deployment: WpDeployment
  connection: WpConnection
  actorId: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const dep = opts.deployment
  const project = await store.getProject(dep.projectId)

  if (project) {
    await emitActivity(store, {
      orgId: project.orgId,
      projectId: dep.projectId,
      type: 'rollback.started',
      summary: `Operator is rolling back the deployment on ${dep.postUrl}.`,
      recommendationId: dep.recommendationId ?? null,
      agentRole: 'operator',
      actorId: opts.actorId,
    })
  }

  const restore: WpChanges = {}
  if (dep.after.title !== undefined) restore.title = dep.before.title
  if (dep.after.metaDescription !== undefined) restore.metaDescription = dep.before.metaDescription
  // Content changes restore the captured before-body verbatim.
  if (dep.after.content !== undefined) restore.content = dep.before.content

  // Unlike executeWpDeployment (whose own throw is caught by its one caller,
  // deploy-one.ts, which then emits a resolving activity event), rollback is
  // called from both the batch-rollback route and the single-deployment
  // path, and a bare throw here left rollback.started with no matching
  // finished/failed event — the Activity Stream showed an eternal "Operator
  // is rolling back…" with no resolution, even though the API response
  // itself reported the failure correctly. Emit the resolution here, once,
  // regardless of caller, then rethrow so existing error handling elsewhere
  // is unchanged.
  let afterRead: { title: string; metaDescription: string }
  try {
    await wpFetch(opts.connection, `/${dep.postType}/${dep.postId}`, {
      method: 'POST',
      body: updatePayload(opts.connection, restore),
    })
    // Verify the rollback took.
    afterRead = await readPost(opts.connection, dep.postType, dep.postId)
  } catch (err) {
    if (project) {
      await emitActivity(store, {
        orgId: project.orgId,
        projectId: dep.projectId,
        type: 'rollback.finished',
        summary: `Rollback of ${dep.postUrl} failed: ${err instanceof Error ? err.message : 'unknown error'}.`,
        recommendationId: dep.recommendationId ?? null,
        agentRole: 'operator',
        actorId: opts.actorId,
      })
    }
    throw err
  }
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

  if (project) {
    await emitActivity(store, {
      orgId: project.orgId,
      projectId: dep.projectId,
      type: 'rollback.finished',
      summary: `Rollback of ${dep.postUrl} finished: ${dep.result}`,
      recommendationId: dep.recommendationId ?? null,
      agentRole: 'operator',
      actorId: opts.actorId,
    })
  }
  return dep
}
