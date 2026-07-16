// Project Detail Command Center data — one request that assembles everything
// needed to understand a project: priority + mission, ranking summary,
// integration status, top opportunities, top risks, and recent activity.

import { getCurrentSession } from '@/lib/session'
import { computePortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'
import { buildOpportunities, type KeywordInput, type CrawlIssueInput } from '@/lib/opportunities/build'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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

  const { id: projectId } = await context.params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ...PORTFOLIO_PROJECT_SELECT,
      organizationId: true,
      description: true, wpSiteUrl: true, monthlyVisits: true, valuePerVisit: true, createdAt: true,
    },
  })
  if (!project || project.organizationId !== session.organizationId) {
    return Response.json({ error: 'Project not found.' }, { status: 404 })
  }

  // Priority + recommended focus (the mission for this project).
  const priority = computePortfolioPriority(signalsFromProject(project as ProjectWithData))

  // Ranking summary from the Keyword Universe.
  const kwRows = await prisma.keyword.findMany({
    where: { projectId },
    select: { keyword: true, currentPosition: true, previousPosition: true, status: true, targetPageUrl: true, confidence: true, intent: true },
  })
  const ranked = kwRows.filter((k: any) => k.currentPosition !== null)
  const rankingSummary = {
    tracked: ranked.length,
    total: kwRows.length,
    top3: ranked.filter((k: any) => k.currentPosition <= 3).length,
    top10: ranked.filter((k: any) => k.currentPosition <= 10).length,
    top20: ranked.filter((k: any) => k.currentPosition <= 20).length,
    page2: ranked.filter((k: any) => k.currentPosition >= 11 && k.currentPosition <= 20).length,
    gainers: kwRows.filter((k: any) => k.currentPosition !== null && k.previousPosition !== null && k.previousPosition - k.currentPosition > 0).length,
    losers: kwRows.filter((k: any) => k.currentPosition !== null && k.previousPosition !== null && k.previousPosition - k.currentPosition < 0).length,
  }

  // Top opportunities (reuse the normalizer).
  const latestAudit = project.audits[0] ?? null
  let crawlIssues: CrawlIssueInput[] = []
  const auditWithSummary = await prisma.audit.findFirst({
    where: { projectId }, orderBy: { startedAt: 'desc' }, select: { summary: true, criticalCount: true, warningCount: true, startedAt: true },
  })
  if (auditWithSummary?.summary) {
    try {
      const parsed = JSON.parse(auditWithSummary.summary)
      const topIssues = Array.isArray(parsed?.topIssues) ? parsed.topIssues : []
      crawlIssues = topIssues.filter((i: any) => i.title && i.severity).map((i: any) => ({
        pageUrl: null,
        severity: (i.severity === 'critical' || i.severity === 'warning' ? i.severity : 'info') as CrawlIssueInput['severity'],
        category: i.category ?? 'Technical', title: i.title, affectedPages: i.affectedPages,
      }))
    } catch { /* skip */ }
  }
  const keywords: KeywordInput[] = kwRows.map((k: any) => ({
    keyword: k.keyword, currentPosition: k.currentPosition, previousPosition: k.previousPosition,
    status: k.status, targetPageUrl: k.targetPageUrl, confidence: k.confidence ?? 0.5, intent: k.intent ?? 'informational',
  }))
  const opportunities = buildOpportunities({ projectId, keywords, crawlIssues }).slice(0, 5)

  // Integration status.
  const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' }, select: { gscPropertyUrl: true, ga4PropertyId: true, lastUsedAt: true } })
  const gscRowCount = cred ? await prisma.googleSearchConsoleMetric.count({ where: { projectId } }) : 0
  const ga4RowCount = cred ? await prisma.googleAnalytics4Metric.count({ where: { projectId } }) : 0
  const integrations = {
    wordpress: { connected: !!project.wpSiteUrl, detail: project.wpSiteUrl ?? null },
    gsc: { connected: !!cred?.gscPropertyUrl, hasData: gscRowCount > 0 },
    ga4: { connected: !!cred?.ga4PropertyId, hasData: ga4RowCount > 0 },
  }

  // Recent activity.
  const events = await prisma.event.findMany({
    where: { projectId }, orderBy: { createdAt: 'desc' }, take: 10,
    select: { type: true, action: true, createdAt: true },
  })

  return Response.json({
    ok: true,
    project: {
      id: project.id, name: project.name, domain: project.domain, description: project.description,
      isFavorite: project.isFavorite, createdAt: project.createdAt,
    },
    priority,
    lastCrawlAt: latestAudit?.startedAt ?? auditWithSummary?.startedAt ?? null,
    latestAudit: latestAudit ? { siteScore: latestAudit.siteScore, criticalCount: latestAudit.criticalCount, pageCount: latestAudit.pageCount } : null,
    rankingSummary,
    opportunities,
    integrations,
    recentActivity: events.map((e: any) => ({ type: e.type, action: e.action, at: e.createdAt })),
  })
}
