// Project Detail Command Center data — one request that assembles everything
// needed to understand a project: priority + mission, ranking summary,
// integration status, top opportunities, top risks, and recent activity.

import { getCurrentSession } from '@/lib/session'
import { computePortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'
import { buildOpportunities, type KeywordInput, type CrawlIssueInput } from '@/lib/opportunities/build'
import { fuse, type CrawlPageInput, type KeywordInput as FusionKeywordInput, type GscRowInput, type Ga4RowInput } from '@/lib/fusion/engine'
import { buildFusedOpportunities } from '@/lib/opportunities/fused'
import { classifyFreshness, worstFreshness } from '@/lib/freshness/policy'
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
  const latestAuditRow = await prisma.audit.findFirst({ where: { projectId }, orderBy: { startedAt: 'desc' }, select: { id: true, startedAt: true } })
  const pageRows = latestAuditRow
    ? await prisma.page.findMany({ where: { auditId: latestAuditRow.id }, select: { url: true, status: true, title: true, metaDescription: true, h1Count: true, contentLength: true, canonical: true, hasNoindex: true, hasMixedContent: true, schemaTypes: true, internalLinks: true, inboundCount: true, technicalScore: true, contentScore: true, schemaScore: true, aiScore: true } })
    : []
  const fusionPages: CrawlPageInput[] = pageRows.map((pr: any) => ({
    url: pr.url, status: pr.status, title: pr.title, metaDescription: pr.metaDescription, h1Count: pr.h1Count,
    contentLength: pr.contentLength, canonical: pr.canonical, hasNoindex: pr.hasNoindex, hasMixedContent: pr.hasMixedContent,
    schemaTypes: pr.schemaTypes ? (() => { try { return JSON.parse(pr.schemaTypes) } catch { return [] } })() : [],
    internalLinks: pr.internalLinks, inboundCount: pr.inboundCount, technicalScore: pr.technicalScore,
    contentScore: pr.contentScore, schemaScore: pr.schemaScore, aiScore: pr.aiScore,
  }))
  const fusionKeywords: FusionKeywordInput[] = kwRows.map((k: any) => ({
    keyword: k.keyword, normalizedKeyword: k.keyword.toLowerCase(), intent: k.intent ?? 'informational', type: 'primary',
    status: k.status ?? 'tracking', targetPageUrl: k.targetPageUrl, currentPosition: k.currentPosition, previousPosition: k.previousPosition,
    bestPosition: null, dataSource: null, confidence: k.confidence ?? 0.5, estimatedDemand: null,
  }))
  const gscRows = cred ? await prisma.googleSearchConsoleMetric.findMany({ where: { projectId } }) : []
  const ga4Rows = cred ? await prisma.googleAnalytics4Metric.findMany({ where: { projectId } }) : []
  const gsc: GscRowInput[] | null = cred && gscRows.length ? gscRows.map((g: any) => ({ url: g.url, clicks: g.clicks, impressions: g.impressions, ctr: g.ctr, position: g.position, dataDate: g.dataDate?.toISOString() ?? null })) : null
  const ga4: Ga4RowInput[] | null = cred && ga4Rows.length ? ga4Rows.map((g: any) => ({ url: g.url, sessions: g.sessions, users: g.users, engagementRate: g.engagementRate, conversions: g.conversions, revenue: g.revenue, dataDate: g.dataDate?.toISOString() ?? null })) : null
  const fusion = fuse({ projectId, domain: project.domain, pages: fusionPages, keywords: fusionKeywords, gsc, ga4 })
  const worst = worstFreshness([
    classifyFreshness({ source: 'crawl', lastSuccessAt: latestAuditRow?.startedAt ?? null, now }),
    classifyFreshness({ source: 'gsc', configured: !!gsc, lastSuccessAt: gsc ? project.updatedAt : null, now }),
    classifyFreshness({ source: 'ga4', configured: !!ga4, lastSuccessAt: ga4 ? project.updatedAt : null, now }),
  ])
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
    lastCrawlAt: latestAudit?.startedAt ?? auditWithSummary?.startedAt ?? null,
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
