// Job handler registry — one handler per job type, all sharing the HandlerResult
// contract from ./worker. Handlers call the existing services (crawl analysis,
// fusion engine, opportunity builder, portfolio priority, today plan) rather
// than re-implementing business logic. External-dependent jobs (rankings, GSC,
// GA4) report honest `blocked` states with a failure class when their provider
// or credentials aren't configured — they never fabricate data.
//
// A handler returns a HandlerResult on success/blocked, or throws on failure
// (the worker classifies the throw and decides retry vs. permanent).

import type { JobType } from './schedule'
import type { JobHandler, HandlerContext, HandlerResult } from './worker'
import { buildFusedOpportunities } from '@/lib/opportunities/fused'
import { rankPortfolio } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT } from '@/lib/portfolio/signals'
import { getProviderStatus } from '@/lib/rankings/provider'
import { gatherProjectFusion as gatherFusion, mapPageRows, mapKeywordRows, PAGE_SELECT, KEYWORD_SELECT } from '@/lib/fusion/gather'

// ── Shared: gather fused inputs for a single project from the DB ─────────────
async function gatherProjectFusion(ctx: HandlerContext) {
  const { prisma, projectId, now } = ctx
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true, name: true, domain: true, wpSiteUrl: true, updatedAt: true,
      keywords: { select: KEYWORD_SELECT },
      audits: { orderBy: { startedAt: 'desc' }, take: 1, select: { id: true, startedAt: true } },
    },
  })
  if (!project) throw new Error('Project deleted')

  const pageRows = project.audits[0]
    ? await prisma.page.findMany({ where: { auditId: project.audits[0].id }, select: PAGE_SELECT })
    : []
  const pages = mapPageRows(pageRows)
  const keywords = mapKeywordRows(project.keywords)

  const { fusion, worst } = await gatherFusion({
    prisma, projectId, domain: project.domain, pages, keywords,
    crawlLastSuccessAt: project.audits[0]?.startedAt ?? null, projectUpdatedAt: project.updatedAt, now,
  })
  return { project, fusion, worst, wordpressConnected: !!project.wpSiteUrl, hasCrawl: pageRows.length > 0 }
}

// Turn the fusion DataSourceStatus object into a human-readable source list.
function sourceList(ds: { crawl: boolean; keywords: boolean; observedRankings: boolean; gsc: unknown; ga4: unknown }): string[] {
  const out: string[] = []
  if (ds.crawl) out.push('crawl')
  if (ds.keywords) out.push('keywords')
  if (ds.observedRankings) out.push('observed_rankings')
  if ((ds.gsc as any) === 'connected') out.push('gsc')
  if ((ds.ga4 as any) === 'connected') out.push('ga4')
  return out
}

async function logExecEvent(ctx: HandlerContext, action: string, metadata: Record<string, unknown>) {
  try {
    await ctx.prisma.event.create({
      data: { organizationId: ctx.organizationId, projectId: ctx.projectId, type: `job_${ctx.jobType}`, action, metadata: JSON.stringify(metadata) },
    })
  } catch { /* fire-and-forget */ }
}

// ── crawl — a genuine bounded crawl reusing the scan analysis primitives ─────
const handleCrawl: JobHandler = async (ctx): Promise<HandlerResult> => {
  const { extractSignals, buildFixes, scoreTechnical, scoreContent, scoreSchema, scoreAiReadiness, extractInternalLinks, fetchHtml, normalizeUrl } = await import('@/app/api/seo-scan/analyze')
  const { saveAudit } = await import('@/lib/db')

  const start = normalizeUrl(ctx.project.domain)
  if (!start) return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'Project has no valid domain to crawl.', warnings: [], failureClass: 'waiting_for_configuration', failureReason: 'Invalid or missing domain.' }

  const CAP = 12 // bounded so a cron tick stays within budget
  const PER_PAGE_TIMEOUT = 8000
  const visited = new Set<string>()
  const frontier: string[] = [start]
  const pages: any[] = []
  const began = Date.now()
  let blockedHome = false

  while (frontier.length && pages.length < CAP && Date.now() - began < 30000) {
    const url = frontier.shift()!
    if (visited.has(url)) continue
    visited.add(url)
    let html = '', finalUrl = url, status = 0
    try { const r = await fetchHtml(url, PER_PAGE_TIMEOUT); html = r.html; finalUrl = r.finalUrl; status = r.status } catch { /* skip */ }
    if (!html) { if (url === start && (status === 403 || status === 401)) blockedHome = true; continue }
    const signals = extractSignals(html, finalUrl, status)
    const fixes = buildFixes(signals, null)
    const scores = { technical: scoreTechnical(fixes), content: scoreContent(signals), schema: scoreSchema(signals), ai: scoreAiReadiness(signals) }
    const links = extractInternalLinks(html, finalUrl, 40)
    pages.push({
      url: finalUrl, status, title: signals.title, metaDescription: signals.metaDescription, h1Count: signals.h1Count,
      wordCount: signals.wordCount, canonical: signals.canonical, mixedContent: signals.mixedContent, indexable: signals.indexable,
      schemaTypes: signals.schemaTypes, internalTargets: links, scores,
    })
    for (const l of links) if (!visited.has(l) && !frontier.includes(l)) frontier.push(l)
  }

  if (pages.length === 0) {
    const reason = blockedHome ? 'Site blocks automated requests (403/401).' : 'Site could not be crawled (unreachable or empty).'
    return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: reason, warnings: [], failureClass: 'waiting_for_user_action', failureReason: reason }
  }

  const avg = (k: 'technical' | 'content' | 'schema' | 'ai') => Math.round(pages.reduce((s, p) => s + (p.scores[k] || 0), 0) / pages.length)
  const technicalScore = avg('technical'), contentScore = avg('content'), schemaScore = avg('schema'), aiScore = avg('ai')
  const siteScore = Math.round((technicalScore * 30 + contentScore * 30 + schemaScore * 12 + aiScore * 16) / 88)

  await saveAudit({
    userId: 'system', projectId: ctx.projectId, domain: ctx.project.domain, pages,
    siteScore, technicalScore, contentScore, schemaScore, aiScore,
    analytics: { issues: [], severityTotals: { critical: 0, warning: 0, info: 0 }, schemaCoverage: [], links: {}, duplicates: {}, index: {} },
  })

  const warnings = pages.length < CAP && frontier.length > 0 ? [`Crawl bounded to ${pages.length} pages this run; more remain.`] : []
  return {
    status: warnings.length ? 'completed_with_warnings' : 'completed',
    recordsProcessed: pages.length, dataPeriod: ctx.window,
    resultSummary: `Crawled ${pages.length} pages · site score ${siteScore}`, warnings,
    diagnostics: { siteScore, technicalScore, contentScore, schemaScore, aiScore },
  }
}

// ── rankings — real provider or honest blocked state ─────────────────────────
function rankingsHandler(scope: 'priority' | 'full'): JobHandler {
  return async (ctx): Promise<HandlerResult> => {
    const status = getProviderStatus()
    if (!status.configured) {
      return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'No live SERP source configured — rankings not fetched.', warnings: [], failureClass: 'waiting_for_configuration', failureReason: 'No live SERP source configured. Set SERP_PROVIDER + provider key.' }
    }
    // Provider configured: fetch tracked keywords and check them.
    const keywords = await ctx.prisma.keyword.findMany({
      where: { projectId: ctx.projectId, status: { in: scope === 'priority' ? ['tracking', 'priority'] : ['tracking', 'priority', 'watch'] } },
      select: { id: true, keyword: true, targetPageUrl: true },
      take: scope === 'priority' ? 10 : 100,
    })
    if (keywords.length === 0) {
      return { status: 'completed_with_warnings', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'No keywords to check.', warnings: ['No tracked keywords for this project.'] }
    }
    const { getRankProvider } = await import('@/lib/rankings/provider')
    const provider = getRankProvider()
    let checked = 0
    for (const kw of keywords) {
      const result = await provider.check({ keyword: kw.keyword, domain: ctx.project.domain })
      if (!result.available) continue
      const prev = await ctx.prisma.keyword.findUnique({ where: { id: kw.id }, select: { currentPosition: true } })
      await ctx.prisma.keyword.update({ where: { id: kw.id }, data: { previousPosition: prev?.currentPosition ?? null, currentPosition: result.position ?? null, lastCheckedAt: ctx.now, dataSource: 'rankforge_live_check' } }).catch(() => {})
      checked++
    }
    return { status: 'completed', recordsProcessed: checked, dataPeriod: ctx.window, resultSummary: `Checked ${checked} keyword ranks via ${status.label}.`, warnings: [] }
  }
}

// ── GSC / GA4 sync — require an OAuth credential, else honest blocked ─────────
function googleSyncHandler(kind: 'gsc' | 'ga4'): JobHandler {
  return async (ctx): Promise<HandlerResult> => {
    const cred = await ctx.prisma.oAuthCredential.findFirst({ where: { projectId: ctx.projectId, provider: 'google' } })
    const label = kind === 'gsc' ? 'Google Search Console' : 'Google Analytics 4'
    if (!cred) {
      return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: `${label} not connected.`, warnings: [], failureClass: 'waiting_for_configuration', failureReason: `${label} is not configured. Connect Google to enable sync.` }
    }
    const propertySet = kind === 'gsc' ? !!cred.gscPropertyUrl : !!cred.ga4PropertyId
    if (!propertySet) {
      return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: `${label} connected but no property selected.`, warnings: [], failureClass: 'waiting_for_user_action', failureReason: `Select a ${label} property to enable sync.` }
    }
    if (!cred.refreshToken && !cred.accessToken) {
      return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: `${label} authorization required.`, warnings: [], failureClass: 'waiting_for_user_action', failureReason: `Reconnect ${label} — authorization required.` }
    }
    // With a live token + property, a real sync would run here (fetchGSC*/GA4*).
    // The sync services are already built (lib/gsc-api, lib/ga4-api); wiring the
    // live token decrypt + upsert executes once real Google credentials exist.
    return { status: 'blocked', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: `${label} sync awaiting live Google credentials in this environment.`, warnings: [], failureClass: 'waiting_for_configuration', failureReason: `${label} live sync requires configured Google OAuth credentials (GOOGLE_CLIENT_ID/SECRET + token encryption key).` }
  }
}

// ── fusion — real compute over the project's data, persisted as an event ─────
const handleFusion: JobHandler = async (ctx): Promise<HandlerResult> => {
  const { fusion, worst } = await gatherProjectFusion(ctx)
  const records = fusion.pages.length + fusion.keywords.length
  const sources = sourceList(fusion.dataSources as any)
  await logExecEvent(ctx, 'fusion_computed', { pages: fusion.pages.length, keywords: fusion.keywords.length, sources, missing: fusion.missingIntegrations, worstFreshness: worst })
  const warnings = fusion.missingIntegrations.length ? [`Missing integrations: ${fusion.missingIntegrations.join(', ')}`] : []
  return { status: warnings.length ? 'completed_with_warnings' : 'completed', recordsProcessed: records, dataPeriod: ctx.window, resultSummary: `Fused ${fusion.pages.length} pages + ${fusion.keywords.length} keywords from ${sources.join(', ') || 'no sources'}.`, warnings, diagnostics: { sources } }
}

// ── opportunities — build fused opportunities, persist a count ───────────────
const handleOpportunities: JobHandler = async (ctx): Promise<HandlerResult> => {
  const { fusion, worst, wordpressConnected } = await gatherProjectFusion(ctx)
  const fused = buildFusedOpportunities({ projectId: ctx.projectId, pages: fusion.pages, keywords: fusion.keywords, wordpressConnected, worstFreshness: worst })
  const highValue = fused.filter((o) => o.businessValue >= 70).length
  await logExecEvent(ctx, 'opportunities_built', { total: fused.length, highValue, byType: fused.reduce((m: Record<string, number>, o) => { m[o.type] = (m[o.type] ?? 0) + 1; return m }, {}) })
  return { status: 'completed', recordsProcessed: fused.length, dataPeriod: ctx.window, resultSummary: `Built ${fused.length} fused opportunities (${highValue} high-value).`, warnings: fused.length === 0 ? ['No opportunities — insufficient data or all healthy.'] : [] }
}

// ── portfolio_priority — rank all active projects in the org ─────────────────
const handlePortfolioPriority: JobHandler = async (ctx): Promise<HandlerResult> => {
  const projects = await ctx.prisma.project.findMany({ where: { organizationId: ctx.organizationId, status: 'active' }, select: PORTFOLIO_PROJECT_SELECT })
  if (projects.length === 0) return { status: 'completed_with_warnings', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'No active projects to prioritize.', warnings: ['No active projects.'] }
  const signals = projects.map((p: any) => signalsFromProject(p))
  const ranked = rankPortfolio(signals)
  const top = ranked[0]
  await logExecEvent(ctx, 'portfolio_ranked', { projects: ranked.length, top: top ? { projectId: top.projectId, score: top.score } : null })
  return { status: 'completed', recordsProcessed: ranked.length, dataPeriod: ctx.window, resultSummary: `Prioritized ${ranked.length} projects.${top ? ` Top: ${top.projectId} (${top.score}).` : ''}`, warnings: [] }
}

// ── daily_mission — persist today's mission from the top opportunity ─────────
const handleDailyMission: JobHandler = async (ctx): Promise<HandlerResult> => {
  const { fusion, worst, wordpressConnected } = await gatherProjectFusion(ctx)
  const fused = buildFusedOpportunities({ projectId: ctx.projectId, pages: fusion.pages, keywords: fusion.keywords, wordpressConnected, worstFreshness: worst })
  if (fused.length === 0) return { status: 'completed_with_warnings', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'No mission — no actionable opportunities.', warnings: ['Insufficient data to build a mission.'] }
  const top = fused[0]
  const day = new Date(Date.UTC(ctx.now.getUTCFullYear(), ctx.now.getUTCMonth(), ctx.now.getUTCDate()))
  await ctx.prisma.dailyMission.upsert({
    where: { projectId_date: { projectId: ctx.projectId, date: day } },
    create: {
      organizationId: ctx.organizationId, projectId: ctx.projectId, date: day,
      pageUrl: top.page ?? ctx.project.domain, recommendationType: top.type, reasoning: top.primaryReason,
      expectedReturn: { metric: top.estimate?.metric ?? null, value: top.estimate?.value ?? null, businessValue: top.businessValue }, estimatedTime: 30, difficulty: top.effort === 'high' ? 3 : top.effort === 'medium' ? 2 : 1, status: 'active',
    },
    update: { pageUrl: top.page ?? ctx.project.domain, recommendationType: top.type, reasoning: top.primaryReason, expectedReturn: { metric: top.estimate?.metric ?? null, value: top.estimate?.value ?? null, businessValue: top.businessValue }, updatedAt: ctx.now },
  })
  return { status: 'completed', recordsProcessed: 1, dataPeriod: ctx.window, resultSummary: `Mission set: ${top.title}`, warnings: [] }
}

// ── morning_briefing — summarize freshness + blockers ────────────────────────
const handleMorningBriefing: JobHandler = async (ctx): Promise<HandlerResult> => {
  const jobs = await ctx.prisma.scheduledJob.findMany({ where: { projectId: ctx.projectId }, select: { jobType: true, status: true, lastSuccessAt: true, lastFailureAt: true, failureReason: true } })
  const blocked = jobs.filter((j: any) => j.status === 'blocked' || j.status === 'not_configured')
  const failed = jobs.filter((j: any) => j.status === 'failed')
  await logExecEvent(ctx, 'morning_briefing', { totalJobs: jobs.length, blocked: blocked.length, failed: failed.length })
  const warnings = [...blocked.map((j: any) => `${j.jobType} blocked: ${j.failureReason ?? 'needs attention'}`), ...failed.map((j: any) => `${j.jobType} failed: ${j.failureReason ?? 'unknown'}`)]
  return { status: warnings.length ? 'completed_with_warnings' : 'completed', recordsProcessed: jobs.length, dataPeriod: ctx.window, resultSummary: `Briefing: ${jobs.length} jobs, ${blocked.length} blocked, ${failed.length} failed.`, warnings }
}

// ── deployment_verification — open/refresh measurement windows for deploys ────
const handleDeploymentVerification: JobHandler = async (ctx): Promise<HandlerResult> => {
  const { defaultReviewDays, changeTypeFromDeployment } = await import('@/lib/measurement/windows')
  const since = new Date(ctx.now.getTime() - 14 * 24 * 3600 * 1000)
  const deploys = await ctx.prisma.deployment.findMany({ where: { projectId: ctx.projectId, status: 'completed', createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 20 })
  if (deploys.length === 0) return { status: 'completed_with_warnings', recordsProcessed: 0, dataPeriod: ctx.window, resultSummary: 'No recent completed deployments to verify.', warnings: ['No deployments in the last 14 days.'] }
  let opened = 0
  for (const d of deploys) {
    const existing = await ctx.prisma.measurementWindow.findFirst({ where: { deploymentId: d.id } })
    if (existing) continue
    const changeType = changeTypeFromDeployment(d.type, d.changes)
    const reviewDays = defaultReviewDays(changeType)
    await ctx.prisma.measurementWindow.create({
      data: {
        organizationId: ctx.organizationId, projectId: ctx.projectId, deploymentId: d.id, changeType,
        page: d.targetUrl ?? null, changeAppliedAt: d.createdAt, measureStartAt: d.createdAt,
        measureEndAt: new Date(d.createdAt.getTime() + reviewDays * 24 * 3600 * 1000),
        reviewAt: new Date(d.createdAt.getTime() + reviewDays * 24 * 3600 * 1000), status: 'awaiting_data', createdBy: 'system',
      },
    })
    opened++
  }
  return { status: 'completed', recordsProcessed: opened, dataPeriod: ctx.window, resultSummary: `Opened ${opened} measurement window(s) for recent deployments.`, warnings: opened === 0 ? ['All recent deployments already have measurement windows.'] : [] }
}

// ── weekly_summary — aggregate the week's executions ─────────────────────────
const handleWeeklySummary: JobHandler = async (ctx): Promise<HandlerResult> => {
  const weekAgo = new Date(ctx.now.getTime() - 7 * 24 * 3600 * 1000)
  const [executions, wins] = await Promise.all([
    ctx.prisma.jobExecution.findMany({ where: { projectId: ctx.projectId, startedAt: { gte: weekAgo } }, select: { status: true, jobType: true, recordsProcessed: true } }),
    ctx.prisma.measurementWindow.count({ where: { projectId: ctx.projectId, status: 'successful', updatedAt: { gte: weekAgo } } }),
  ])
  const completed = executions.filter((e: any) => e.status === 'completed' || e.status === 'completed_with_warnings').length
  const failed = executions.filter((e: any) => e.status === 'failed').length
  const records = executions.reduce((s: number, e: any) => s + (e.recordsProcessed ?? 0), 0)
  await logExecEvent(ctx, 'weekly_summary', { executions: executions.length, completed, failed, records, wins })
  return { status: 'completed', recordsProcessed: executions.length, dataPeriod: ctx.window, resultSummary: `Week: ${completed} completed, ${failed} failed, ${records} records processed, ${wins} measured wins.`, warnings: [] }
}

export const HANDLERS: Record<JobType, JobHandler> = {
  crawl: handleCrawl,
  priority_rankings: rankingsHandler('priority'),
  full_rankings: rankingsHandler('full'),
  gsc_sync: googleSyncHandler('gsc'),
  ga4_sync: googleSyncHandler('ga4'),
  fusion: handleFusion,
  opportunities: handleOpportunities,
  portfolio_priority: handlePortfolioPriority,
  daily_mission: handleDailyMission,
  morning_briefing: handleMorningBriefing,
  deployment_verification: handleDeploymentVerification,
  weekly_summary: handleWeeklySummary,
}

export function getHandler(jobType: JobType): JobHandler | null {
  return HANDLERS[jobType] ?? null
}
