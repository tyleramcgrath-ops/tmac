// SEO Opportunities Center data — now built from FUSED page + keyword
// intelligence (crawl + rankings + GSC + GA4) rather than isolated findings.
// Deduplicates multiple signals about the same problem, ranks by measured value
// with a stale-data penalty, and never fabricates metrics.

import { getCurrentSession } from '@/lib/session'
import { buildFusedOpportunities, type FusedOpportunity } from '@/lib/opportunities/fused'
import { gatherProjectFusion, mapPageRows, mapKeywordRows, PAGE_SELECT, KEYWORD_SELECT } from '@/lib/fusion/gather'

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
      keywords: { select: KEYWORD_SELECT },
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
      ? await prisma.page.findMany({ where: { auditId: p.audits[0].id }, select: PAGE_SELECT })
      : []
    const pages = mapPageRows(pageRows)
    const keywords = mapKeywordRows(p.keywords)

    // GSC/GA4 (connected only when an OAuthCredential + rows exist), fused,
    // and the worst-source freshness that feeds the confidence penalty.
    const { fusion, worst } = await gatherProjectFusion({
      prisma, projectId: p.id, domain: p.domain, pages, keywords,
      crawlLastSuccessAt: p.audits[0]?.startedAt ?? null, projectUpdatedAt: p.updatedAt, now,
    })

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
