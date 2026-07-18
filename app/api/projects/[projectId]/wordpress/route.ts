// Project-scoped WordPress execution (A6).
//
// PUT   — store the connection (application password encrypted at rest).
// GET   — connection status (never returns the password) + deployment history.
// POST  {action:'deploy'}   — server-side apply with before-capture,
//                             verification, and a durable execution record.
// POST  {action:'rollback'} — restore captured before-values; verified.
//
// Deploy/rollback require the admin role. Records survive browser close,
// session expiry, and device change — they live in the store.

import { randomUUID } from 'crypto'
import { assertSameOrigin, audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { encryptSecret } from '@/lib/foundation/crypto'
import { getStore } from '@/lib/foundation/store'
import { isSafeFetchTarget } from '@/app/api/seo-scan/url-guard'
import { executeWpDeployment, getWpItem, listAllWpItems, listWpItems, resolveWpTarget, rollbackWpDeployment } from '@/lib/foundation/wp-execution'
import { pluginOf } from '@/lib/foundation/wp-execution'
import type { SeoPlugin, WpConnection } from '@/lib/foundation/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export const PUT = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'wp-connect', 20)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const siteUrl = String(body.siteUrl ?? '').trim().replace(/\/+$/, '')
  const username = String(body.username ?? '').trim()
  const appPassword = String(body.appPassword ?? '').trim()
  if (!/^https?:\/\//.test(siteUrl) || !username || !appPassword) {
    return Response.json(
      { error: 'siteUrl, username, and appPassword are required.' },
      { status: 400 }
    )
  }

  // SSRF guard (RC1): the connect probe fetches a tenant-supplied URL with an
  // Authorization header, so it MUST pass the same resolved-IP/port guard as
  // every other outbound fetch — otherwise an admin could point siteUrl at
  // 169.254.169.254, an internal host, or an odd port and use the probe as an
  // internal-network / cloud-metadata request-forgery + reachability oracle
  // (and leak the Basic header to it). Reject unsafe targets before any fetch.
  const safe = await isSafeFetchTarget(`${siteUrl}/wp-json/wp/v2/users/me`)
  if (!safe.ok) {
    return Response.json({ error: `Refusing to connect to an unsafe WordPress URL: ${safe.detail ?? safe.reason}` }, { status: 400 })
  }

  // Validate the credentials against the live site before storing.
  const probe = await fetch(`${siteUrl}/wp-json/wp/v2/users/me?context=edit`, {
    headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64') },
  }).catch(() => null)
  if (!probe || !probe.ok) {
    return Response.json(
      { error: `Could not authenticate against ${siteUrl} (${probe ? `HTTP ${probe.status}` : 'unreachable'}).` },
      { status: 502 }
    )
  }
  // Detect which SEO plugin manages meta storage from the site's REST
  // namespaces, so the meta description is written to the field that plugin
  // actually renders (AIOSEO → aioseo_meta_data, Rank Math → rank_math_*,
  // Yoast → _yoast_wpseo_*, otherwise the native excerpt).
  const nsProbe = await fetch(`${siteUrl}/wp-json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  const namespaces = Array.isArray((nsProbe as { namespaces?: string[] } | null)?.namespaces)
    ? (nsProbe as { namespaces: string[] }).namespaces
    : []
  const has = (prefix: string) => namespaces.some((n) => n.startsWith(prefix))
  const seoPlugin: SeoPlugin = has('aioseo') ? 'aioseo' : has('rankmath') ? 'rankmath' : has('yoast') ? 'yoast' : 'core'

  const conn: WpConnection = {
    id: randomUUID(),
    projectId,
    siteUrl,
    username,
    appPasswordEnc: encryptSecret(appPassword),
    aioseo: seoPlugin === 'aioseo',
    seoPlugin,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
  const store = await getStore()
  await store.upsertWpConnection(conn)
  await audit(project.orgId, user.id, 'wordpress.connect', projectId, siteUrl)
  return Response.json({ connection: { siteUrl, username, aioseo: conn.aioseo, seoPlugin } })
})

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const conn = await store.getWpConnection(projectId)
  const deployments = await store.listWpDeployments(projectId)
  return Response.json({
    connection: conn ? { siteUrl: conn.siteUrl, username: conn.username, aioseo: conn.aioseo, seoPlugin: pluginOf(conn) } : null,
    deployments,
  })
})

export const POST = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'wp-deploy', 60)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const store = await getStore()
  const connection = await store.getWpConnection(projectId)
  if (!connection) throw new HttpError(400, 'Connect WordPress for this project first.')

  // Browse the connected site so the user can one-click (or bulk) optimize any
  // page/post. 'all' returns every page AND post so both can be listed together.
  if (body.action === 'list') {
    const search = String(body.search ?? '')
    if (body.postType === 'all') {
      const items = await listAllWpItems(connection, search)
      return Response.json({ items })
    }
    const postType = body.postType === 'pages' ? ('pages' as const) : ('posts' as const)
    const items = await listWpItems(connection, postType, search)
    return Response.json({ items })
  }

  // Fetch one item's current SEO fields + content for the optimizer.
  if (body.action === 'get') {
    const postType = body.postType === 'pages' ? ('pages' as const) : ('posts' as const)
    const postId = Number(body.postId)
    if (!Number.isInteger(postId) || postId <= 0) throw new HttpError(400, 'postId required.')
    const post = await getWpItem(connection, postType, postId)
    return Response.json({ post: { ...post, postId, postType } })
  }

  // Map a recommendation's affected URL to a WordPress post so the user need
  // not re-enter a post id. Honest fallback: returns resolved:false when no
  // match, and the UI then requires manual selection.
  if (body.action === 'resolve') {
    const pageUrl = String(body.url ?? '')
    const target = await resolveWpTarget(connection, pageUrl)
    return Response.json({ resolved: !!target, target })
  }

  if (body.action === 'deploy') {
    const postId = Number(body.postId)
    const postType = body.postType === 'pages' ? ('pages' as const) : ('posts' as const)
    const title = body.title === undefined ? undefined : String(body.title).slice(0, 300)
    const metaDescription =
      body.metaDescription === undefined ? undefined : String(body.metaDescription).slice(0, 500)
    // Optional structured data (JSON-LD): deployed as a managed, reversible block
    // in the post body via the verified content-transform path.
    const jsonLd = body.jsonLd === undefined ? undefined : String(body.jsonLd).slice(0, 20000)
    const reason = String(body.reason ?? '').slice(0, 1000)
    if (!Number.isInteger(postId) || postId <= 0) throw new HttpError(400, 'postId required.')
    if (title === undefined && metaDescription === undefined && jsonLd === undefined) {
      throw new HttpError(400, 'Nothing to deploy — provide a title, meta description, and/or structured data.')
    }
    if (!reason) throw new HttpError(400, 'A reason is required for every deployment.')

    const recommendationId = body.recommendationId ? String(body.recommendationId) : undefined
    const dep = await executeWpDeployment({
      projectId,
      orgId: project.orgId,
      connection,
      postId,
      postType,
      changes: {
        title,
        metaDescription,
        contentTransform: jsonLd ? { type: 'set-jsonld', jsonLd } : undefined,
      },
      approvedBy: user.id,
      reason,
      recommendationId,
    })
    // Reflect the deployment on the linked recommendation: deployed & verified
    // if read-back matched, otherwise leave it (still deployed) for the user.
    if (recommendationId && dep.status !== 'failed') {
      const rec = await store.getRecommendation(recommendationId)
      if (rec && rec.projectId === projectId) {
        const to = dep.status === 'verified' ? 'verified' : 'deployed'
        rec.history.push({ at: new Date().toISOString(), by: user.id, from: rec.status, to })
        rec.status = to
        await store.updateRecommendation(rec)
      }
    }
    await audit(project.orgId, user.id, 'wordpress.deploy', dep.id, `${postType}/${postId}: ${dep.status}`)
    return Response.json({ deployment: dep }, { status: dep.status === 'failed' ? 502 : 201 })
  }

  if (body.action === 'rollback') {
    const dep = await store.getWpDeployment(String(body.deploymentId ?? ''))
    if (!dep || dep.projectId !== projectId) throw new HttpError(404, 'Deployment not found.')
    if (dep.status === 'rolled_back') throw new HttpError(400, 'Already rolled back.')
    if (dep.status === 'failed') throw new HttpError(400, 'Nothing was applied — no rollback needed.')
    const updated = await rollbackWpDeployment({ deployment: dep, connection, actorId: user.id })
    // Reflect rollback on the linked recommendation.
    if (dep.recommendationId) {
      const rec = await store.getRecommendation(dep.recommendationId)
      if (rec && rec.projectId === projectId && rec.status !== 'rolled_back') {
        rec.history.push({ at: new Date().toISOString(), by: user.id, from: rec.status, to: 'rolled_back' })
        rec.status = 'rolled_back'
        await store.updateRecommendation(rec)
      }
    }
    await audit(project.orgId, user.id, 'wordpress.rollback', dep.id, updated.result)
    return Response.json({ deployment: updated })
  }

  throw new HttpError(400, 'Unknown action.')
})
