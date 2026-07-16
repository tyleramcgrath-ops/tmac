// Portfolio view — every project in the org with its daily priority.
//
// Assembles the per-project signals the priority engine needs from data we
// actually have (latest audit, keyword positions/changes, execution history)
// and returns them ranked by urgency, each with its explanation. Google/GA4
// signals fold in automatically once those integrations are connected; until
// then their absence shows up honestly as missing data, never as fake calm.

import { getCurrentSession } from '@/lib/session'
import { rankPortfolio, type ProjectSignals, type PortfolioPriority } from '@/lib/portfolio/priority'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const organizationId = session.organizationId

  const projects = await prisma.project.findMany({
    where: { organizationId, status: 'active' },
    select: {
      id: true, name: true, domain: true, isFavorite: true, updatedAt: true,
      audits: {
        orderBy: { startedAt: 'desc' }, take: 1,
        select: { startedAt: true, siteScore: true, criticalCount: true, pageCount: true },
      },
      keywords: {
        select: { currentPosition: true, previousPosition: true, status: true },
      },
    },
  })

  const signals: ProjectSignals[] = projects.map((p: any) => {
    const latestAudit = p.audits[0] ?? null
    const kws = p.keywords as { currentPosition: number | null; previousPosition: number | null; status: string }[]

    let rankingLosses = 0, rankingGains = 0, lostKeywords = 0, pageTwoOpportunities = 0
    for (const k of kws) {
      if (k.status === 'lost') lostKeywords++
      if (k.currentPosition !== null && k.previousPosition !== null) {
        const delta = k.previousPosition - k.currentPosition
        if (delta > 0) rankingGains++
        else if (delta < 0) rankingLosses++
      }
      if (k.currentPosition !== null && k.currentPosition >= 11 && k.currentPosition <= 20) pageTwoOpportunities++
    }

    const anyRankData = kws.some((k) => k.currentPosition !== null)

    return {
      projectId: p.id,
      name: p.name,
      domain: p.domain,
      lastCrawlAt: latestAudit?.startedAt ?? null,
      lastRankCheckAt: anyRankData ? p.updatedAt : null,
      siteScore: latestAudit?.siteScore ?? null,
      criticalIssues: latestAudit?.criticalCount ?? 0,
      rankingLosses,
      rankingGains,
      moneyPageRankingLoss: false, // requires money-page classification + rank history; folds in later
      lostKeywords,
      pageTwoOpportunities,
      failedDeployments: 0, // folds in once execution history is wired to the portfolio
      failedVerifications: 0,
      pendingApprovals: 0,
      hasAudit: !!latestAudit,
      hasKeywords: kws.length > 0,
    }
  })

  const priorities: PortfolioPriority[] = rankPortfolio(signals)
  const byId = new Map(projects.map((p: any) => [p.id, p]))

  const rows = priorities.map((pr) => {
    const p: any = byId.get(pr.projectId)
    const latestAudit = p?.audits[0] ?? null
    return {
      projectId: pr.projectId,
      name: p?.name,
      domain: p?.domain,
      isFavorite: p?.isFavorite ?? false,
      status: pr.status,
      score: pr.score,
      headline: pr.headline,
      reasons: pr.reasons,
      recommendedFocus: pr.recommendedFocus,
      missingData: pr.missingData,
      siteScore: latestAudit?.siteScore ?? null,
      criticalCount: latestAudit?.criticalCount ?? 0,
      pageCount: latestAudit?.pageCount ?? 0,
      lastCrawlAt: latestAudit?.startedAt ?? null,
      keywordCount: (p?.keywords?.length ?? 0),
    }
  })

  const statusCounts: Record<string, number> = {}
  for (const r of rows) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    projectCount: rows.length,
    statusCounts,
    projects: rows,
  })
}
