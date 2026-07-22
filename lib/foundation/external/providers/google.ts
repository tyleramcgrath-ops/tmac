// Real Google-backed providers (Phase H) — Search Console + Analytics 4, behind
// the SAME interfaces the mocks implement (SearchConsoleProvider /
// AnalyticsProvider). They read a decrypted OAuth token bundle, refresh the
// access token when it has expired (persisting the new bundle via a callback),
// and normalize Google's payloads into RankForge's graded contracts.
//
// GRADING: live Google data is 'observed'. Every failure mode degrades honestly
// — an expired/invalid credential → 'unauthorized', a 429 → 'rate-limited', any
// other network/API failure → 'error'. Nothing is ever fabricated.
//
// ENVIRONMENT: these call googleapis.com. In this sandbox egress is blocked, so
// the fetch rejects and the outcome is a clean failure (the Atlas tab shows the
// provider connected but the reading unavailable-with-reason). On Vercel the
// calls succeed. All HTTP goes through an injectable `fetchImpl` so behaviour is
// unit-tested without the network.

import type { ProviderOutcome, ProviderStatus } from '../types'
import { statusFor } from './shared'
import type { GscPageMetrics, GscReport, GscRow, SearchConsoleProvider } from './search-console'
import type { Ga4Report, Ga4PageMetrics, AnalyticsProvider } from './analytics'
import {
  isExpired,
  refreshAccessToken,
  type FetchImpl,
  type GoogleTokenBundle,
} from '../../oauth/google'

const GSC_ENDPOINT = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
const GA4_ENDPOINT = 'https://analyticsdata.googleapis.com/v1beta/properties'

export interface GoogleProviderDeps {
  bundle: GoogleTokenBundle
  clientId: string
  clientSecret: string
  nowMs: number
  fetchImpl?: FetchImpl
  // Persist a refreshed token bundle so we don't refresh on every call.
  persist?: (bundle: GoogleTokenBundle) => Promise<void>
}

function ymd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// Map a thrown fetch/HTTP failure onto the provider's honest failure reason.
// invalid_grant / invalid_token (a revoked or expired refresh token) count as
// 'unauthorized' so the UI can prompt the user to reconnect, rather than a
// generic error (RC1 failure-honesty fix).
//
// A 403 "insufficient permission" is a DIFFERENT problem from an invalid
// token: the OAuth account is valid but was never added as a user on that
// specific Search Console / Analytics property. Surface that distinction in
// plain language instead of raw Google JSON, so the fix (add the account as
// a property user) is obvious without reading an API error.
function failureFrom(err: unknown): ProviderOutcome<never> {
  const msg = err instanceof Error ? err.message : String(err)
  if (/\b403\b/.test(msg) && /sufficient permission/i.test(msg)) {
    const site = msg.match(/site '([^']+)'/)?.[1]
    return {
      ok: false,
      reason: 'unauthorized',
      detail: site
        ? `The connected Google account does not have access to ${site}. Add it as a user in Search Console (Settings → Users and permissions) and reconnect.`
        : 'The connected Google account does not have access to this property. Add it as a user in the Google property settings and reconnect.',
    }
  }
  if (/\b401\b|unauthor|invalid_grant|invalid_token/i.test(msg)) return { ok: false, reason: 'unauthorized', detail: msg }
  if (/\b429\b|rate/i.test(msg)) return { ok: false, reason: 'rate-limited', detail: msg }
  return { ok: false, reason: 'error', detail: msg }
}

// Shared: return a valid access token, refreshing + persisting if expired.
async function freshToken(deps: GoogleProviderDeps): Promise<string> {
  if (!isExpired(deps.bundle, deps.nowMs)) return deps.bundle.accessToken
  if (!deps.bundle.refreshToken) throw new Error('401 access token expired and no refresh token available')
  const next = await refreshAccessToken({
    refreshToken: deps.bundle.refreshToken,
    clientId: deps.clientId,
    clientSecret: deps.clientSecret,
    nowMs: deps.nowMs,
    fetchImpl: deps.fetchImpl,
  })
  deps.bundle = next
  if (deps.persist) await deps.persist(next)
  return next.accessToken
}

async function postJson(url: string, token: string, body: unknown, fetchImpl?: FetchImpl): Promise<unknown> {
  const doFetch = fetchImpl ?? ((i: string, init?: RequestInit) => fetch(i, init))
  // RC1 robustness: bound the request so a hung Google socket can't stall the
  // Atlas assembly (mirrors wpFetch's 20s guard). The default fetch honours the
  // signal; injected test fetches ignore it harmlessly.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  let res: Response
  try {
    res = await doFetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    } as RequestInit)
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.text()).slice(0, 200) } catch { /* ignore */ }
    throw new Error(`${res.status} ${detail}`)
  }
  return res.json()
}

// ── Search Console ───────────────────────────────────────────────────────────
interface GscApiResponse { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }

export class GoogleSearchConsoleProvider implements SearchConsoleProvider {
  readonly kind = 'search-console' as const
  // The GSC "site" — a domain property (sc-domain:example.com) by default, or an
  // explicit URL-prefix property when the connection set a resourceId.
  private readonly site: string
  constructor(readonly id: string, private readonly deps: GoogleProviderDeps, siteUrl: string | null, domain: string) {
    this.site = siteUrl || `sc-domain:${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'search-console', { connected: true, credential: 'oauth' }, new Date(this.deps.nowMs).toISOString())
  }
  async fetchReport(_domain: string): Promise<ProviderOutcome<GscReport>> {
    try {
      const token = await freshToken(this.deps)
      const from = ymd(this.deps.nowMs - 28 * 24 * 3600 * 1000)
      const to = ymd(this.deps.nowMs)
      const url = `${GSC_ENDPOINT}/${encodeURIComponent(this.site)}/searchAnalytics/query`
      const json = (await postJson(url, token, { startDate: from, endDate: to, dimensions: ['query', 'page'], rowLimit: 100 }, this.deps.fetchImpl)) as GscApiResponse
      const rows: GscRow[] = (json.rows ?? []).map((r) => ({
        query: r.keys[0] ?? '',
        page: r.keys[1] ?? '',
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      }))
      return { ok: true, data: { range: { from, to }, rows }, grade: 'observed', source: 'gsc', fetchedAt: new Date(this.deps.nowMs).toISOString() }
    } catch (err) {
      return failureFrom(err)
    }
  }

  // Aggregate clicks/impressions/ctr/position for ONE page over an EXACT date
  // range — used by the outcome-measurement flywheel to compare a page's
  // performance before vs after a deployed fix (SCHEDULER_DESIGN.md §11).
  // dimensions=['page'] filtered to exactly this URL returns one aggregated
  // row across the whole range, not a per-query breakdown.
  async fetchPageMetrics(page: string, from: string, to: string): Promise<ProviderOutcome<GscPageMetrics>> {
    try {
      const token = await freshToken(this.deps)
      const url = `${GSC_ENDPOINT}/${encodeURIComponent(this.site)}/searchAnalytics/query`
      const json = (await postJson(
        url,
        token,
        {
          startDate: from,
          endDate: to,
          dimensions: ['page'],
          dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: page }] }],
          rowLimit: 1,
        },
        this.deps.fetchImpl
      )) as GscApiResponse
      const row = json.rows?.[0]
      return {
        ok: true,
        data: {
          range: { from, to },
          page,
          clicks: row?.clicks ?? 0,
          impressions: row?.impressions ?? 0,
          ctr: row?.ctr ?? 0,
          position: row?.position ?? 0,
        },
        grade: 'observed',
        source: 'gsc',
        fetchedAt: new Date(this.deps.nowMs).toISOString(),
      }
    } catch (err) {
      return failureFrom(err)
    }
  }
}

// ── Analytics 4 ──────────────────────────────────────────────────────────────
interface Ga4ApiResponse {
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
  metadata?: { currencyCode?: string }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  readonly kind = 'analytics' as const
  constructor(readonly id: string, private readonly deps: GoogleProviderDeps, private readonly propertyId: string | null) {}
  status(): ProviderStatus {
    if (!this.propertyId) {
      return { id: this.id, kind: 'analytics', state: 'error', detail: 'Connected, but no GA4 property selected yet.', lastCheckedAt: new Date(this.deps.nowMs).toISOString() }
    }
    return statusFor(this.id, 'analytics', { connected: true, credential: 'oauth' }, new Date(this.deps.nowMs).toISOString())
  }
  async fetchReport(_propertyId: string): Promise<ProviderOutcome<Ga4Report>> {
    if (!this.propertyId) return { ok: false, reason: 'error', detail: 'No GA4 property selected — set the property id to enable Analytics.' }
    try {
      const token = await freshToken(this.deps)
      const from = ymd(this.deps.nowMs - 28 * 24 * 3600 * 1000)
      const to = ymd(this.deps.nowMs)
      const url = `${GA4_ENDPOINT}/${encodeURIComponent(this.propertyId)}:runReport`
      // GA4 renamed "conversions" to "key events" in 2024, and its Data API now
      // treats the two metric names as aliases of the same underlying field —
      // requesting both in one report is rejected as "duplicate metrics". Ask
      // for keyEvents only and populate both output fields from that one value.
      const json = (await postJson(url, token, {
        dateRanges: [{ startDate: from, endDate: to }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }, { name: 'keyEvents' }, { name: 'totalRevenue' }],
        limit: 100,
      }, this.deps.fetchImpl)) as Ga4ApiResponse
      const currency = json.metadata?.currencyCode ?? null
      const pages: Ga4PageMetrics[] = (json.rows ?? []).map((r) => {
        const m = r.metricValues.map((v) => Number(v.value) || 0)
        const keyEvents = m[2] ?? 0
        const revenue = m[3]
        return {
          page: r.dimensionValues[0]?.value ?? '',
          sessions: m[0] ?? 0,
          engagedSessions: m[1] ?? 0,
          conversions: keyEvents,
          // Revenue is null (never 0-as-fact) when the property reports no currency.
          revenue: currency ? revenue ?? 0 : null,
          keyEvents,
        }
      })
      return { ok: true, data: { range: { from, to }, currency, pages }, grade: 'observed', source: 'ga4', fetchedAt: new Date(this.deps.nowMs).toISOString() }
    } catch (err) {
      return failureFrom(err)
    }
  }
}
