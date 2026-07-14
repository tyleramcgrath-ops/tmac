// Google OAuth handler for GSC and GA4 integrations

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || ''

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth configuration missing. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.')
  }

  return { clientId, clientSecret, redirectUri }
}

export function buildGoogleOAuthUrl(scopes: string[], state: string): string {
  const config = getGoogleOAuthConfig()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const config = getGoogleOAuthConfig()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OAuth token exchange failed: ${err}`)
  }

  return res.json() as Promise<TokenResponse>
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getGoogleOAuthConfig()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }

  return res.json() as Promise<TokenResponse>
}
