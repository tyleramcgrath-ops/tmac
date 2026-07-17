// Full-site crawler powering the /app Site Audit.
//
// Stateless + batched: the client calls this repeatedly, passing back the
// `frontier` and `visited` it received, until `done` is true. This crawls the
// entire site across multiple short requests (bypassing the per-request
// serverless time limit). The first call seeds the frontier from the site's
// XML sitemap(s) when available, then discovers links while crawling.

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
import { assessPageValidity } from '../seo-scan/page-validity'
import { isSafeFetchTarget } from '../seo-scan/url-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HARD_CAP = 300 // safety ceiling on total pages per audit
const BATCH = 10 // pages analyzed per request
const CONCURRENCY = 6
const REQUEST_BUDGET_MS = 38_000
const PER_PAGE_TIMEOUT = 8_000

interface BlockedResult {
  url: string
  status: number
  reason: string
  detail: string
}

interface PageResult {
  url: string
  status: number
  duplicateOf?: string
  overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number
  title: string
  titleLength: number
  metaDescription: string
  canonical: string
  mixedContent: boolean
  h1Count: number
  schemaTypes: string[]
  internalTargets: string[]
  https: boolean
  indexable: boolean
  // Richer signals forwarded for the recommendation engine (V2).
  h2Count: number
  metaDescriptionLength: number
  imagesMissingAlt: number
  hasFaq: boolean
  hasOpenGraph: boolean
  externalLinks: number
  fixes: FixItem[]
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
  const host = safeHost(start)
  const maxPages = Math.min(HARD_CAP, Math.max(1, Number(body.maxPages) || 150))

  const visited = new Set<string>((Array.isArray(body.visited) ? body.visited : []).map(String))
  let frontier: string[] = Array.isArray(body.frontier) ? body.frontier.map(String) : []
  const firstCall = !Array.isArray(body.frontier)

  // First call: seed from sitemap(s) + homepage.
  if (firstCall) {
    frontier = [stripHash(start)]
    if (body.seedSitemap !== false) {
      const fromSitemap = await seedFromSitemap(start, host, maxPages * 2)
      for (const u of fromSitemap) if (!frontier.includes(u)) frontier.push(u)
    }
  }

  const began = Date.now()
  const pages: PageResult[] = []
  const blocked: BlockedResult[] = []
  const queued = new Set<string>(frontier)
  let blockedHome = false

  while (
    frontier.length > 0 &&
    visited.size + pages.length < maxPages &&
    pages.length < BATCH &&
    Date.now() - began < REQUEST_BUDGET_MS
  ) {
    // pull a concurrency-sized slice of not-yet-visited URLs
    const slice: string[] = []
    while (slice.length < CONCURRENCY && frontier.length > 0) {
      const next = frontier.shift()!
      const key = stripHash(next)
      if (visited.has(key)) continue
      slice.push(next)
    }
    if (slice.length === 0) break

    const results = await Promise.all(
      slice.map(async (pageUrl) => {
        try {
          const { html, finalUrl, status } = await fetchHtml(pageUrl, PER_PAGE_TIMEOUT)
          return { pageUrl, html, finalUrl, status }
        } catch {
          return { pageUrl, html: '', finalUrl: pageUrl, status: 0 }
        }
      })
    )

    for (const r of results) {
      visited.add(stripHash(r.pageUrl))

      // INTEGRITY GATE: error pages, WAF/bot challenges, proxy denials, and
      // empty/non-HTML responses must never be scored. A 403 with an HTML
      // body is a firewall's message, not the website — analyzing it would
      // fabricate an audit. Blocked pages are reported as blocked; unknown
      // stays unknown.
      const validity = assessPageValidity(r.html, r.status)
      if (!validity.ok) {
        blocked.push({
          url: r.pageUrl,
          status: r.status,
          reason: validity.reason ?? 'unknown',
          detail: validity.detail ?? '',
        })
        if (r.pageUrl === stripHash(start)) blockedHome = true
        continue
      }

      let signals
      try {
        signals = extractSignals(r.html, r.finalUrl, r.status)
      } catch {
        // Extraction failure is reported honestly, never scored around.
        blocked.push({
          url: r.pageUrl,
          status: r.status,
          reason: 'extraction_failed',
          detail: 'The page was fetched but its content could not be parsed.',
        })
        continue
      }
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
      const links = extractInternalLinks(r.html, r.finalUrl, 120).map(stripHash)
      // Canonical duplicate detection: a page whose canonical points at a
      // different URL is a variant, not an independent page. It is kept in
      // the report (data is real) but flagged so it is never double-counted
      // as a separate optimization target.
      const canonicalNorm = normalizeCanonical(signals.canonical)
      const selfNorm = normalizeCanonical(r.finalUrl)
      const duplicateOf =
        canonicalNorm && selfNorm && canonicalNorm !== selfNorm ? canonicalNorm : undefined
      pages.push({
        url: r.finalUrl,
        status: r.status,
        ...(duplicateOf ? { duplicateOf } : {}),
        overall,
        scores,
        wordCount: signals.wordCount,
        title: signals.title,
        titleLength: signals.titleLength,
        metaDescription: signals.metaDescription,
        canonical: signals.canonical,
        mixedContent: signals.mixedContent,
        h1Count: signals.h1Count,
        schemaTypes: signals.schemaTypes,
        internalTargets: [...new Set(links)].slice(0, 40),
        https: signals.https,
        indexable: signals.indexable,
        h2Count: signals.h2Count,
        metaDescriptionLength: signals.metaDescriptionLength,
        imagesMissingAlt: signals.imagesMissingAlt,
        hasFaq: signals.hasFaq,
        hasOpenGraph: signals.hasOpenGraph,
        externalLinks: signals.externalLinks,
        fixes,
      })
      // discover internal links
      for (const link of links) {
        if (!visited.has(link) && !queued.has(link)) {
          queued.add(link)
          frontier.push(link)
        }
      }
    }
  }

  if (firstCall && pages.length === 0) {
    const homeBlock = blocked.find((b) => b.url === stripHash(start))
    return Response.json(
      {
        error: blockedHome
          ? `This site could not be read: ${homeBlock?.detail ?? 'the homepage is blocked (403).'} No audit was generated — blocked pages are never scored. Set SCRAPE_API_TEMPLATE to enable the proxy fallback, or try another domain.`
          : 'Could not crawl that site. Check the domain and make sure it is publicly accessible.',
        blocked,
      },
      { status: 502 }
    )
  }

  // De-dupe remaining frontier against visited and cap it.
  const remaining = frontier.filter((u) => !visited.has(stripHash(u))).slice(0, HARD_CAP * 2)
  const done = remaining.length === 0 || visited.size >= maxPages

  return Response.json({
    domain: host,
    startUrl: start,
    pages,
    blocked,
    visited: [...visited],
    frontier: done ? [] : remaining,
    discovered: visited.size + remaining.length,
    crawledTotal: visited.size,
    done,
    maxPages,
  })
}

// ─── Sitemap discovery ────────────────────────────────────────────────────────

async function seedFromSitemap(start: string, host: string, cap: number): Promise<string[]> {
  let origin = ''
  try {
    origin = new URL(start).origin
  } catch {
    return []
  }
  const candidates = [
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.xml`,
    `${origin}/wp-sitemap.xml`,
  ]
  const urls = new Set<string>()

  for (const sm of candidates) {
    if (urls.size >= cap) break
    const xml = await safeText(sm)
    if (!xml) continue

    // sitemap index → child sitemaps
    const childSitemaps = matchAll(xml, /<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi)
    if (childSitemaps.length > 0) {
      for (const child of childSitemaps.slice(0, 12)) {
        if (urls.size >= cap) break
        const childXml = await safeText(child.trim())
        if (!childXml) continue
        for (const loc of matchAll(childXml, /<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi)) {
          addIfSameHost(urls, loc, host, cap)
        }
      }
    }
    // flat urlset
    for (const loc of matchAll(xml, /<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi)) {
      addIfSameHost(urls, loc, host, cap)
    }
    if (urls.size > 0) break // found a working sitemap
  }
  return [...urls]
}

function addIfSameHost(set: Set<string>, loc: string, host: string, cap: number) {
  if (set.size >= cap) return
  try {
    const u = new URL(loc.trim())
    if (u.hostname.replace(/^www\./, '') !== host) return
    if (/\.(jpg|jpeg|png|gif|svg|webp|avif|css|js|pdf|zip|mp4|mp3|ico|woff2?|ttf)(\?|$)/i.test(u.pathname)) return
    u.hash = ''
    set.add(u.toString())
  } catch {
    /* ignore */
  }
}

function matchAll(s: string, re: RegExp): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) out.push(m[1])
  return out
}

async function safeText(url: string): Promise<string | null> {
  try {
    // SSRF guard (Phase D.6 P4): sitemap <loc> URLs are attacker-influenced.
    if (!(await isSafeFetchTarget(url)).ok) return null
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RankForgeBot/1.0)' },
    }).finally(() => clearTimeout(timer))
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!/xml|text/.test(ct)) return null
    const text = await res.text()
    return text.slice(0, 2_000_000)
  } catch {
    return null
  }
}

function normalizeCanonical(u: string): string {
  if (!u) return ''
  try {
    const x = new URL(u)
    x.hash = ''
    // Trailing-slash-insensitive comparison so example.com/a and /a/ match.
    return x.origin + x.pathname.replace(/\/+$/, '') + x.search
  } catch {
    return ''
  }
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
