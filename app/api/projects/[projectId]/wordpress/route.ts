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
import { audit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { encryptSecret } from '@/lib/foundation/crypto'
import { getStore } from '@/lib/foundation/store'
import { executeWpDeployment, rollbackWpDeployment } from '@/lib/foundation/wp-execution'
import type { WpConnection } from '@/lib/foundation/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export const PUT = handled(async (request, { params }) => {
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
  const nsProbe = await fetch(`${siteUrl}/wp-json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  const aioseo = Array.isArray((nsProbe as { namespaces?: string[] } | null)?.namespaces)
    ? ((nsProbe as { namespaces: string[] }).namespaces.some((n) => n.startsWith('aioseo')))
    : false

  const conn: WpConnection = {
    id: randomUUID(),
    projectId,
    siteUrl,
    username,
    appPasswordEnc: encryptSecret(appPassword),
    aioseo,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
  const store = await getStore()
  await store.upsertWpConnection(conn)
  await audit(project.orgId, user.id, 'wordpress.connect', projectId, siteUrl)
  return Response.json({ connection: { siteUrl, username, aioseo } })
})

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const conn = await store.getWpConnection(projectId)
  const deployments = await store.listWpDeployments(projectId)
  return Response.json({
    connection: conn ? { siteUrl: conn.siteUrl, username: conn.username, aioseo: conn.aioseo } : null,
    deployments,
  })
})

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const store = await getStore()
  const connection = await store.getWpConnection(projectId)
  if (!connection) throw new HttpError(400, 'Connect WordPress for this project first.')

  if (body.action === 'deploy') {
    const postId = Number(body.postId)
    const postType = body.postType === 'pages' ? ('pages' as const) : ('posts' as const)
    const title = body.title === undefined ? undefined : String(body.title).slice(0, 300)
    const metaDescription =
      body.metaDescription === undefined ? undefined : String(body.metaDescription).slice(0, 500)
    const reason = String(body.reason ?? '').slice(0, 1000)
    if (!Number.isInteger(postId) || postId <= 0) throw new HttpError(400, 'postId required.')
    if (title === undefined && metaDescription === undefined) {
      throw new HttpError(400, 'Nothing to deploy — provide title and/or metaDescription.')
    }
    if (!reason) throw new HttpError(400, 'A reason is required for every deployment.')

    const dep = await executeWpDeployment({
      projectId,
      connection,
      postId,
      postType,
      changes: { title, metaDescription },
      approvedBy: user.id,
      reason,
      recommendationId: body.recommendationId ? String(body.recommendationId) : undefined,
    })
    await audit(project.orgId, user.id, 'wordpress.deploy', dep.id, `${postType}/${postId}: ${dep.status}`)
    return Response.json({ deployment: dep }, { status: dep.status === 'failed' ? 502 : 201 })
  }

  if (body.action === 'rollback') {
    const dep = await store.getWpDeployment(String(body.deploymentId ?? ''))
    if (!dep || dep.projectId !== projectId) throw new HttpError(404, 'Deployment not found.')
    if (dep.status === 'rolled_back') throw new HttpError(400, 'Already rolled back.')
    if (dep.status === 'failed') throw new HttpError(400, 'Nothing was applied — no rollback needed.')
    const updated = await rollbackWpDeployment({ deployment: dep, connection, actorId: user.id })
    await audit(project.orgId, user.id, 'wordpress.rollback', dep.id, updated.result)
    return Response.json({ deployment: updated })
  }

  throw new HttpError(400, 'Unknown action.')
})
