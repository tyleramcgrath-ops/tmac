// Live SEO scan for the RankForge AI site.
//
// Always runs a key-free on-page analysis (see analyze.ts). When a keyword is
// supplied it adds an Intent Match score. Page Speed uses Google PSI (works
// without a key, key optional via PAGESPEED_API_KEY). Competitor top-10
// comparison activates when SERPAPI_KEY is set. Everything degrades gracefully
// so a missing key never breaks the core scan.

import {
  buildFixes,
  clamp,
  extractSignals,
  fetchHtml,
  keywordUsage,
  normalizeUrl,
  scoreAiReadiness,
  scoreContent,
  scoreIntent,
  scoreSchema,
  scoreTechnical,
  type CategoryScore,
  type Signals,
} from './analyze'
import { assessPageValidity } from './page-validity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface PageSpeed {
  available: boolean
  performance: number | null
  lcpMs: number | null
  cls: number | null
  strategy: string
  error?: string
}

interface CompetitorRow {
  url: string
  title: string
  wordCount: number
  internalLinks: number
  schemaCount: number
}

interface Competitors {
  available: boolean
  keyword: string
  yours: { wordCount: number; internalLinks: number; schemaCount: number }
  median: { wordCount: number; internalLinks: number; schemaCount: number }
  results: CompetitorRow[]
  note?: string
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const url = normalizeUrl(String(body.url ?? ''))
  if (!url) {
    return Response.json(
      { error: 'Enter a valid domain, e.g. example.com' },
      { status: 400 }
    )
  }
  const keyword = String(body.keyword ?? '').trim().slice(0, 80)
  const debug =
    body.debug === true ||
    new URL(request.url).searchParams.get('debug') === '1'

  // ── Fetch + extract the user's page ──
  let signals: Signals
  let signalsDebug: { via: string; status: number; proxyConfigured: boolean } | null = null
  try {
    const fetched = await fetchHtml(url)
    const { html, finalUrl, status, via, proxyConfigured } = fetched
    // INTEGRITY GATE: also catches WAF/bot challenges served with status 200 —
    // those bodies are interstitials, not the site, and must never be scored.
    const validity = assessPageValidity(html, status)
    if (!validity.ok) {
      const blocked = status === 403 || status === 401 || status === 429 ||
        validity.reason === 'waf_challenge' || validity.reason === 'proxy_denial'
      return Response.json(
        {
          error: blocked
            ? `This page could not be read: ${validity.detail ?? 'the site blocks automated requests.'} No score was generated — blocked pages are never analyzed. Set SCRAPE_API_TEMPLATE to enable the proxy fallback, or try another page/domain.`
            : `The site responded with ${validity.detail ?? `status ${status || 'no content'}`} Try a different page.`,
          blockedReason: validity.reason,
          ...(debug ? { debug: { via, status, proxyConfigured } } : {}),
        },
        { status: 502 }
      )
    }
    signals = extractSignals(html, finalUrl, status)
    if (debug) signalsDebug = { via, status, proxyConfigured }
  } catch {
    return Response.json(
      {
        error:
          'We could not reach that site. Check the domain and make sure it is publicly accessible.',
        ...(debug ? { debug: { via: 'failed', status: 0, proxyConfigured: !!process.env.SCRAPE_API_TEMPLATE } } : {}),
      },
      { status: 502 }
    )
  }

  // ── Run the optional, network-dependent extras in parallel ──
  const [pageSpeed, competitors] = await Promise.all([
    runPageSpeed(signals.finalUrl),
    keyword ? runCompetitors(signals, keyword) : Promise.resolve(null),
  ])

  // ── Scores ──
  const usage = keyword ? keywordUsage(signals, keyword) : null
  const fixes = buildFixes(signals, usage)

  const technical = scoreTechnical(fixes)
  const content = scoreContent(signals)
  const schema = scoreSchema(signals)
  const ai = scoreAiReadiness(signals)

  const categories: CategoryScore[] = [
    { key: 'technical', label: 'Technical SEO', score: technical },
    { key: 'content', label: 'Content', score: content },
    { key: 'schema', label: 'Schema', score: schema },
    { key: 'ai', label: 'AI Search Readiness', score: ai },
  ]

  const weights: [number, number][] = [
    [technical, 30],
    [content, 30],
    [schema, 12],
    [ai, 16],
  ]

  if (usage) {
    const intent = scoreIntent(usage)
    categories.push({
      key: 'intent',
      label: 'Keyword Intent Match',
      score: intent,
      detail: `Targeting "${usage.keyword}"`,
    })
    weights.push([intent, 16])
  }
  if (pageSpeed.available && pageSpeed.performance !== null) {
    categories.push({
      key: 'speed',
      label: 'Page Speed',
      score: pageSpeed.performance,
      detail:
        pageSpeed.lcpMs !== null ? `LCP ${(pageSpeed.lcpMs / 1000).toFixed(1)}s` : undefined,
    })
    weights.push([pageSpeed.performance, 12])
  }

  const totalWeight = weights.reduce((s, [, w]) => s + w, 0)
  const overall = clamp(weights.reduce((s, [v, w]) => s + v * w, 0) / totalWeight)

  return Response.json({
    url,
    finalUrl: signals.finalUrl,
    fetchedAt: new Date().toISOString(),
    keyword: keyword || null,
    overall,
    categories,
    usage,
    pageSpeed,
    competitors,
    backlinks: backlinksStatus(),
    ...(debug && signalsDebug ? { debug: signalsDebug } : {}),
    metrics: {
      titleLength: signals.titleLength,
      metaDescriptionLength: signals.metaDescriptionLength,
      h1Count: signals.h1Count,
      h2Count: signals.h2Count,
      wordCount: signals.wordCount,
      images: signals.images,
      imagesMissingAlt: signals.imagesMissingAlt,
      internalLinks: signals.internalLinks,
      externalLinks: signals.externalLinks,
      schemaTypes: signals.schemaTypes,
      https: signals.https,
      indexable: signals.indexable,
      hasViewport: signals.hasViewport,
      hasFaq: signals.hasFaq,
      hasOpenGraph: signals.hasOpenGraph,
    },
    fixes,
  })
}

// ─── Page Speed (Google PSI — key optional) ───────────────────────────────────

async function runPageSpeed(url: string): Promise<PageSpeed> {
  const strategy = 'mobile'
  const base: PageSpeed = {
    available: false,
    performance: null,
    lcpMs: null,
    cls: null,
    strategy,
  }
  try {
    const endpoint = new URL(
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    )
    endpoint.searchParams.set('url', url)
    endpoint.searchParams.set('strategy', strategy)
    endpoint.searchParams.set('category', 'performance')
    if (process.env.PAGESPEED_API_KEY)
      endpoint.searchParams.set('key', process.env.PAGESPEED_API_KEY)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 22_000)
    const res = await fetch(endpoint, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    )
    if (!res.ok) return { ...base, error: `PSI returned ${res.status}` }
    const data = await res.json()
    const lh = data?.lighthouseResult
    const perf = lh?.categories?.performance?.score
    const lcp = lh?.audits?.['largest-contentful-paint']?.numericValue
    const cls = lh?.audits?.['cumulative-layout-shift']?.numericValue
    return {
      available: typeof perf === 'number',
      performance: typeof perf === 'number' ? Math.round(perf * 100) : null,
      lcpMs: typeof lcp === 'number' ? Math.round(lcp) : null,
      cls: typeof cls === 'number' ? Math.round(cls * 1000) / 1000 : null,
      strategy,
    }
  } catch {
    return { ...base, error: 'Page Speed data unavailable.' }
  }
}

// ─── Competitor top-10 comparison (SERPAPI — key required) ─────────────────────

async function runCompetitors(
  user: Signals,
  keyword: string
): Promise<Competitors> {
  const yours = {
    wordCount: user.wordCount,
    internalLinks: user.internalLinks,
    schemaCount: user.schemaTypes.length,
  }
  const empty: Competitors = {
    available: false,
    keyword,
    yours,
    median: yours,
    results: [],
    note: 'Connect a SERP API (set SERPAPI_KEY) to compare against the live top 10.',
  }

  const key = process.env.SERPAPI_KEY
  if (!key) return empty

  let links: string[] = []
  try {
    const endpoint = new URL('https://serpapi.com/search.json')
    endpoint.searchParams.set('engine', 'google')
    endpoint.searchParams.set('q', keyword)
    endpoint.searchParams.set('num', '10')
    endpoint.searchParams.set('api_key', key)
    const res = await fetch(endpoint)
    if (!res.ok) return { ...empty, note: `SERP API returned ${res.status}.` }
    const data = await res.json()
    const organic = Array.isArray(data?.organic_results) ? data.organic_results : []
    let host = ''
    try {
      host = new URL(user.finalUrl).hostname.replace(/^www\./, '')
    } catch {
      /* noop */
    }
    links = organic
      .map((r: { link?: string }) => r.link)
      .filter((l: unknown): l is string => typeof l === 'string')
      .filter((l: string) => {
        try {
          return new URL(l).hostname.replace(/^www\./, '') !== host
        } catch {
          return false
        }
      })
      .slice(0, 3)
  } catch {
    return { ...empty, note: 'SERP lookup failed.' }
  }

  const rows: CompetitorRow[] = []
  for (const link of links) {
    try {
      const { html, finalUrl, status } = await fetchHtml(link, 9000)
      if (!html || status >= 400) continue
      const s = extractSignals(html, finalUrl, status)
      rows.push({
        url: finalUrl,
        title: s.title.slice(0, 90),
        wordCount: s.wordCount,
        internalLinks: s.internalLinks,
        schemaCount: s.schemaTypes.length,
      })
    } catch {
      /* skip unreachable competitor */
    }
  }

  if (rows.length === 0) return { ...empty, note: 'Competitor pages could not be crawled.' }

  const median = (xs: number[]) => {
    const sorted = [...xs].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)] ?? 0
  }
  return {
    available: true,
    keyword,
    yours,
    median: {
      wordCount: median(rows.map((r) => r.wordCount)),
      internalLinks: median(rows.map((r) => r.internalLinks)),
      schemaCount: median(rows.map((r) => r.schemaCount)),
    },
    results: rows,
  }
}

function backlinksStatus() {
  // No free/standard backlink provider — surfaced as informational until one is
  // wired via env. Mirrors seo-intel's neutral handling (no fake authority score).
  return {
    available: false,
    note: 'Connect a backlink API to compare referring domains and authority.',
  }
}
