// Portfolio view — every project in the org with its daily priority.
//
// Assembles the per-project signals the priority engine needs from data we
// actually have (latest audit, keyword positions/changes, execution history)
// and returns them ranked by urgency, each with its explanation. Google/GA4
// signals fold in automatically once those integrations are connected; until
// then their absence shows up honestly as missing data, never as fake calm.

import { getCurrentSession } from '@/lib/session'
import { rankPortfolio, type PortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'

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

  const projects: ProjectWithData[] = await prisma.project.findMany({
    where: { organizationId, status: 'active' },
    select: PORTFOLIO_PROJECT_SELECT,
  })

  const priorities: PortfolioPriority[] = rankPortfolio(projects.map(signalsFromProject))
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
