// Connect-Google — step 2 (Phase H). Google redirects the browser here with a
// one-time `code` and our signed `state`. We verify the state (unforgeable +
// bound to the authorizing user), exchange the code for tokens, and persist them
// ENCRYPTED per (project, kind). No token is ever written to a log or returned
// to the client — only a redirect back to the project's Atlas tab with a status.
//
// This is a single, fixed redirect URI (OAUTH_CALLBACK_PATH) so it can be
// registered once in the Google Cloud console. The projectId travels inside the
// signed state, not the URL.

import { handled, requireUser, requireProjectRole, audit } from '@/lib/foundation/auth'
import { googleOAuthConfig } from '@/lib/foundation/env'
import { getStore } from '@/lib/foundation/store'
import { exchangeCode, redirectUriFrom, verifyState, encodeTokenBundle, SCOPE_BY_KIND } from '@/lib/foundation/oauth/google'
import type { ProviderConnection } from '@/lib/foundation/types'

export const runtime = 'nodejs'

function backTo(request: Request, projectId: string | null, status: string, reason?: string): Response {
  const origin = new URL(request.url).origin
  const dest = projectId ? `${origin}/app/projects/${projectId}?tab=atlas&google=${status}` : `${origin}/app?google=${status}`
  const url = reason ? `${dest}&reason=${encodeURIComponent(reason.slice(0, 140))}` : dest
  return Response.redirect(url, 302)
}

export const GET = handled(async (request) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const rawState = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error') // e.g. access_denied

  const state = rawState ? verifyState(rawState, Date.now()) : null
  if (!state) return backTo(request, null, 'error', 'Invalid or expired authorization state.')
  if (oauthError) return backTo(request, state.projectId, 'error', oauthError)
  if (!code) return backTo(request, state.projectId, 'error', 'Missing authorization code.')

  // The session user must match the user who started the flow.
  const user = await requireUser(request)
  if (user.id !== state.userId) return backTo(request, state.projectId, 'error', 'Session does not match the authorization request.')
  const { project } = await requireProjectRole(user, state.projectId, 'admin')

  const config = googleOAuthConfig()
  if (!config) return backTo(request, state.projectId, 'error', 'Google OAuth is not configured.')

  let result
  try {
    result = await exchangeCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: redirectUriFrom(request.url, config.redirectBase),
      nowMs: Date.now(),
    })
  } catch (err) {
    // Network-blocked (this sandbox) or a genuine Google error: fail honestly.
    return backTo(request, state.projectId, 'error', err instanceof Error ? err.message : 'Token exchange failed.')
  }

  const store = await getStore()
  const now = new Date().toISOString()
  const credentialEnc = encodeTokenBundle(result.bundle)
  for (const kind of state.kinds) {
    // Only mark a kind connected if its scope was actually granted.
    const granted = result.bundle.scope.includes(SCOPE_BY_KIND[kind])
    const existing = await store.getProviderConnection(state.projectId, kind)
    const conn: ProviderConnection = {
      projectId: state.projectId,
      kind,
      vendor: 'google',
      credentialEnc,
      accountEmail: result.accountEmail,
      resourceId: existing?.resourceId ?? null,
      scope: result.bundle.scope,
      status: granted ? 'connected' : 'error',
      detail: granted ? 'Connected to Google.' : 'This scope was not granted on the consent screen.',
      connectedBy: user.id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await store.upsertProviderConnection(conn)
  }
  await audit(project.orgId, user.id, 'integration.google.connect', state.projectId, state.kinds.join(','))

  return backTo(request, state.projectId, 'connected')
})
