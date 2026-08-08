// The GA4 request URL.
//
// This exists because of a bug that shipped and reached a user: GA4_ENDPOINT
// already ends in `/properties`, but the stored property id was `properties/123`
// and got run through encodeURIComponent — producing
// `/v1beta/properties/properties%2F123:runReport` and a 400 from Google
// reading "Invalid property ID: properties%2F123".
//
// Two things are pinned here: the endpoint contributes the `/properties`
// segment exactly once, and either stored form of the id works, since it is
// typed by hand and both are reasonable things to paste.

import { describe, expect, it } from 'vitest'
import { GoogleAnalyticsProvider } from '../apps/north-star-hq/lib/foundation/external/providers/google'
import type { GoogleProviderDeps } from '../apps/north-star-hq/lib/foundation/external/providers/google'

function capture(propertyId: string | null) {
  const urls: string[] = []
  const deps: GoogleProviderDeps = {
    bundle: {
      accessToken: 'token',
      refreshToken: null,
      // Far future so no refresh round-trip is attempted mid-test.
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
    },
    clientId: 'id',
    clientSecret: 'secret',
    nowMs: Date.parse('2026-08-08T00:00:00Z'),
    fetchImpl: async (input: string) => {
      urls.push(input)
      return new Response(JSON.stringify({ rows: [] }), { status: 200 })
    },
  }
  return { provider: new GoogleAnalyticsProvider('ga4', deps, propertyId), urls }
}

describe('GA4 request URL', () => {
  it('names the property exactly once, unescaped', async () => {
    const { provider, urls } = capture('138955732')
    await provider.fetchDailyTrend()
    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('/v1beta/properties/138955732:runReport')
    // The regression that shipped.
    expect(urls[0]).not.toContain('%2F')
    expect(urls[0]).not.toContain('properties/properties')
  })

  it('accepts a pasted "properties/<id>" without doubling the segment', async () => {
    const { provider, urls } = capture('properties/138955732')
    await provider.fetchDailyTrend()
    expect(urls[0]).toContain('/v1beta/properties/138955732:runReport')
    expect(urls[0]).not.toContain('%2F')
    expect(urls[0]).not.toContain('properties/properties')
  })

  it('reports a missing property instead of requesting a malformed URL', async () => {
    const { provider, urls } = capture(null)
    const out = await provider.fetchDailyTrend()
    expect(out.ok).toBe(false)
    // No request at all — a URL with an empty path segment would 404 with a
    // far less actionable message than "no property selected".
    expect(urls).toHaveLength(0)
  })
})
