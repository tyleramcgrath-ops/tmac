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
import { checkOutboundUrl } from '@/lib/ssrf'
import { checkRateLimit, clientKey } from '@/lib/rateLimit'
import { discoverKeywords, type DiscoveredKeyword } from '@/lib/keywords/discover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HARD_CAP = 300 // safety ceiling on total pages per audit
const BATCH = 10 // pages analyzed per request
const CONCURRENCY = 6
const REQUEST_BUDGET_MS = 38_000
const PER_PAGE_TIMEOUT = 8_000

interface PageResult {
  url: string
  status: number
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
  fixes: FixItem[]
  keywords: DiscoveredKeyword[]
}

export async function POST(request: Request) {
  const rl = checkRateLimit(clientKey(request, 'crawl'), 30, 60_000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many crawl requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

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
      if (!r.html) {
        if (r.pageUrl === stripHash(start) && (r.status === 403 || r.status === 401)) blockedHome = true
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
      const links = extractInternalLinks(r.html, r.finalUrl, 120).map(stripHash)
      const keywords = signals.indexable
        ? discoverKeywords({
            title: signals.title,
            metaDescription: signals.metaDescription,
            h1: signals.h1,
            h2: signals.h2,
            bodyText: signals.bodyText,
            url: r.finalUrl,
            schemaTypes: signals.schemaTypes,
            hasFaq: signals.hasFaq,
            brandTerms: brandTerms(host),
          })
        : []
      pages.push({
        url: r.finalUrl,
        status: r.status,
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
        fixes,
        keywords,
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
    return Response.json(
      {
        error: blockedHome
          ? 'This site blocks automated requests (403). Set SCRAPE_API_TEMPLATE to enable the proxy fallback, or try another domain.'
          : 'Could not crawl that site. Check the domain and make sure it is publicly accessible.',
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
    const blocked = await checkOutboundUrl(url)
    if (blocked) return null
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
// Best-effort brand term guess from the domain itself (e.g. "acmeplumbing.com"
// -> "acmeplumbing" / "acme plumbing"), used only to classify branded intent —
// never presented as verified brand data.
function brandTerms(host: string): string[] {
  const label = host.split('.')[0] ?? ''
  if (!label) return []
  const spaced = label.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
  return [...new Set([label, spaced])].filter(Boolean)
}
