// Multi-page site crawler powering the /app Site Audit.
//
// BFS-crawls internal pages from the entered domain (capped, concurrency-limited
// and time-budgeted to fit the function window), runs the shared on-page
// analyzer on each, and returns per-page results plus a site-wide aggregate.

import {
  buildFixes,
  clamp,
  extractInternalLinks,
  extractSignals,
  fetchHtml,
  normalizeUrl,
  scoreAiReadiness,
  scoreContent,
  scoreSchema,
  scoreTechnical,
  type FixItem,
} from '../seo-scan/analyze'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 25
const CONCURRENCY = 5
const TIME_BUDGET_MS = 45_000
const PER_PAGE_TIMEOUT = 8_000

interface PageResult {
  url: string
  status: number
  overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number
  titleLength: number
  h1Count: number
  schemaTypes: string[]
  https: boolean
  indexable: boolean
  fixCount: number
  criticalCount: number
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const start = normalizeUrl(String(body.url ?? ''))
  if (!start) {
    return Response.json({ error: 'Enter a valid domain, e.g. example.com' }, { status: 400 })
  }
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(body.limit) || DEFAULT_LIMIT)
  )

  const began = Date.now()
  const queue: string[] = [start]
  const queued = new Set<string>([stripHash(start)])
  const pages: PageResult[] = []
  const allFixes: { fix: FixItem; page: string }[] = []
  let homeStatusBlocked = false

  while (queue.length > 0 && pages.length < limit && Date.now() - began < TIME_BUDGET_MS) {
    const batch = queue.splice(0, CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (pageUrl) => {
        try {
          const { html, finalUrl, status } = await fetchHtml(pageUrl, PER_PAGE_TIMEOUT)
          if (!html || status >= 400) return { pageUrl, status, html: '', finalUrl }
          return { pageUrl, status, html, finalUrl }
        } catch {
          return { pageUrl, status: 0, html: '', finalUrl: pageUrl }
        }
      })
    )

    for (const r of results) {
      if (!r.html) {
        if (r.pageUrl === start) homeStatusBlocked = r.status === 403 || r.status === 401
        continue
      }
      const signals = extractSignals(r.html, r.finalUrl, r.status)
      const fixes = buildFixes(signals, null)
      const scores = {
        technical: scoreTechnical(fixes),
        content: scoreContent(signals),
        schema: scoreSchema(signals),
        ai: scoreAiReadiness(signals),
      }
      const overall = clamp(
        (scores.technical * 30 + scores.content * 30 + scores.schema * 12 + scores.ai * 16) / 88
      )
      const criticalCount = fixes.filter((f) => f.severity === 'critical').length
      pages.push({
        url: r.finalUrl,
        status: r.status,
        overall,
        scores,
        wordCount: signals.wordCount,
        titleLength: signals.titleLength,
        h1Count: signals.h1Count,
        schemaTypes: signals.schemaTypes,
        https: signals.https,
        indexable: signals.indexable,
        fixCount: fixes.length,
        criticalCount,
      })
      for (const fix of fixes) allFixes.push({ fix, page: r.finalUrl })

      // Discover more internal links (only from the start host).
      if (pages.length + queue.length < limit) {
        for (const link of extractInternalLinks(r.html, r.finalUrl)) {
          const key = stripHash(link)
          if (!queued.has(key) && queued.size < MAX_LIMIT * 3) {
            queued.add(key)
            queue.push(link)
          }
        }
      }
    }
  }

  if (pages.length === 0) {
    return Response.json(
      {
        error: homeStatusBlocked
          ? 'This site blocks automated requests (403). Set SCRAPE_API_TEMPLATE to enable the proxy fallback, or try another domain.'
          : 'Could not crawl that site. Check the domain and make sure it is publicly accessible.',
      },
      { status: 502 }
    )
  }

  // ── Aggregate ──
  const avg = (xs: number[]) => clamp(xs.reduce((a, b) => a + b, 0) / xs.length)
  const siteScore = avg(pages.map((p) => p.overall))
  const categories = {
    technical: avg(pages.map((p) => p.scores.technical)),
    content: avg(pages.map((p) => p.scores.content)),
    schema: avg(pages.map((p) => p.scores.schema)),
    ai: avg(pages.map((p) => p.scores.ai)),
  }

  // Group identical issues across pages.
  const grouped = new Map<string, { fix: FixItem; pages: string[] }>()
  for (const { fix, page } of allFixes) {
    const key = `${fix.severity}|${fix.category}|${fix.title}`
    const g = grouped.get(key)
    if (g) {
      if (!g.pages.includes(page)) g.pages.push(page)
    } else {
      grouped.set(key, { fix, pages: [page] })
    }
  }
  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const issues = [...grouped.values()]
    .map((g) => ({
      severity: g.fix.severity,
      category: g.fix.category,
      title: g.fix.title,
      affectedPages: g.pages.length,
    }))
    .sort(
      (a, b) =>
        rank[a.severity] - rank[b.severity] || b.affectedPages - a.affectedPages
    )

  const severityTotals = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  }

  return Response.json({
    domain: safeHost(start),
    startUrl: start,
    crawledAt: new Date().toISOString(),
    pagesCrawled: pages.length,
    reachedLimit: pages.length >= limit,
    siteScore,
    categories,
    severityTotals,
    totals: {
      avgWordCount: Math.round(avg(pages.map((p) => p.wordCount))),
      pagesWithSchema: pages.filter((p) => p.schemaTypes.length > 0).length,
      nonIndexable: pages.filter((p) => !p.indexable).length,
      httpsPages: pages.filter((p) => p.https).length,
    },
    issues,
    pages: pages.sort((a, b) => a.overall - b.overall),
  })
}

function stripHash(u: string): string {
  try {
    const x = new URL(u)
    x.hash = ''
    return x.toString()
  } catch {
    return u
  }
}
function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}
