// Google OAuth logic (Phase H). Pure/unit-tested with a fake fetch — no network,
// so the token exchange + refresh paths are exercised deterministically even in
// this sandbox where Google is unreachable. Signed-state CSRF protection, scope
// selection, token encryption round-trip, and expiry are all covered.

import { describe, expect, it } from 'vitest'
import {
  buildAuthUrl,
  encodeTokenBundle,
  decodeTokenBundle,
  exchangeCode,
  refreshAccessToken,
  isExpired,
  redirectUriFrom,
  signState,
  verifyState,
  SCOPE_BY_KIND,
  type GoogleTokenBundle,
  type OAuthState,
} from '../lib/foundation/oauth/google'

process.env.APP_SECRET = 'oauth-google-test-secret-000001'

const STATE: OAuthState = { projectId: 'p1', userId: 'u1', kinds: ['search-console', 'analytics'], nonce: 'n', issuedAt: 1_000_000 }

// A minimal fake Response.
function fakeRes(ok: boolean, body: unknown, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

// id_token with an email claim (header.payload.signature; only payload is read).
function idTokenWithEmail(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email })).toString('base64')
  return `h.${payload}.s`
}

describe('signed state (CSRF)', () => {
  it('round-trips a valid state', () => {
    const raw = signState(STATE)
    const back = verifyState(raw, STATE.issuedAt + 1000)
    expect(back?.projectId).toBe('p1')
    expect(back?.kinds).toEqual(['search-console', 'analytics'])
  })
  it('rejects a tampered state (GCM auth tag fails)', () => {
    const raw = signState(STATE)
    const tampered = raw.slice(0, -2) + (raw.endsWith('AA') ? 'BB' : 'AA')
    expect(verifyState(tampered, STATE.issuedAt + 1000)).toBeNull()
  })
  it('rejects an expired state', () => {
    const raw = signState(STATE)
    expect(verifyState(raw, STATE.issuedAt + 20 * 60 * 1000)).toBeNull()
  })
  it('rejects a state issued in the future', () => {
    const raw = signState(STATE)
    expect(verifyState(raw, STATE.issuedAt - 5 * 60 * 1000)).toBeNull()
  })
})

describe('auth url', () => {
  it('requests only the read-only scopes for the chosen kinds + offline access', () => {
    const url = buildAuthUrl({ clientId: 'cid', redirectUri: 'https://app/cb', kinds: ['search-console'], state: 'st' })
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    const scope = u.searchParams.get('scope') ?? ''
    expect(scope).toContain(SCOPE_BY_KIND['search-console'])
    expect(scope).not.toContain(SCOPE_BY_KIND['analytics'])
    expect(u.searchParams.get('access_type')).toBe('offline')
    expect(u.searchParams.get('state')).toBe('st')
  })
})

describe('redirect uri', () => {
  it('derives from the request origin, honouring an explicit base', () => {
    expect(redirectUriFrom('https://x.app/api/oauth/google/start?kind=all')).toBe('https://x.app/api/oauth/google/callback')
    expect(redirectUriFrom('https://x.app/anything', 'https://custom.app/')).toBe('https://custom.app/api/oauth/google/callback')
  })
})

describe('token encryption', () => {
  it('encrypts and decrypts a token bundle', () => {
    const b: GoogleTokenBundle = { accessToken: 'a', refreshToken: 'r', expiresAt: '2026-07-17T00:00:00.000Z', scope: 's', tokenType: 'Bearer' }
    const enc = encodeTokenBundle(b)
    expect(enc).not.toContain('accessToken') // opaque ciphertext, no plaintext keys
    expect(enc).not.toContain('refreshToken')
    expect(decodeTokenBundle(enc)).toEqual(b)
  })
})

describe('code exchange', () => {
  it('exchanges a code and reads the account email from the id_token', async () => {
    const fetchImpl = async () => fakeRes(true, { access_token: 'at', expires_in: 3600, refresh_token: 'rt', scope: 'sc', token_type: 'Bearer', id_token: idTokenWithEmail('me@x.com') })
    const { bundle, accountEmail } = await exchangeCode({ code: 'c', clientId: 'id', clientSecret: 'sec', redirectUri: 'r', nowMs: 0, fetchImpl })
    expect(bundle.accessToken).toBe('at')
    expect(bundle.refreshToken).toBe('rt')
    expect(bundle.expiresAt).toBe('1970-01-01T01:00:00.000Z')
    expect(accountEmail).toBe('me@x.com')
  })
  it('throws with detail on a non-200 exchange', async () => {
    const fetchImpl = async () => fakeRes(false, 'invalid_grant', 400)
    await expect(exchangeCode({ code: 'c', clientId: 'id', clientSecret: 'sec', redirectUri: 'r', nowMs: 0, fetchImpl })).rejects.toThrow(/token exchange failed/i)
  })
})

describe('token refresh', () => {
  it('refreshes an access token, keeping the existing refresh token when Google omits it', async () => {
    const fetchImpl = async () => fakeRes(true, { access_token: 'new', expires_in: 3600, scope: 'sc', token_type: 'Bearer' })
    const next = await refreshAccessToken({ refreshToken: 'keep', clientId: 'id', clientSecret: 'sec', nowMs: 0, fetchImpl })
    expect(next.accessToken).toBe('new')
    expect(next.refreshToken).toBe('keep')
  })
})

describe('expiry', () => {
  it('treats a token within the safety margin as expired', () => {
    const b: GoogleTokenBundle = { accessToken: 'a', refreshToken: null, expiresAt: new Date(200_000).toISOString(), scope: '', tokenType: 'Bearer' }
    expect(isExpired(b, 0)).toBe(false) // 200s out — fresh
    expect(isExpired(b, 150_000)).toBe(true) // 50s out — within the 60s safety margin
    expect(isExpired(b, 210_000)).toBe(true) // already past
  })
})
