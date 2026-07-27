// Project integrations status (Phase H). Lists the project's external provider
// connections for the UI — with the encrypted credential STRIPPED — and supports
// disconnecting a provider or setting its resource id (GSC site / GA4 property).
// The token bundle never leaves the server.

import { handled, requireProjectRole, requireUser, assertSameOrigin, audit, HttpError } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { googleOAuthConfig } from '@/lib/foundation/env'
import type { ExternalProviderKind, ProviderConnection } from '@/lib/foundation/types'

export const runtime = 'nodejs'

// The client-safe projection — everything EXCEPT credentialEnc.
function publicView(c: ProviderConnection) {
  return {
    kind: c.kind,
    vendor: c.vendor,
    status: c.status,
    detail: c.detail,
    accountEmail: c.accountEmail,
    resourceId: c.resourceId,
    scope: c.scope,
    connectedAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

const VALID_KINDS: ExternalProviderKind[] = ['search-console', 'analytics']
function parseKind(raw: string | null): ExternalProviderKind {
  if (raw === 'search-console' || raw === 'analytics') return raw
  throw new HttpError(400, 'Unknown integration kind.')
}

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const conns = await store.listProviderConnections(projectId)
  const byKind = new Map(conns.map((c) => [c.kind, c]))
  // Return a row per supported kind so the UI can render a connect button for
  // the not-yet-connected ones.
  const integrations = VALID_KINDS.map((kind) => {
    const c = byKind.get(kind)
    return c ? publicView(c) : { kind, vendor: 'google' as const, status: 'disconnected' as const, detail: 'Not connected.', accountEmail: null, resourceId: null, scope: '', connectedAt: null, updatedAt: null }
  })
  // `configured` = this deployment actually has Google OAuth credentials, so the
  // "Connect Google" button is only ever shown when it can genuinely work — a
  // customer never reaches a dead end (RC2 P2).
  return Response.json({ integrations, configured: googleOAuthConfig() !== null })
})

export const PATCH = handled(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const body = (await request.json().catch(() => ({}))) as { kind?: string; resourceId?: string }
  const kind = parseKind(body.kind ?? null)
  const store = await getStore()
  const conn = await store.getProviderConnection(projectId, kind)
  if (!conn) throw new HttpError(404, 'Integration not connected.')
  const resourceId = typeof body.resourceId === 'string' ? body.resourceId.trim().slice(0, 200) : null
  await store.upsertProviderConnection({ ...conn, resourceId: resourceId || null, updatedAt: new Date().toISOString() })
  await audit(project.orgId, user.id, 'integration.google.configure', projectId, `${kind}:${resourceId ?? ''}`)
  return Response.json({ ok: true })
})

export const DELETE = handled(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const kind = parseKind(new URL(request.url).searchParams.get('kind'))
  const store = await getStore()
  const conn = await store.getProviderConnection(projectId, kind)
  if (!conn) throw new HttpError(404, 'Integration not connected.')
  await store.deleteProviderConnection(projectId, kind)
  await audit(project.orgId, user.id, 'integration.google.disconnect', projectId, kind)
  return Response.json({ ok: true })
})
