// Google OAuth callback handler for GSC and GA4 integrations

import { exchangeCodeForToken, refreshAccessToken } from '@/lib/google-oauth'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return Response.redirect(
      `/app?error=google_auth_denied&reason=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return Response.redirect('/app?error=missing_oauth_params')
  }

  let projectId: string
  let provider: string

  try {
    // Decode state: "projectId:provider:timestamp"
    const decoded = Buffer.from(state, 'base64').toString()
    const [decodedProjectId, decodedProvider, timestamp] = decoded.split(':')

    projectId = decodedProjectId
    provider = decodedProvider

    // Verify timestamp (state valid for 10 minutes)
    const issuedAt = parseInt(timestamp, 10)
    if (Date.now() - issuedAt > 10 * 60 * 1000) {
      return Response.redirect('/app?error=oauth_state_expired')
    }
  } catch (err) {
    console.error('[google/callback] Failed to decode state', err)
    return Response.redirect('/app?error=invalid_oauth_state')
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code)

    const prisma = getPrismaClient()

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    // Check if credential already exists for this project + provider
    const existing = await prisma.oAuthCredential.findUnique({
      where: {
        projectId_provider: {
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
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || existing.refreshToken,
          expiresAt,
        },
      })
    } else {
      // Create new credential
      await prisma.oAuthCredential.create({
        data: {
          projectId,
          provider,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
          expiresAt,
        },
      })
    }

    // Redirect back to project settings with success indicator
    return Response.redirect(`/app/projects/${projectId}?integration=${provider}&status=connected`)
  } catch (err) {
    console.error('[google/callback] Token exchange failed', err)
    return Response.redirect(
      `/app/projects/${projectId}?integration=${provider}&error=token_exchange_failed`
    )
  }
}
