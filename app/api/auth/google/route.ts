// Initiates Google OAuth flow for GSC and GA4 integrations

import { buildGoogleOAuthUrl } from '@/lib/google-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const projectId = String(body.projectId ?? '')
  const provider = String(body.provider ?? 'google') // 'google' for both GSC and GA4

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
  }

  try {
    // Build state: projectId:provider:timestamp (base64 encoded)
    const state = Buffer.from(
      `${projectId}:${provider}:${Date.now()}`
    ).toString('base64')

    // GSC and GA4 use the same scopes
    const scopes = [
      'https://www.googleapis.com/auth/webmasters', // Google Search Console
      'https://www.googleapis.com/auth/analytics.readonly', // Google Analytics (read-only)
    ]

    const authUrl = buildGoogleOAuthUrl(scopes, state)

    return Response.json({ authUrl })
  } catch (err) {
    console.error('[auth/google] OAuth URL build failed', err)
    return Response.json(
      { error: 'Failed to build OAuth URL. Check GOOGLE_OAUTH_* environment variables.' },
      { status: 502 }
    )
  }
}
