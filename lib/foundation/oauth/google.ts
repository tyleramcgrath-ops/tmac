// Google OAuth 2.0 authorization-code flow (Phase H).
//
// One click connects a project to Google Search Console + Analytics with no
// API-key pasting. The browser is sent to Google's consent screen; Google
// redirects back to /api/oauth/google/callback with a code; the server
// exchanges it for tokens and stores them ENCRYPTED (AES-256-GCM, the same
// primitive used for WordPress app-passwords).
//
// HONESTY / ENVIRONMENT NOTE: the token exchange and refresh call Google's
// endpoints over the network. In THIS sandbox outbound egress is restricted to
// GitHub + package registries, so exchangeCode()/refreshAccessToken() cannot
// reach Google here — they surface a clear failure. On Vercel (open egress)
// they work. Every network call goes through an injectable `fetchImpl` so the
// flow is fully unit-tested against a fake without ever needing the network,
// but we never CLAIM the live handshake is validated until it runs on Vercel.

import { encryptSecret, decryptSecret } from '../crypto'
import type { ExternalProviderKind } from '../types'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

// Read-only scopes only — RankForge never requests write access to a user's
// Google properties. `openid email` lets us label the connection with the
// authorizing account without a second API call (the id_token carries email).
export const SCOPE_BY_KIND: Record<ExternalProviderKind, string> = {
  'search-console': 'https://www.googleapis.com/auth/webmasters.readonly',
  analytics: 'https://www.googleapis.com/auth/analytics.readonly',
}
const IDENTITY_SCOPES = ['openid', 'email']

export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>
const defaultFetch: FetchImpl = (input, init) => fetch(input, init)

// The encrypted-at-rest token bundle. Only `credentialEnc` (an opaque encrypted
// string) is ever persisted; this decoded shape lives in memory only.
export interface GoogleTokenBundle {
  accessToken: string
  refreshToken: string | null
  // ISO instant the access token expires.
  expiresAt: string
  scope: string
  tokenType: string
}

export function encodeTokenBundle(b: GoogleTokenBundle): string {
  return encryptSecret(JSON.stringify(b))
}
export function decodeTokenBundle(enc: string): GoogleTokenBundle {
  return JSON.parse(decryptSecret(enc)) as GoogleTokenBundle
}

// ── Signed state (CSRF) ──────────────────────────────────────────────────────
// The `state` round-trips through Google, so it must be unforgeable. We encrypt
// a JSON payload with APP_SECRET (AES-256-GCM): the GCM tag authenticates it, so
// an attacker who cannot read APP_SECRET can neither forge nor tamper with it.
// The callback additionally checks the session user matches state.userId, so a
// stolen state cannot be replayed by a different user.
export interface OAuthState {
  projectId: string
  userId: string
  kinds: ExternalProviderKind[]
  nonce: string
  issuedAt: number
}

export function signState(state: OAuthState): string {
  // URL-safe base64 (the encrypted string contains '.' + base64 which is fine in
  // a query value once encodeURIComponent'd by the URL builder).
  return encryptSecret(JSON.stringify(state))
}

export function verifyState(raw: string, nowMs: number, maxAgeMs = 10 * 60 * 1000): OAuthState | null {
  try {
    const s = JSON.parse(decryptSecret(raw)) as OAuthState
    if (!s || typeof s.projectId !== 'string' || typeof s.userId !== 'string' || !Array.isArray(s.kinds)) return null
    if (typeof s.issuedAt !== 'number' || nowMs - s.issuedAt > maxAgeMs || s.issuedAt - nowMs > 60_000) return null
    return s
  } catch {
    return null
  }
}

// The redirect URI must be identical in the auth request and the token
// exchange, and must be registered in the Google Cloud console. We derive it
// from the request origin (works for Vercel preview + prod) unless an explicit
// GOOGLE_OAUTH_REDIRECT_BASE is set.
export const OAUTH_CALLBACK_PATH = '/api/oauth/google/callback'
export function redirectUriFrom(requestUrl: string, redirectBase?: string): string {
  const base = (redirectBase ?? new URL(requestUrl).origin).replace(/\/$/, '')
  return `${base}${OAUTH_CALLBACK_PATH}`
}

// ── Authorization URL ────────────────────────────────────────────────────────
export function buildAuthUrl(opts: {
  clientId: string
  redirectUri: string
  kinds: ExternalProviderKind[]
  state: string
}): string {
  const scopes = [...new Set([...opts.kinds.map((k) => SCOPE_BY_KIND[k]), ...IDENTITY_SCOPES])].join(' ')
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: scopes,
    // offline + consent so Google returns a refresh_token we can use for
    // long-lived, unattended reads.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: opts.state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

// ── Code → token exchange ────────────────────────────────────────────────────
interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

export interface ExchangeResult {
  bundle: GoogleTokenBundle
  accountEmail: string | null
}

export async function exchangeCode(opts: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  nowMs: number
  fetchImpl?: FetchImpl
}): Promise<ExchangeResult> {
  const doFetch = opts.fetchImpl ?? defaultFetch
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await doFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const detail = await safeText(res)
    throw new Error(`Google token exchange failed (${res.status}): ${detail}`)
  }
  const json = (await res.json()) as GoogleTokenResponse
  const bundle: GoogleTokenBundle = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(opts.nowMs + (json.expires_in ?? 0) * 1000).toISOString(),
    scope: json.scope ?? '',
    tokenType: json.token_type ?? 'Bearer',
  }
  return { bundle, accountEmail: emailFromIdToken(json.id_token) }
}

// ── Access-token refresh ─────────────────────────────────────────────────────
export async function refreshAccessToken(opts: {
  refreshToken: string
  clientId: string
  clientSecret: string
  nowMs: number
  fetchImpl?: FetchImpl
}): Promise<GoogleTokenBundle> {
  const doFetch = opts.fetchImpl ?? defaultFetch
  const body = new URLSearchParams({
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    grant_type: 'refresh_token',
  })
  const res = await doFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const detail = await safeText(res)
    throw new Error(`Google token refresh failed (${res.status}): ${detail}`)
  }
  const json = (await res.json()) as GoogleTokenResponse
  return {
    accessToken: json.access_token,
    // Google usually omits refresh_token on refresh — keep the existing one.
    refreshToken: json.refresh_token ?? opts.refreshToken,
    expiresAt: new Date(opts.nowMs + (json.expires_in ?? 0) * 1000).toISOString(),
    scope: json.scope ?? '',
    tokenType: json.token_type ?? 'Bearer',
  }
}

// True when the access token is expired (or within a 60s safety margin).
export function isExpired(bundle: GoogleTokenBundle, nowMs: number): boolean {
  const t = Date.parse(bundle.expiresAt)
  if (Number.isNaN(t)) return true
  return t - nowMs <= 60_000
}

// Decode the (unverified) email claim from an id_token JWT. We do NOT trust this
// for auth — it only labels the connection in the UI. Signature verification is
// unnecessary because the token came straight from Google's TLS token endpoint.
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as { email?: string }
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300)
  } catch {
    return '<no body>'
  }
}
