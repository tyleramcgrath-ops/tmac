// Shared DB-gathering helpers for building a ProjectFusion. Three call sites
// (opportunities API, project overview API, and the fusion/opportunities job
// handlers) all need the same shape: crawl pages + keywords + GSC/GA4 rows +
// the resulting freshness verdict. Centralizing it here keeps the mapping from
// raw Prisma rows to fusion inputs in exactly one place.

import { fuse, type CrawlPageInput, type KeywordInput, type GscRowInput, type Ga4RowInput, type ProjectFusion } from './engine'
import { classifyFreshness, worstFreshness, type FreshnessStatus } from '@/lib/freshness/policy'

export const PAGE_SELECT = {
  url: true, status: true, title: true, metaDescription: true, h1Count: true, contentLength: true,
  canonical: true, hasNoindex: true, hasMixedContent: true, schemaTypes: true, internalLinks: true,
  inboundCount: true, technicalScore: true, contentScore: true, schemaScore: true, aiScore: true,
} as const

export function mapPageRows(rows: any[]): CrawlPageInput[] {
  return rows.map((pr) => ({
    url: pr.url, status: pr.status, title: pr.title, metaDescription: pr.metaDescription, h1Count: pr.h1Count,
    contentLength: pr.contentLength, canonical: pr.canonical, hasNoindex: pr.hasNoindex, hasMixedContent: pr.hasMixedContent,
    schemaTypes: pr.schemaTypes ? (() => { try { return JSON.parse(pr.schemaTypes) } catch { return [] } })() : [],
    internalLinks: pr.internalLinks, inboundCount: pr.inboundCount, technicalScore: pr.technicalScore,
    contentScore: pr.contentScore, schemaScore: pr.schemaScore, aiScore: pr.aiScore,
  }))
}

export const KEYWORD_SELECT = {
  keyword: true, normalizedKeyword: true, intent: true, type: true, status: true, targetPageUrl: true,
  currentPosition: true, previousPosition: true, bestPosition: true, dataSource: true, confidence: true, estimatedDemand: true,
} as const

export function mapKeywordRows(rows: any[]): KeywordInput[] {
  return rows.map((k) => ({
    keyword: k.keyword, normalizedKeyword: k.normalizedKeyword, intent: k.intent ?? 'informational', type: k.type ?? 'primary',
    status: k.status ?? 'tracking', targetPageUrl: k.targetPageUrl, currentPosition: k.currentPosition, previousPosition: k.previousPosition,
    bestPosition: k.bestPosition, dataSource: k.dataSource, confidence: k.confidence ?? 0.5, estimatedDemand: k.estimatedDemand,
  }))
}

/** Fetches GSC/GA4 rows for a project (only when a Google credential exists)
 * and maps them to fusion inputs. `gsc`/`ga4` are null when not connected —
 * fuse() treats null as "not connected" and never fabricates the gap. */
export async function gatherGoogleRows(prisma: any, projectId: string): Promise<{ gsc: GscRowInput[] | null; ga4: Ga4RowInput[] | null; connected: boolean }> {
  const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' } })
  const gscRows = cred ? await prisma.googleSearchConsoleMetric.findMany({ where: { projectId } }) : []
  const ga4Rows = cred ? await prisma.googleAnalytics4Metric.findMany({ where: { projectId } }) : []
  const gsc: GscRowInput[] | null = cred && gscRows.length
    ? gscRows.map((g: any) => ({ url: g.url, clicks: g.clicks, impressions: g.impressions, ctr: g.ctr, position: g.position, dataDate: g.dataDate?.toISOString() ?? null }))
    : null
  const ga4: Ga4RowInput[] | null = cred && ga4Rows.length
    ? ga4Rows.map((g: any) => ({ url: g.url, sessions: g.sessions, users: g.users, engagementRate: g.engagementRate, conversions: g.conversions, revenue: g.revenue, dataDate: g.dataDate?.toISOString() ?? null }))
    : null
  return { gsc, ga4, connected: !!cred }
}

/** Worst-of-the-three freshness (crawl/gsc/ga4) that feeds the fused
 * opportunity confidence penalty. */
export function projectWorstFreshness(opts: {
  crawlLastSuccessAt: Date | null
  gsc: unknown
  ga4: unknown
  projectUpdatedAt: Date
  now: Date
}): FreshnessStatus {
  return worstFreshness([
    classifyFreshness({ source: 'crawl', lastSuccessAt: opts.crawlLastSuccessAt, now: opts.now }),
    classifyFreshness({ source: 'gsc', configured: !!opts.gsc, lastSuccessAt: opts.gsc ? opts.projectUpdatedAt : null, now: opts.now }),
    classifyFreshness({ source: 'ga4', configured: !!opts.ga4, lastSuccessAt: opts.ga4 ? opts.projectUpdatedAt : null, now: opts.now }),
  ])
}

/** One-shot fusion assembly: given already-mapped pages/keywords, fetches
 * Google rows, fuses, and computes worst freshness. */
export async function gatherProjectFusion(opts: {
  prisma: any
  projectId: string
  domain: string
  pages: CrawlPageInput[]
  keywords: KeywordInput[]
  crawlLastSuccessAt: Date | null
  projectUpdatedAt: Date
  now: Date
}): Promise<{ fusion: ProjectFusion; worst: FreshnessStatus }> {
  const { prisma, projectId, domain, pages, keywords, crawlLastSuccessAt, projectUpdatedAt, now } = opts
  const { gsc, ga4 } = await gatherGoogleRows(prisma, projectId)
  const fusion = fuse({ projectId, domain, pages, keywords, gsc, ga4 })
  const worst = projectWorstFreshness({ crawlLastSuccessAt, gsc, ga4, projectUpdatedAt, now })
  return { fusion, worst }
}
