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
import { makeJob } from './scheduler/engine'
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
// otherwise the native excerpt). Used both when a connection is first made
// and to re-detect after installing a plugin.
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

// Post-meta keys each plugin uses to store the SEO meta description. Reading and
// writing both go through these so a Rank Math / Yoast site's description lands
// in (and is read back from) the field the plugin actually renders.
const META_DESC_KEY: Record<Exclude<SeoPlugin, 'core' | 'aioseo'>, string> = {
  rankmath: 'rank_math_description',
  yoast: '_yoast_wpseo_metadesc',
}

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

// WordPress.org plugin slugs for the two SEO plugins we can offer to install.
export type InstallablePlugin = 'yoast' | 'aioseo'
const PLUGIN_SLUG: Record<InstallablePlugin, string> = {
  yoast: 'wordpress-seo',
  aioseo: 'all-in-one-seo-pack',
}
const PLUGIN_LABEL: Record<InstallablePlugin, string> = {
  yoast: 'Yoast SEO',
  aioseo: 'All in One SEO',
}

export type InstallPluginResult =
  | { ok: true; seoPlugin: SeoPlugin }
  | { ok: false; error: string }

// Install + activate an SEO plugin via WordPress core's REST API
// (POST /wp/v2/plugins, available since WP 5.5), using the same Application
// Password credential already stored for content writes — no new auth.
// EXPLICIT USER APPROVAL ONLY: this is never triggered automatically; it
// runs exactly once, when the user clicks "Install X" for a specific plugin.
//
// This is a materially different risk than a title/meta/content write — it
// executes arbitrary plugin code with full site privileges and has no clean
// rollback (deactivating it later doesn't undo whatever it already did:
// database tables, hooks, etc.). It's also unreliable across hosts: many
// managed WP hosts (WP Engine, Kinsta, SiteGround, ...) block direct
// filesystem writes and require FTP/SSH credentials entered in wp-admin,
// which makes the REST install fail there — an expected, honest failure,
// not a bug. Every failure mode is surfaced with its real reason; nothing is
// silently retried or worked around.
export async function installWpPlugin(conn: WpConnection, plugin: InstallablePlugin): Promise<InstallPluginResult> {
  const slug = PLUGIN_SLUG[plugin]
  const target = `${conn.siteUrl}/wp-json/wp/v2/plugins`
  const safe = await isSafeFetchTarget(target)
  if (!safe.ok) {
    return { ok: false, error: `Refusing to contact unsafe WordPress target: ${safe.detail ?? safe.reason}` }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000) // plugin install can be slow
  let res: Response
  try {
    res = await fetch(target, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: authHeader(conn), 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, status: 'active' }),
    })
  } catch (err) {
    clearTimeout(timer)
    return { ok: false, error: `Could not reach the site: ${err instanceof Error ? err.message : 'network error'}` }
  } finally {
    clearTimeout(timer)
  }

  const body = (await res.json().catch(() => null)) as { code?: string; message?: string; status?: string } | null

  if (!res.ok) {
    return { ok: false, error: honestInstallFailure(res.status, body, plugin) }
  }
  // The endpoint can 200/201 without activating (e.g. status stays
  // 'inactive' if activation needs a second call on some setups) — verify.
  if (body?.status !== 'active') {
    return { ok: false, error: `${PLUGIN_LABEL[plugin]} installed but could not be activated automatically. Activate it from your WordPress admin.` }
  }

  return { ok: true, seoPlugin: plugin }
}

function honestInstallFailure(status: number, body: { code?: string; message?: string } | null, plugin: InstallablePlugin): string {
  const label = PLUGIN_LABEL[plugin]
  switch (body?.code) {
    case 'folder_exists':
      return `${label} appears to already be installed — activate it from your WordPress admin.`
    case 'unable_to_connect_to_filesystem':
    case 'fs_unavailable':
      return `This host requires FTP/SSH credentials for plugin installs and blocks direct writes — install ${label} manually from your WordPress admin (Plugins → Add New).`
    case 'rest_cannot_manage_plugins':
    case 'rest_forbidden':
      return `The connected WordPress user isn't allowed to install plugins (needs Administrator). Install ${label} manually, or reconnect with an admin account.`
    case 'plugins_api_failed':
      return `The site couldn't reach the WordPress.org plugin directory to fetch ${label}. Try again, or install it manually.`
    default:
      return body?.message
        ? `Could not install ${label}: ${body.message}`
        : `Could not install ${label} (HTTP ${status}). Install it manually from your WordPress admin.`
  }
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

export interface WpDraftResult {
  postId: number
  postType: 'posts' | 'pages'
  link: string
  verified: boolean
  note: string
}

// Create a brand-new WordPress post/page as a DRAFT — never published — for
// the Content Studio's AI-drafted briefs. Uses the same field-write mapping
// (title/meta routed to the detected SEO plugin's field) as an ordinary
// deploy, then verifies by re-reading the live post rather than trusting the
// create response, matching the honesty guarantee every other WP write makes.
export async function createWpDraftPost(
  conn: WpConnection,
  postType: 'posts' | 'pages',
  fields: { title: string; content: string; metaDescription?: string }
): Promise<WpDraftResult> {
  const payload = {
    ...updatePayload(conn, { title: fields.title, content: fields.content, metaDescription: fields.metaDescription }),
    status: 'draft',
  }
  const raw = await wpFetch(conn, `/${postType}`, { method: 'POST', body: payload })
  const postId = Number(raw.id)
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new Error('WordPress did not return a valid post id for the new draft.')
  }
  const after = await readPost(conn, postType, postId)
  const verified = after.title === fields.title && (fields.metaDescription === undefined || after.metaDescription === fields.metaDescription)
  return {
    postId,
    postType,
    link: after.link || String(raw.link ?? ''),
    verified,
    note: verified
      ? 'Draft created on WordPress and verified by read-back.'
      : 'Draft created; some fields did not verify on read-back (the active plugin may store them separately).',
  }
}

function updatePayload(
  conn: WpConnection,
  changes: WpChanges
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  // Title is written to the native post title for every plugin — that behaviour
  // is live-validated (RC2) and, absent a per-plugin title override, the post
  // title is what renders in the <title> tag.
  if (changes.title !== undefined) payload.title = changes.title
  if (changes.content !== undefined) payload.content = changes.content
  if (changes.metaDescription !== undefined) {
    // Route the meta description to the field the detected plugin renders from.
    // Read-back verification (executeWpDeployment step 3) confirms it persisted,
    // so a plugin that blocks the write surfaces as verify_failed, never a false
    // success.
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

  // Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): only a CONFIRMED
  // live change is worth measuring — a verify_failed/failed deployment has no
  // trustworthy "before this change" baseline distinct from "after". Scheduled
  // 14 days out so Search Console has real before/after windows to compare.
  if (dep.status === 'verified') {
    const now = new Date()
    await store.enqueueJob(
      makeJob({
        orgId: opts.orgId,
        projectId: opts.projectId,
        kind: 'outcome_capture',
        runAt: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
        payload: { deploymentId: dep.id },
        now,
      })
    )
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
