// Project-scoped WordPress connection.
//
// PUT — validate credentials against the LIVE site, then store the
//        connection (application password encrypted at rest). This is the
//        piece north-star-hq never had: deploy/verify/rollback (Operator,
//        operator/execute/route.ts) already call the real wp-execution.ts
//        functions, but nothing could ever create the WpConnection those
//        calls need — the onboarding wizard's WordPress row has been
//        UI-only ("Available", does nothing) since this app existed.
// GET    — connection status (never returns the password).
// DELETE — disconnect (also how a real connection replaces the seeded demo
//          one every onboarded org starts with; see lib/foundation/seed.ts).
//
// Ported and scoped down from the root RankForge app's
// app/api/projects/[projectId]/wordpress/route.ts. Deliberately NOT ported:
// the deploy/rollback/install-plugin/list/get/resolve POST actions — deploy
// and rollback already go through the Operator flow
// (operator/execute/route.ts), which already calls the real
// executeWpDeployment/rollbackWpDeployment; nothing in this app's UI browses
// or bulk-optimizes WordPress content, so listWpItems/getWpItem/
// installWpPlugin/resolveWpTarget-as-a-route-action would be dead surface
// (resolveWpTarget itself IS used, internally, by deploy-one.ts already).
//
// Requires the admin role, same as the root app.

import { randomUUID } from 'crypto'
import { assertSameOrigin, audit, enforceRateLimit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { encryptSecret } from '@/lib/foundation/crypto'
import { getStore } from '@/lib/foundation/store'
import { isSafeFetchTarget } from '@/lib/foundation/url-guard'
import { detectSeoPlugin, pluginOf } from '@/lib/foundation/wp-execution'
import type { WpConnection } from '@/lib/foundation/types'

export const runtime = 'nodejs'
export const maxDuration = 30

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

  // SSRF guard: the connect probe fetches a tenant-supplied URL with an
  // Authorization header, so it MUST pass the same resolved-IP/port guard as
  // every other outbound fetch — otherwise an admin could point siteUrl at
  // 169.254.169.254, an internal host, or an odd port and use the probe as
  // an internal-network / cloud-metadata request-forgery + reachability
  // oracle (and leak the Basic header to it). Reject unsafe targets before
  // any fetch.
  const safe = await isSafeFetchTarget(`${siteUrl}/wp-json/wp/v2/users/me`)
  if (!safe.ok) {
    return Response.json({ error: `Refusing to connect to an unsafe WordPress URL: ${safe.detail ?? safe.reason}` }, { status: 400 })
  }

  // Validate the credentials against the live site before storing — a
  // connection is never saved on faith. Real network call, real failure
  // modes surfaced honestly (unreachable vs. wrong credentials vs. some
  // other HTTP status), never assumed to have worked.
  const probe = await fetch(`${siteUrl}/wp-json/wp/v2/users/me?context=edit`, {
    headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64') },
  }).catch(() => null)
  if (!probe || !probe.ok) {
    return Response.json(
      { error: `Could not authenticate against ${siteUrl} (${probe ? `HTTP ${probe.status}` : 'unreachable'}).` },
      { status: 502 }
    )
  }
  const seoPlugin = await detectSeoPlugin(siteUrl)

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

// Disconnect — including the seeded demo connection every onboarded org
// starts with (see lib/foundation/seed.ts), which otherwise permanently
// blocks a real PUT since the form only renders once GET reports none.
export const DELETE = handled(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const store = await getStore()
  await store.deleteWpConnection(projectId)
  await audit(project.orgId, user.id, 'wordpress.disconnect', projectId, '')
  return Response.json({ ok: true })
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
