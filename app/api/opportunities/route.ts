// SEO Opportunities Center data — now built from FUSED page + keyword
// intelligence (crawl + rankings + GSC + GA4) rather than isolated findings.
// Deduplicates multiple signals about the same problem, ranks by measured value
// with a stale-data penalty, and never fabricates metrics.

import { getCurrentSession } from '@/lib/session'
import { fuse, type CrawlPageInput, type KeywordInput, type GscRowInput, type Ga4RowInput } from '@/lib/fusion/engine'
import { buildFusedOpportunities, type FusedOpportunity } from '@/lib/opportunities/fused'
import { classifyFreshness, worstFreshness } from '@/lib/freshness/policy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const projectFilter = url.searchParams.get('projectId')
  const typeFilter = url.searchParams.get('type')

  const projects = await prisma.project.findMany({
    where: { organizationId: session.organizationId, status: 'active', ...(projectFilter ? { id: projectFilter } : {}) },
    select: {
      id: true, name: true, domain: true, wpSiteUrl: true, updatedAt: true,
      keywords: { select: { keyword: true, normalizedKeyword: true, intent: true, type: true, status: true, targetPageUrl: true, currentPosition: true, previousPosition: true, bestPosition: true, dataSource: true, confidence: true, estimatedDemand: true } },
      audits: { orderBy: { startedAt: 'desc' }, take: 1, select: { id: true, startedAt: true } },
    },
  })

  const now = new Date()
  const projectMeta = new Map<string, { name: string; domain: string }>()
  let all: (FusedOpportunity & { projectName?: string; domain?: string })[] = []

  for (const p of projects) {
    projectMeta.set(p.id, { name: p.name, domain: p.domain })

    // Latest audit pages.
    const pageRows = p.audits[0]
      ? await prisma.page.findMany({ where: { auditId: p.audits[0].id }, select: { url: true, status: true, title: true, metaDescription: true, h1Count: true, contentLength: true, canonical: true, hasNoindex: true, hasMixedContent: true, schemaTypes: true, internalLinks: true, inboundCount: true, technicalScore: true, contentScore: true, schemaScore: true, aiScore: true } })
      : []
    const pages: CrawlPageInput[] = pageRows.map((pr: any) => ({
      url: pr.url, status: pr.status, title: pr.title, metaDescription: pr.metaDescription, h1Count: pr.h1Count,
      contentLength: pr.contentLength, canonical: pr.canonical, hasNoindex: pr.hasNoindex, hasMixedContent: pr.hasMixedContent,
      schemaTypes: pr.schemaTypes ? (() => { try { return JSON.parse(pr.schemaTypes) } catch { return [] } })() : [],
      internalLinks: pr.internalLinks, inboundCount: pr.inboundCount, technicalScore: pr.technicalScore,
      contentScore: pr.contentScore, schemaScore: pr.schemaScore, aiScore: pr.aiScore,
    }))
    const keywords: KeywordInput[] = p.keywords.map((k: any) => ({
      keyword: k.keyword, normalizedKeyword: k.normalizedKeyword, intent: k.intent ?? 'informational', type: k.type ?? 'primary',
      status: k.status ?? 'tracking', targetPageUrl: k.targetPageUrl, currentPosition: k.currentPosition, previousPosition: k.previousPosition,
      bestPosition: k.bestPosition, dataSource: k.dataSource, confidence: k.confidence ?? 0.5, estimatedDemand: k.estimatedDemand,
    }))

    // GSC/GA4 (connected only when an OAuthCredential + rows exist).
    const cred = await prisma.oAuthCredential.findFirst({ where: { projectId: p.id, provider: 'google' } })
    const gscRows = cred ? await prisma.googleSearchConsoleMetric.findMany({ where: { projectId: p.id } }) : []
    const ga4Rows = cred ? await prisma.googleAnalytics4Metric.findMany({ where: { projectId: p.id } }) : []
    const gsc: GscRowInput[] | null = cred && gscRows.length ? gscRows.map((g: any) => ({ url: g.url, clicks: g.clicks, impressions: g.impressions, ctr: g.ctr, position: g.position, dataDate: g.dataDate?.toISOString() ?? null })) : null
    const ga4: Ga4RowInput[] | null = cred && ga4Rows.length ? ga4Rows.map((g: any) => ({ url: g.url, sessions: g.sessions, users: g.users, engagementRate: g.engagementRate, conversions: g.conversions, revenue: g.revenue, dataDate: g.dataDate?.toISOString() ?? null })) : null

    const fusion = fuse({ projectId: p.id, domain: p.domain, pages, keywords, gsc, ga4 })

    // Worst freshness across the project's sources feeds the confidence penalty.
    const freshnessResults = [
      classifyFreshness({ source: 'crawl', lastSuccessAt: p.audits[0]?.startedAt ?? null, now }),
      classifyFreshness({ source: 'gsc', configured: !!gsc, lastSuccessAt: gsc ? p.updatedAt : null, now }),
      classifyFreshness({ source: 'ga4', configured: !!ga4, lastSuccessAt: ga4 ? p.updatedAt : null, now }),
    ]
    const worst = worstFreshness(freshnessResults)

    const fused = buildFusedOpportunities({
      projectId: p.id, pages: fusion.pages, keywords: fusion.keywords,
      wordpressConnected: !!p.wpSiteUrl, worstFreshness: worst,
    })
    all = all.concat(fused.map((o) => ({ ...o, projectName: p.name, domain: p.domain })))
  }

  all.sort((a, b) => b.priorityScore - a.priorityScore)
  const filtered = typeFilter ? all.filter((o) => o.type === typeFilter) : all

  const byType: Record<string, number> = {}
  for (const o of all) byType[o.type] = (byType[o.type] ?? 0) + 1

  return Response.json({
    ok: true,
    generatedAt: now.toISOString(),
    summary: { total: all.length, byType, highValue: all.filter((o) => o.businessValue >= 70).length },
    opportunities: filtered,
  })
}
