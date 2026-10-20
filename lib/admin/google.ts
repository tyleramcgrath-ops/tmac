// Google Analytics 4 (Data API) and Search Console, read with a Google Cloud
// service account. Setup is in /admin/settings.
//   GOOGLE_SERVICE_ACCOUNT_JSON  the service account key (JSON, or base64 of it)
//   GA4_PROPERTY_ID              numeric GA4 property id (not the G- measurement id)
//   GSC_SITE_URL                 Search Console property, e.g. sc-domain:lawmatchnow.com

import { createSign } from 'node:crypto'
import { kvGet, kvSet } from './db'

type Key = { client_email: string; private_key: string }

function serviceAccount(): Key | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    const k = JSON.parse(json) as Key
    return k.client_email && k.private_key ? k : null
  } catch {
    return null
  }
}

export const googleConfigured = () => !!serviceAccount()
export const ga4Configured = () => googleConfigured() && !!process.env.GA4_PROPERTY_ID
export const gscConfigured = () => googleConfigured() && !!process.env.GSC_SITE_URL
export const serviceEmail = () => serviceAccount()?.client_email ?? null

const tokens = new Map<string, { token: string; exp: number }>()

async function accessToken(scope: string): Promise<string> {
  const hit = tokens.get(scope)
  if (hit && hit.exp > Date.now() + 60_000) return hit.token
  const key = serviceAccount()
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key.replace(/\\n/g, '\n'), 'base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  })
  const j = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string }
  if (!j.access_token) throw new Error(`Google sign-in failed: ${j.error_description ?? res.status}`)
  tokens.set(scope, { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 })
  return j.access_token
}

async function gapi<T>(scope: string, url: string, body?: object): Promise<T> {
  const token = await accessToken(scope)
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(j.error?.message ?? `HTTP ${res.status}`)
  return j
}

/** Cached for 30 minutes in the database, so the dashboard stays fast and within quotas. */
async function cached<T>(key: string, fn: () => Promise<T>, minutes = 30): Promise<T> {
  const hit = await kvGet<T>(key).catch(() => null)
  if (hit && Date.now() - new Date(hit.updated_at).getTime() < minutes * 60_000) return hit.value
  const v = await fn()
  await kvSet(key, v).catch(() => {})
  return v
}

// ---------- GA4 ----------

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type GaReport = { rows?: GaRow[]; totals?: GaRow[] }

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

async function gaReport(body: object) {
  return gapi<GaReport>(GA_SCOPE, `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`, body)
}

const rowsOf = (r: GaReport, dims = 1) =>
  (r.rows ?? []).map((row) => ({ dims: (row.dimensionValues ?? []).slice(0, dims).map((d) => d.value), m: (row.metricValues ?? []).map((m) => Number(m.value)) }))

export async function ga4Overview(days: number) {
  return cached(`ga4:${days}`, async () => {
    const range = [{ startDate: `${days}daysAgo`, endDate: 'today' }]
    const [summary, daily, pages, channels, sources, devices, countries, events] = await Promise.all([
      gaReport({ dateRanges: range, metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration', 'newUsers'].map((name) => ({ name })) }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }], limit: 25 }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'engagementRate' }], limit: 12 }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'sessionSource' }], metrics: [{ name: 'sessions' }], limit: 15 }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }] }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'region' }], metrics: [{ name: 'activeUsers' }], limit: 12 }),
      gaReport({ dateRanges: range, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], limit: 20 }),
    ])
    const s = summary.rows?.[0]?.metricValues?.map((m) => Number(m.value)) ?? []
    return {
      users: s[0] ?? 0, sessions: s[1] ?? 0, views: s[2] ?? 0, engagement: s[3] ?? 0, avgDuration: s[4] ?? 0, newUsers: s[5] ?? 0,
      daily: rowsOf(daily).map((r) => ({ day: `${r.dims[0].slice(0, 4)}-${r.dims[0].slice(4, 6)}-${r.dims[0].slice(6)}`, users: r.m[0], sessions: r.m[1] })),
      pages: rowsOf(pages).map((r) => ({ path: r.dims[0], views: r.m[0], users: r.m[1] })),
      channels: rowsOf(channels).map((r) => ({ k: r.dims[0], n: r.m[0], engagement: r.m[1] })),
      sources: rowsOf(sources).map((r) => ({ k: r.dims[0], n: r.m[0] })),
      devices: rowsOf(devices).map((r) => ({ k: r.dims[0], n: r.m[0] })),
      regions: rowsOf(countries).map((r) => ({ k: r.dims[0], n: r.m[0] })),
      events: rowsOf(events).map((r) => ({ k: r.dims[0], n: r.m[0] })),
    }
  })
}

/** Visitors on the site right now. Not cached. */
export async function ga4Realtime() {
  const r = await gapi<GaReport>(GA_SCOPE, `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runRealtimeReport`, {
    dimensions: [{ name: 'unifiedScreenName' }], metrics: [{ name: 'activeUsers' }], limit: 10,
  })
  const rows = rowsOf(r).map((x) => ({ page: x.dims[0], users: x.m[0] }))
  return { total: rows.reduce((a, b) => a + b.users, 0), rows }
}

// ---------- Search Console ----------

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters'
const site = () => encodeURIComponent(process.env.GSC_SITE_URL!)

type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }

async function gscQuery(days: number, dimensions: string[], rowLimit = 25, extra: object = {}) {
  const end = new Date(Date.now() - 2 * 86400_000) // Search Console data lags ~2 days
  const start = new Date(end.getTime() - days * 86400_000)
  const r = await gapi<{ rows?: GscRow[] }>(GSC_SCOPE, `https://www.googleapis.com/webmasters/v3/sites/${site()}/searchAnalytics/query`, {
    startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), dimensions, rowLimit, ...extra,
  })
  return r.rows ?? []
}

export async function gscOverview(days: number) {
  return cached(`gsc:${days}`, async () => {
    const [totals, daily, queries, pages, countries, devices, sitemaps] = await Promise.all([
      gscQuery(days, [], 1),
      gscQuery(days, ['date'], 500),
      gscQuery(days, ['query'], 50),
      gscQuery(days, ['page'], 50),
      gscQuery(days, ['country'], 10),
      gscQuery(days, ['device'], 5),
      gapi<{ sitemap?: { path: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { type: string; submitted: string; indexed?: string }[] }[] }>(
        GSC_SCOPE, `https://www.googleapis.com/webmasters/v3/sites/${site()}/sitemaps`).then((r) => r.sitemap ?? []).catch(() => []),
    ])
    const t = totals[0]
    // "Striking distance": queries ranking 5–20 with real impressions are the cheapest wins.
    const opportunities = queries.filter((q) => q.position >= 5 && q.position <= 20 && q.impressions >= 10).sort((a, b) => b.impressions - a.impressions).slice(0, 15)
    return {
      clicks: t?.clicks ?? 0, impressions: t?.impressions ?? 0, ctr: t?.ctr ?? 0, position: t?.position ?? 0,
      daily: daily.map((r) => ({ day: r.keys![0], clicks: r.clicks, impressions: r.impressions })),
      queries: queries.map((r) => ({ k: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      pages: pages.map((r) => ({ k: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      countries: countries.map((r) => ({ k: r.keys![0], clicks: r.clicks })),
      devices: devices.map((r) => ({ k: r.keys![0], clicks: r.clicks, impressions: r.impressions })),
      opportunities: opportunities.map((r) => ({ k: r.keys![0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
      sitemaps,
    }
  })
}

/** Tells Google about the sitemap (no-op if already submitted). */
export async function gscSubmitSitemap(sitemapUrl: string) {
  const token = await accessToken(GSC_SCOPE)
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${site()}/sitemaps/${encodeURIComponent(sitemapUrl)}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Search Console returned ${res.status}`)
}

/** Google's index status for one URL. */
export async function gscInspect(url: string) {
  const r = await gapi<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string; googleCanonical?: string; robotsTxtState?: string; pageFetchState?: string }; richResultsResult?: { verdict?: string; detectedItems?: { richResultType: string }[] } } }>(
    GSC_SCOPE, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', { inspectionUrl: url, siteUrl: process.env.GSC_SITE_URL })
  return r.inspectionResult ?? null
}
