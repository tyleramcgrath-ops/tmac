// SEO intelligence for every SaySites site, run by RankForge's engines
// (vendored in lib/rankforge; refresh with scripts/sync-rankforge.sh):
//
// - Site audit: every published page is rendered here, in-process, and run
//   through RankForge's page analyzer (technical, content, schema and AI
//   readiness scores) and its recommendation engine (page-type-aware rules,
//   cross-page checks, priority and confidence). No crawling ourselves.
// - Competitor audit: RankForge's crawler reads a competitor's public site
//   (a handful of pages, SSRF-guarded) and scores it the same way.
// - Rankings (SERPAPI_KEY), AI answers (PERPLEXITY_API_KEY) and backlinks
//   (MAJESTIC_API_KEY): each a paid lookup, so each is off until its key is
//   set, capped per site per day, and only ever reports what the provider
//   returned.

import { randomUUID } from 'crypto'
import {
  buildFixes,
  extractSignals,
  extractInternalLinks,
  overallScore,
  scoreAiReadiness,
  scoreContent,
  scoreSchema,
  scoreTechnical,
} from './rankforge/seo-scan/analyze'
import { isCrawlBatchError, runCrawlBatch, type CrawlPageResult } from './rankforge/engine/crawl-batch'
import { generateRecommendationsV2 } from './rankforge/reco/engine'
import { fetchKeywordPosition, serpApiKey } from './rankforge/serp'
import { checkCitation, perplexityApiKey } from './rankforge/ai-citations'
import { checkBacklinks, majesticApiKey } from './rankforge/backlinks'
import type { Scan } from './rankforge/types'
import { pagePath } from './schema'
import { serveSitePath } from './serve'
import type { SiteBundle } from './sites'
import type { Store } from './store'

export interface Scores {
  technical: number
  content: number
  schema: number
  ai: number
}

export interface SeoIssue {
  id: string
  title: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  why: string
  ifIgnored: string
  pages: string[]
  confidence: number
  rank: number
}

export interface SeoAudit {
  at: string
  url: string
  siteScore: number
  scores: Scores
  pages: { url: string; title: string; overall: number; scores: Scores }[]
  issues: SeoIssue[]
}

export interface CompetitorAudit {
  url: string
  at: string
  siteScore: number
  scores: Scores
  pages: number
  error?: string
}

export interface KeywordCheck {
  at: string
  position: number | null
  url: string | null
  topResult: string | null
}

export interface AiCheck {
  at: string
  cited: boolean
  position: number | null
  // Who the answer engine cited instead (hosts, in order).
  sources: string[]
}

export interface SeoState {
  audit?: SeoAudit
  competitors: CompetitorAudit[]
  keywords: { keyword: string; checks: KeywordCheck[] }[]
  aiQueries: { query: string; checks: AiCheck[] }[]
  backlinks?: { at: string; totalBacklinks: number | null; referringDomains: number | null; trustFlow: number | null; citationFlow: number | null }
}

export const LIMITS = { keywords: 10, aiQueries: 5, competitors: 3, competitorPages: 12, checksPerDay: 1 }

export function emptySeoState(): SeoState {
  return { competitors: [], keywords: [], aiQueries: [] }
}

export async function loadSeoState(store: Store, siteId: string): Promise<SeoState> {
  const raw = (await store.seoState(siteId)) as Partial<SeoState> | null
  return { ...emptySeoState(), ...(raw ?? {}) }
}

export const intelReady = {
  rankings: () => !!serpApiKey(),
  ai: () => !!perplexityApiKey(),
  backlinks: () => !!majesticApiKey(),
}

// RankForge's per-page analysis, applied to HTML we already have.
export function analyzePage(url: string, html: string, status = 200): CrawlPageResult {
  const signals = extractSignals(html, url, status)
  const fixes = buildFixes(signals, null)
  const scores = { technical: scoreTechnical(fixes), content: scoreContent(signals), schema: scoreSchema(signals), ai: scoreAiReadiness(signals) }
  return {
    url,
    status,
    overall: overallScore(scores),
    scores,
    wordCount: signals.wordCount,
    title: signals.title,
    titleLength: signals.titleLength,
    metaDescription: signals.metaDescription,
    canonical: signals.canonical,
    mixedContent: signals.mixedContent,
    h1Count: signals.h1Count,
    schemaTypes: signals.schemaTypes,
    ...(signals.localBusinessMissingFields ? { localBusinessMissingFields: signals.localBusinessMissingFields } : {}),
    internalTargets: [...new Set(extractInternalLinks(html, url, 120))].slice(0, 40),
    https: signals.https,
    indexable: signals.indexable,
    h2Count: signals.h2Count,
    metaDescriptionLength: signals.metaDescriptionLength,
    imagesMissingAlt: signals.imagesMissingAlt,
    imagesMissingLazyLoad: signals.imagesMissingLazyLoad,
    hasFaq: signals.hasFaq,
    hasOpenGraph: signals.hasOpenGraph,
    externalLinks: signals.externalLinks,
    fixes,
  }
}

function average(pages: CrawlPageResult[]): { siteScore: number; scores: Scores } {
  const n = Math.max(1, pages.length)
  const avg = (f: (p: CrawlPageResult) => number) => Math.round(pages.reduce((t, p) => t + f(p), 0) / n)
  return { siteScore: avg((p) => p.overall), scores: { technical: avg((p) => p.scores.technical), content: avg((p) => p.scores.content), schema: avg((p) => p.scores.schema), ai: avg((p) => p.scores.ai) } }
}

// The whole site, as visitors and Google see it: every published page
// rendered exactly as served, then RankForge's recommendation engine.
export async function auditSite(bundle: SiteBundle, baseUrl: string, industry?: string): Promise<SeoAudit> {
  const base = baseUrl.replace(/\/+$/, '')
  const pages: CrawlPageResult[] = []
  for (const p of bundle.pages) {
    if (p.status !== 'published') continue
    const path = pagePath(p)
    const res = serveSitePath(bundle, path.split('/').filter(Boolean), { preview: false })
    if (res.status !== 200 || !(res.headers.get('content-type') ?? '').includes('text/html')) continue
    pages.push(analyzePage(`${base}${path}`, await res.text()))
  }
  return finishAudit(bundle.site.id, base, pages, industry)
}

function finishAudit(siteId: string, base: string, pages: CrawlPageResult[], industry?: string): SeoAudit {
  const now = new Date().toISOString()
  const { siteScore, scores } = average(pages)
  const scan: Scan = {
    id: randomUUID(),
    projectId: siteId,
    createdBy: 'saysites',
    createdAt: now,
    status: 'completed',
    startedAt: now,
    completedAt: now,
    error: null,
    summary: { pagesCrawled: pages.length, urlsDiscovered: pages.length, blockedCount: 0, siteScore, critical: 0, warning: 0, info: 0 },
    pages,
    blocked: [],
  }
  const { recommendations } = generateRecommendationsV2(scan, { industry })
  return {
    at: now,
    url: base,
    siteScore,
    scores,
    pages: pages.map((p) => ({ url: p.url, title: p.title, overall: p.overall, scores: p.scores })),
    issues: recommendations.slice(0, 40).map((r) => ({
      id: r.issueId,
      title: r.title,
      severity: r.severity,
      category: r.category,
      why: r.explanation?.why ?? r.reasoning,
      ifIgnored: r.explanation?.whatIfIgnored ?? '',
      pages: r.evidence.affectedUrls.slice(0, 8).map((u) => u.replace(base, '') || '/'),
      confidence: r.confidence,
      rank: r.priorityRank ?? 0,
    })),
  }
}

// A competitor's public site, crawled and scored by RankForge (a few pages).
export async function auditCompetitor(url: string): Promise<CompetitorAudit> {
  const at = new Date().toISOString()
  let visited: string[] = []
  let frontier: string[] | undefined
  const pages: CrawlPageResult[] = []
  for (let round = 0; round < 2; round++) {
    const r = await runCrawlBatch({ url, maxPages: LIMITS.competitorPages, visited, ...(frontier ? { frontier } : {}), seedSitemap: true })
    if (isCrawlBatchError(r)) return { url, at, siteScore: 0, scores: { technical: 0, content: 0, schema: 0, ai: 0 }, pages: 0, error: r.error }
    pages.push(...r.pages)
    visited = r.visited
    frontier = r.frontier
    if (r.done) break
  }
  const { siteScore, scores } = average(pages)
  return { url, at, siteScore, scores, pages: pages.length }
}

const today = () => new Date().toISOString().slice(0, 10)
export const checkedToday = (checks: { at: string }[]) => checks.some((c) => c.at.slice(0, 10) === today())

export async function checkKeyword(host: string, keyword: string): Promise<KeywordCheck | null> {
  const key = serpApiKey()
  if (!key) return null
  const r = await fetchKeywordPosition(keyword, host.replace(/^www\./, ''), key)
  return { at: new Date().toISOString(), position: r.position, url: r.url, topResult: r.topResult }
}

export async function checkAiQuery(host: string, query: string): Promise<AiCheck | null> {
  const key = perplexityApiKey()
  if (!key) return null
  const r = await checkCitation(query, host.replace(/^www\./, ''), key)
  if (!r.available) return null
  return { at: new Date().toISOString(), cited: r.cited, position: r.position, sources: r.sources.slice(0, 6).map((s) => s.host) }
}

export async function checkLinks(host: string): Promise<SeoState['backlinks'] | null> {
  const key = majesticApiKey()
  if (!key) return null
  const r = await checkBacklinks(host.replace(/^www\./, ''), key)
  if (!r.available) return null
  return { at: new Date().toISOString(), totalBacklinks: r.totalBacklinks, referringDomains: r.referringDomains, trustFlow: r.trustFlow, citationFlow: r.citationFlow }
}

