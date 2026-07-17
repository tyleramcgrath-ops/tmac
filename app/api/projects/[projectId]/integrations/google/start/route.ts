// Connect-Google — step 1 (Phase H). Returns the Google consent-screen URL for
// this project. The client navigates the browser to it (top-level, so the
// session cookie rides along and Google can redirect back). Admin-only: storing
// third-party credentials is a privileged action.
//
// If GOOGLE_CLIENT_ID/SECRET are not configured, we say so plainly (400) rather
// than bouncing the user to a broken Google screen.

import { randomUUID } from 'crypto'
import { handled, requireProjectRole, requireUser, HttpError, assertSameOrigin, enforceRateLimit } from '@/lib/foundation/auth'
import { googleOAuthConfig } from '@/lib/foundation/env'
import { buildAuthUrl, redirectUriFrom, signState, type OAuthState } from '@/lib/foundation/oauth/google'
import type { ExternalProviderKind } from '@/lib/foundation/types'

export const runtime = 'nodejs'

function kindsFromQuery(raw: string | null): ExternalProviderKind[] {
  if (raw === 'search-console') return ['search-console']
  if (raw === 'analytics') return ['analytics']
  // Default / 'all' connects both in one consent.
  return ['search-console', 'analytics']
}

export const GET = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'oauth-start', 20)
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'admin')

  const config = googleOAuthConfig()
  if (!config) {
    throw new HttpError(400, 'Google OAuth is not configured on this deployment. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }

  const kinds = kindsFromQuery(new URL(request.url).searchParams.get('kind'))
  const state: OAuthState = {
    projectId,
    userId: user.id,
    kinds,
    nonce: randomUUID(),
    issuedAt: Date.now(),
  }
  const redirectUri = redirectUriFrom(request.url, config.redirectBase)
  const url = buildAuthUrl({ clientId: config.clientId, redirectUri, kinds, state: signState(state) })
  return Response.json({ url })
})
