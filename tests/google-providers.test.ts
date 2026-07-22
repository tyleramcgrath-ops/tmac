// Real Google-backed providers (Phase H). Driven by a fake fetch so the
// connected / observed / error / rate-limited / unauthorized / token-refresh
// paths are all covered without touching the network. Confirms live data is
// graded 'observed' and failures degrade honestly (never fabricated).

import { describe, expect, it } from 'vitest'
import { GoogleSearchConsoleProvider, GoogleAnalyticsProvider } from '../lib/foundation/external/providers/google'
import type { GoogleTokenBundle } from '../lib/foundation/oauth/google'

process.env.APP_SECRET = 'google-providers-test-secret-01'

const future: GoogleTokenBundle = { accessToken: 'at', refreshToken: 'rt', expiresAt: new Date(3_600_000).toISOString(), scope: 's', tokenType: 'Bearer' }
function deps(fetchImpl: (i: string, init?: RequestInit) => Promise<Response>, bundle = future) {
  return { bundle: { ...bundle }, clientId: 'id', clientSecret: 'sec', nowMs: 0, fetchImpl }
}
function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response
}
function err(status: number): Response {
  return { ok: false, status, json: async () => ({}), text: async () => 'boom' } as unknown as Response
}

describe('GoogleSearchConsoleProvider', () => {
  it('returns observed rows on success and derives a domain property', async () => {
    let calledUrl = ''
    const provider = new GoogleSearchConsoleProvider('gsc', deps(async (u) => {
      calledUrl = u
      return ok({ rows: [{ keys: ['buy widgets', 'https://x/p'], clicks: 5, impressions: 100, ctr: 0.05, position: 3.2 }] })
    }), null, 'shop.example.com')
    const out = await provider.fetchReport('shop.example.com')
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.grade).toBe('observed')
      expect(out.data.rows[0].query).toBe('buy widgets')
    }
    expect(calledUrl).toContain(encodeURIComponent('sc-domain:shop.example.com'))
  })
  it('degrades to unauthorized on 401 and rate-limited on 429', async () => {
    const p401 = new GoogleSearchConsoleProvider('gsc', deps(async () => err(401)), null, 'x.com')
    const r401 = await p401.fetchReport('x.com')
    expect(r401.ok).toBe(false)
    if (!r401.ok) expect(r401.reason).toBe('unauthorized')
    const p429 = new GoogleSearchConsoleProvider('gsc', deps(async () => err(429)), null, 'x.com')
    const r429 = await p429.fetchReport('x.com')
    if (!r429.ok) expect(r429.reason).toBe('rate-limited')
  })
  it('refreshes an expired access token before querying', async () => {
    const expired: GoogleTokenBundle = { ...future, expiresAt: new Date(-10_000).toISOString() }
    let refreshed = false
    let persisted = false
    const d = {
      ...deps(async (u) => {
        if (u.includes('oauth2.googleapis.com/token')) { refreshed = true; return ok({ access_token: 'new', expires_in: 3600, scope: 's', token_type: 'Bearer' }) }
        return ok({ rows: [] })
      }, expired),
      persist: async () => { persisted = true },
    }
    const provider = new GoogleSearchConsoleProvider('gsc', d, null, 'x.com')
    const out = await provider.fetchReport('x.com')
    expect(out.ok).toBe(true)
    expect(refreshed).toBe(true)
    expect(persisted).toBe(true)
  })
})

describe('GoogleAnalyticsProvider', () => {
  it('reports connected-but-unconfigured until a property id is set', async () => {
    const provider = new GoogleAnalyticsProvider('ga4', deps(async () => ok({})), null)
    expect(provider.status().state).toBe('error')
    const out = await provider.fetchReport('')
    expect(out.ok).toBe(false)
  })
  it('returns observed pages and null revenue when the property reports no currency', async () => {
    const provider = new GoogleAnalyticsProvider('ga4', deps(async () => ok({
      rows: [{ dimensionValues: [{ value: '/p' }], metricValues: [{ value: '10' }, { value: '7' }, { value: '2' }, { value: '0' }, { value: '1' }] }],
      metadata: {},
    })), '123456789')
    const out = await provider.fetchReport('123456789')
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.grade).toBe('observed')
      expect(out.data.pages[0].sessions).toBe(10)
      expect(out.data.pages[0].revenue).toBeNull()
    }
  })
  it('never requests conversions and keyEvents together — GA4 rejects them as duplicate metrics', async () => {
    let requestedMetrics: string[] = []
    const provider = new GoogleAnalyticsProvider('ga4', deps(async (_u, init) => {
      const body = JSON.parse(String(init?.body ?? '{}'))
      requestedMetrics = (body.metrics ?? []).map((m: { name: string }) => m.name)
      return ok({
        rows: [{ dimensionValues: [{ value: '/p' }], metricValues: [{ value: '10' }, { value: '7' }, { value: '4' }, { value: '0' }] }],
        metadata: {},
      })
    }), '123456789')
    const out = await provider.fetchReport('123456789')
    expect(requestedMetrics).toEqual(['sessions', 'engagedSessions', 'keyEvents', 'totalRevenue'])
    expect(requestedMetrics.filter((m) => m === 'conversions')).toHaveLength(0)
    expect(out.ok).toBe(true)
    if (out.ok) {
      // Both fields are populated from the single keyEvents value — never a
      // second, separately-requested "conversions" number.
      expect(out.data.pages[0].conversions).toBe(4)
      expect(out.data.pages[0].keyEvents).toBe(4)
    }
  })
})
