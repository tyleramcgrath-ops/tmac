// Project Detail Command Center data — one request that assembles everything
// needed to understand a project: priority + mission, ranking summary,
// integration status, top opportunities, top risks, and recent activity.

import { getCurrentSession } from '@/lib/session'
import { computePortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'
import { buildOpportunities, type KeywordInput, type CrawlIssueInput } from '@/lib/opportunities/build'
import { buildFusedOpportunities } from '@/lib/opportunities/fused'
import { gatherProjectFusion, mapPageRows, mapKeywordRows, PAGE_SELECT, KEYWORD_SELECT } from '@/lib/fusion/gather'
import { scheduleHealth, dataFreshness, jobsRequiringAttention, decisionBlockers, measuringOutcomes, recentWins, readyToDeploy, type JobLite, type MeasurementLite } from '@/lib/dashboard/sections'

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

  // Ranking summary from the Keyword Universe. Selects the full keyword shape
  // (KEYWORD_SELECT) so the same rows can feed fusion below without discarding
  // normalizedKeyword/bestPosition/dataSource/estimatedDemand.
  const kwRows = await prisma.keyword.findMany({ where: { projectId }, select: KEYWORD_SELECT })
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

  // Top opportunities (reuse the normalizer). One query for "the latest audit"
  // covers the priority headline, crawl issues, and the page fetch below — the
  // route previously issued three separate queries for overlapping audit data.
  const latestAudit = await prisma.audit.findFirst({
    where: { projectId }, orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true, siteScore: true, criticalCount: true, warningCount: true, pageCount: true, summary: true },
  })
  let crawlIssues: CrawlIssueInput[] = []
  if (latestAudit?.summary) {
    try {
      const parsed = JSON.parse(latestAudit.summary)
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

  // ── Dashboard sections: schedule health, freshness, blockers, fused
  // opportunities, ready-to-deploy, measuring outcomes, recent wins ──
  const now = new Date()
  const jobRows: JobLite[] = await prisma.scheduledJob.findMany({
    where: { projectId },
    select: { id: true, projectId: true, jobType: true, status: true, enabled: true, lastSuccessAt: true, lastFailureAt: true, nextRunAt: true, failureReason: true, failureClass: true, retryCount: true, maxRetries: true },
  })
  const health = scheduleHealth(jobRows)
  const freshness = dataFreshness(jobRows, now)
  const attention = jobsRequiringAttention(jobRows)
  const blockers = decisionBlockers(projectId, jobRows, freshness)

  // Fused opportunities (crawl + rankings + GSC + GA4) for capability states.
  // Reuses `latestAudit` (already fetched above) instead of a fourth audit query.
  const pageRows = latestAudit
    ? await prisma.page.findMany({ where: { auditId: latestAudit.id }, select: PAGE_SELECT })
    : []
  const fusionPages = mapPageRows(pageRows)
  const fusionKeywords = mapKeywordRows(kwRows)
  const { fusion, worst } = await gatherProjectFusion({
    prisma, projectId, domain: project.domain, pages: fusionPages, keywords: fusionKeywords,
    crawlLastSuccessAt: latestAudit?.startedAt ?? null, projectUpdatedAt: project.updatedAt, now,
  })
  const fused = buildFusedOpportunities({ projectId, pages: fusion.pages, keywords: fusion.keywords, wordpressConnected: !!project.wpSiteUrl, worstFreshness: worst })
  const deployReady = readyToDeploy(fused as any)

  // Measurement windows for this project.
  const mwRows: MeasurementLite[] = await prisma.measurementWindow.findMany({
    where: { projectId },
    select: { id: true, projectId: true, page: true, keyword: true, changeType: true, status: true, confidence: true, reviewAt: true, updatedAt: true, notes: true },
    orderBy: { updatedAt: 'desc' }, take: 100,
  })
  const measuring = measuringOutcomes(mwRows)
  const wins = recentWins(mwRows, 7, now)

  return Response.json({
    ok: true,
    project: {
      id: project.id, name: project.name, domain: project.domain, description: project.description,
      isFavorite: project.isFavorite, createdAt: project.createdAt,
    },
    priority,
    lastCrawlAt: latestAudit?.startedAt ?? null,
    latestAudit: latestAudit ? { siteScore: latestAudit.siteScore, criticalCount: latestAudit.criticalCount, pageCount: latestAudit.pageCount } : null,
    rankingSummary,
    opportunities,
    integrations,
    recentActivity: events.map((e: any) => ({ type: e.type, action: e.action, at: e.createdAt })),
    // New dashboard sections
    scheduleHealth: health,
    dataFreshness: freshness,
    jobsRequiringAttention: attention,
    decisionBlockers: blockers,
    fusedOpportunities: fused.slice(0, 10),
    readyToDeploy: deployReady,
    measuringOutcomes: measuring,
    recentWins: wins,
  })
}
