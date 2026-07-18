// Pure, environment-agnostic core of the batched site crawl. Extracted from
// app/api/crawl/route.ts (which remains a thin wrapper: rate limit + parse +
// call this + respond) so the scheduler's server-side crawl driver can call
// the same logic directly, in-process — no HTTP-to-self, no browser origin
// required. Stateless + batched by design: callers pass back `visited` and
// `frontier` each round until `done` is true (see SCHEDULER_DESIGN.md §6).

import {
  buildFixes,
  extractInternalLinks,
  extractSignals,
  fetchHtml,
  normalizeUrl,
  overallScore,
  scoreAiReadiness,
  scoreContent,
  scoreSchema,
  scoreTechnical,
  type FixItem,
} from '../../app/api/seo-scan/analyze'
import { assessPageValidity } from '../../app/api/seo-scan/page-validity'
import { isSafeFetchTarget } from '../../app/api/seo-scan/url-guard'

const HARD_CAP = 300 // safety ceiling on total pages per audit
const BATCH = 10 // pages analyzed per call
const CONCURRENCY = 6
const REQUEST_BUDGET_MS = 38_000
const PER_PAGE_TIMEOUT = 8_000

export interface BlockedResult {
  url: string
  status: number
  reason: string
  detail: string
}

export interface CrawlPageResult {
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
  h2Count: number
  metaDescriptionLength: number
  imagesMissingAlt: number
  hasFaq: boolean
  hasOpenGraph: boolean
  externalLinks: number
  fixes: FixItem[]
}

export interface CrawlBatchInput {
  url: string
  maxPages?: number
  visited?: string[]
  frontier?: string[]
  seedSitemap?: boolean
}

export interface CrawlBatchOk {
  domain: string
  startUrl: string
  pages: CrawlPageResult[]
  blocked: BlockedResult[]
  visited: string[]
  frontier: string[]
  discovered: number
  crawledTotal: number
  done: boolean
  maxPages: number
}

export interface CrawlBatchError {
  error: string
  blocked: BlockedResult[]
  status: 400 | 502
}

export type CrawlBatchResult = CrawlBatchOk | CrawlBatchError

export function isCrawlBatchError(r: CrawlBatchResult): r is CrawlBatchError {
  return 'error' in r
}

// One bounded round of the batched crawl: up to BATCH pages or
// REQUEST_BUDGET_MS, whichever comes first. Call again with the returned
// `visited`/`frontier` until `done`. First call omits `frontier` entirely
// (distinguishes "first call" from "resumed call with an empty frontier").
export async function runCrawlBatch(input: CrawlBatchInput): Promise<CrawlBatchResult> {
  const start = normalizeUrl(input.url)
  if (!start) return { error: 'Enter a valid domain, e.g. example.com', blocked: [], status: 400 }
  const host = safeHost(start)
  const maxPages = Math.min(HARD_CAP, Math.max(1, input.maxPages || 150))

  const visited = new Set<string>(input.visited ?? [])
  let frontier: string[] = input.frontier ?? []
  const firstCall = input.frontier === undefined

  if (firstCall) {
    frontier = [stripHash(start)]
    if (input.seedSitemap !== false) {
      const fromSitemap = await seedFromSitemap(start, host, maxPages * 2)
      for (const u of fromSitemap) if (!frontier.includes(u)) frontier.push(u)
    }
  }

  const began = Date.now()
  const pages: CrawlPageResult[] = []
  const blocked: BlockedResult[] = []
  const queued = new Set<string>(frontier)
  let blockedHome = false

  while (
    frontier.length > 0 &&
    visited.size + pages.length < maxPages &&
    pages.length < BATCH &&
    Date.now() - began < REQUEST_BUDGET_MS
  ) {
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
      const overall = overallScore(scores)
      const links = extractInternalLinks(r.html, r.finalUrl, 120).map(stripHash)
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
    return {
      error: blockedHome
        ? `This site could not be read: ${homeBlock?.detail ?? 'the homepage is blocked (403).'} No audit was generated — blocked pages are never scored. Set SCRAPE_API_TEMPLATE to enable the proxy fallback, or try another domain.`
        : 'Could not crawl that site. Check the domain and make sure it is publicly accessible.',
      blocked,
      status: 502,
    }
  }

  const remaining = frontier.filter((u) => !visited.has(stripHash(u))).slice(0, HARD_CAP * 2)
  const done = remaining.length === 0 || visited.size >= maxPages

  return {
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
  }
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
    for (const loc of matchAll(xml, /<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>/gi)) {
      addIfSameHost(urls, loc, host, cap)
    }
    if (urls.size > 0) break
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
