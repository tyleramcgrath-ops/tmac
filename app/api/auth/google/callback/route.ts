// Google OAuth callback handler for GSC and GA4 integrations

import { exchangeCodeForToken } from '@/lib/google-oauth'
import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { encryptToken } from '@/lib/crypto/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function redirectTo(request: Request, path: string): Response {
  return Response.redirect(new URL(path, request.url))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return redirectTo(request, `/app?error=google_auth_denied&reason=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return redirectTo(request, '/app?error=missing_oauth_params')
  }

  // The callback is a top-level browser navigation back from Google, so the
  // session cookie is present. Require it, and bind the whole round-trip to
  // it below — otherwise an attacker could start their own OAuth flow with a
  // victim's projectId in `state` and attach their Google account to a
  // project they don't own.
  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return redirectTo(request, '/app?error=session_required')
  }

  let projectId: string
  let provider: string

  try {
    // Decode state: "projectId:provider:timestamp:organizationId"
    const decoded = Buffer.from(state, 'base64').toString()
    const [decodedProjectId, decodedProvider, timestamp, decodedOrgId] = decoded.split(':')

    projectId = decodedProjectId
    provider = decodedProvider

    // Verify timestamp (state valid for 10 minutes).
    const issuedAt = parseInt(timestamp, 10)
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > 10 * 60 * 1000) {
      return redirectTo(request, '/app?error=oauth_state_expired')
    }

    // The org that started the flow must be the org completing it.
    if (!decodedOrgId || decodedOrgId !== session.organizationId) {
      return redirectTo(request, '/app?error=oauth_state_mismatch')
    }
  } catch (err) {
    console.error('[google/callback] Failed to decode state', err)
    return redirectTo(request, '/app?error=invalid_oauth_state')
  }

  try {
    const prisma = getPrismaClient()

    // Get project and verify the current session's org actually owns it —
    // a matching state alone isn't proof of authorization on its own.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project || project.organizationId !== session.organizationId) {
      return redirectTo(request, `/app?error=project_not_found`)
    }

    const tokenResponse = await exchangeCodeForToken(code)

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    // Tokens are encrypted at rest — never store Google access/refresh tokens
    // in plaintext.
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token ? encryptToken(tokenResponse.refresh_token) : null

    // Check if credential already exists for this organization + project + provider
    const existing = await prisma.oAuthCredential.findUnique({
      where: {
        organizationId_provider_projectId: {
          organizationId: project.organizationId,
          projectId,
          provider,
        },
      },
    })

    if (existing) {
      // Update existing credential
      await prisma.oAuthCredential.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken || existing.refreshToken,
          expiresAt,
        },
      })
    } else {
      // Create new credential
      await prisma.oAuthCredential.create({
        data: {
          organizationId: project.organizationId,
          projectId,
          provider,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
        },
      })
    }

    // Redirect back to project settings with success indicator
    return redirectTo(request, `/app/projects/${projectId}?integration=${provider}&status=connected`)
  } catch (err) {
    // Never log the raw error object here — token-exchange failures can
    // include the authorization code or partial token data in their message.
    console.error('[google/callback] Token exchange or storage failed:', err instanceof Error ? err.message.slice(0, 200) : 'unknown error')
    return redirectTo(request, `/app/projects/${projectId}?integration=${provider}&error=token_exchange_failed`)
  }
}
