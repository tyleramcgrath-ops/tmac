import { randomUUID } from 'crypto'
import { getApiKey } from './config'
import { getStore } from './db'
import { crawlAll } from './crawler'
import { extractPage } from './extract'
import { analyzeKeywords } from './keywords'
import { fetchSerp, SerpError } from './serp'
import { fetchPageSpeed } from './pagespeed'
import { fetchBacklinks } from './backlinks'
import { buildContentGap, buildSchemaGap, buildTechnicalIssues } from './compare'
import { buildScores } from './scoring'
import { buildRecommendations } from './recommendations'
import { generateAiInsights } from './ai'
import {
  PIPELINE_STEPS,
  type PageAnalysis,
  type PipelineStepId,
  type Report,
  type ReportInput,
  type ReportResults,
  type StepState,
} from './types'

// Orchestrates a full analysis run. The core `runAnalysis` calls an `emit`
// callback after every step; the database-backed mode persists each update so
// the UI can poll, while the no-database (streaming) mode pushes each update
// straight to the browser. Same analysis, two delivery channels.

export function newReport(input: ReportInput): Report {
  return {
    id: randomUUID(),
    input,
    status: 'queued',
    steps: PIPELINE_STEPS.map((s) => ({ id: s.id, state: 'pending' as StepState })),
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    overallScore: null,
    results: null,
  }
}

/** Called after every progress change with the current report state. */
export type Emit = (report: Report) => void | Promise<void>

/**
 * Database-backed background run. The API route returns immediately and the
 * client polls; the returned promise must be handed to `scheduleBackground()`
 * so it survives on serverless runtimes (see lib/background.ts).
 */
export function startPipeline(report: Report): Promise<void> {
  const persist: Emit = async (r) => {
    const store = await getStore()
    await store.saveReport(r)
  }
  return runAnalysis(report, persist)
    .then(() => {})
    .catch(async (err) => {
      console.error(`[pipeline] report ${report.id} crashed:`, err)
      try {
        const store = await getStore()
        const latest = (await store.getReport(report.id)) ?? report
        latest.status = 'failed'
        latest.error = err instanceof Error ? err.message : 'Unexpected error while building the report.'
        latest.completedAt = new Date().toISOString()
        await store.saveReport(latest)
      } catch (saveErr) {
        console.error('[pipeline] failed to persist failure state:', saveErr)
      }
    })
}

export async function runAnalysis(report: Report, emit: Emit): Promise<Report> {
  const warnings: string[] = []

  const setStep = async (id: PipelineStepId, state: StepState, detail?: string) => {
    const step = report.steps.find((s) => s.id === id)
    if (step) {
      step.state = state
      if (detail) step.detail = detail
    }
    await emit(report)
  }

  report.status = 'running'
  await emit(report)

  const { keyword, url, country, device, language } = report.input

  // ── Step 1: SERP ──
  await setStep('serp', 'running')
  const serpKey = await getApiKey('SERP_API_KEY')
  if (!serpKey) {
    report.status = 'failed'
    report.error = 'No SERP API key configured. Add a SerpAPI key (SERP_API_KEY) on the Settings page to fetch Google results.'
    report.completedAt = new Date().toISOString()
    await setStep('serp', 'error', 'Missing SERP_API_KEY')
    return report
  }
  let serp
  try {
    serp = await fetchSerp({ keyword, country, device, language }, serpKey)
  } catch (err) {
    report.status = 'failed'
    report.error = err instanceof SerpError ? err.userMessage : 'Failed to fetch search results.'
    report.completedAt = new Date().toISOString()
    await setStep('serp', 'error', report.error)
    return report
  }
  await setStep('serp', 'done', `${serp.results.length} organic results`)

  // ── Step 2: Crawl ──
  await setStep('crawl', 'running')
  const userDomain = hostOf(url)
  const competitorResults = serp.results.filter((r) => normalizeUrl(r.url) !== normalizeUrl(url))
  const userRanking = serp.results.find((r) => normalizeUrl(r.url) === normalizeUrl(url)) ?? null

  const urlsToCrawl = [url, ...competitorResults.map((r) => r.url)]
  const crawls = await crawlAll(urlsToCrawl, device, 4, (done, total) => {
    void setStep('crawl', 'running', `${done}/${total} pages crawled`)
  })
  const failedCrawls = crawls.filter((c) => c.error !== null).length
  await setStep('crawl', 'done', failedCrawls > 0 ? `${crawls.length - failedCrawls}/${crawls.length} pages crawled (${failedCrawls} blocked/failed)` : `${crawls.length} pages crawled`)

  // ── Step 3: Extract ──
  await setStep('extract', 'running')
  const userExtraction = extractPage(crawls[0])
  const userAnalysis: PageAnalysis = {
    isUser: true,
    position: userRanking?.position ?? null,
    serp: userRanking,
    page: userExtraction,
    keywords: userExtraction.crawlError ? null : analyzeKeywords(userExtraction, keyword),
    pageSpeed: null,
  }
  const competitors: PageAnalysis[] = competitorResults.map((serpResult, i) => {
    const extraction = extractPage(crawls[i + 1])
    return {
      isUser: false,
      position: serpResult.position,
      serp: serpResult,
      page: extraction,
      keywords: extraction.crawlError ? null : analyzeKeywords(extraction, keyword),
      pageSpeed: null,
    }
  })
  if (userExtraction.crawlError) {
    warnings.push(`Your page could not be fully crawled: ${userExtraction.crawlError}`)
  }
  const blockedCompetitors = competitors.filter((c) => c.page?.crawlError)
  if (blockedCompetitors.length > 0) {
    warnings.push(
      `${blockedCompetitors.length} competitor page(s) blocked crawling or failed to load — their on-page data is partial: ${blockedCompetitors.map((c) => c.serp?.domain).join(', ')}`
    )
  }
  await setStep('extract', 'done')

  // ── Step 4: PageSpeed ──
  await setStep('pagespeed', 'running')
  const psiKey = await getApiKey('PAGESPEED_API_KEY')
  const psiCompetitorLimit = Number(process.env.PSI_COMPETITOR_LIMIT ?? 3)
  const psiTargets = [
    { analysis: userAnalysis, url: userExtraction.finalUrl || url },
    ...competitors.slice(0, psiCompetitorLimit).map((c) => ({ analysis: c, url: c.serp!.url })),
  ]
  await Promise.all(
    psiTargets.map(async (t) => {
      t.analysis.pageSpeed = await fetchPageSpeed(t.url, device, psiKey)
    })
  )
  const psiFailures = psiTargets.filter((t) => t.analysis.pageSpeed?.error).length
  if (competitors.length > psiCompetitorLimit) {
    warnings.push(`Page speed was measured for your page and the top ${psiCompetitorLimit} competitors (limit configurable via PSI_COMPETITOR_LIMIT).`)
  }
  await setStep('pagespeed', psiFailures === psiTargets.length ? 'error' : 'done', psiFailures > 0 ? `${psiTargets.length - psiFailures}/${psiTargets.length} pages measured` : undefined)

  // ── Step 5: Schema comparison ──
  await setStep('schema', 'running')
  const contentGap = buildContentGap(userAnalysis, competitors, serp, keyword)
  const schemaGap = buildSchemaGap(userAnalysis, competitors, keyword)
  const technicalIssues = buildTechnicalIssues(userAnalysis, keyword)
  await setStep('schema', 'done')

  // ── Step 6: Backlinks ──
  await setStep('backlinks', 'running')
  const backlinkKey = await getApiKey('DATAFORSEO_API_KEY')
  const backlinks = await fetchBacklinks(
    [userDomain, ...competitorResults.slice(0, 10).map((r) => r.domain)],
    backlinkKey
  )
  if (!backlinks.available) {
    warnings.push(backlinks.message ?? 'Backlink data unavailable.')
    await setStep('backlinks', 'skipped', 'No backlink API key configured')
  } else {
    await setStep('backlinks', 'done')
  }

  // ── Step 7: Scores + recommendations + AI ──
  await setStep('ai', 'running')
  const scores = buildScores({ user: userAnalysis, competitors, contentGap, schemaGap, technicalIssues, backlinks, serp, keyword })
  const recommendations = buildRecommendations({ user: userAnalysis, competitors, contentGap, schemaGap, technicalIssues, backlinks, keyword })

  const anthropicKey = await getApiKey('ANTHROPIC_API_KEY')
  const openaiKey = await getApiKey('OPENAI_API_KEY')
  const ai = await generateAiInsights(
    { keyword, serp, user: userAnalysis, competitors, contentGap, schemaGap, technicalIssues, scores },
    { anthropic: anthropicKey, openai: openaiKey }
  )
  if (!ai.generatedBy) {
    if (anthropicKey || openaiKey) {
      warnings.push('The AI provider call failed — suggestions shown are rule-generated from the extracted data.')
    } else {
      warnings.push('No AI API key configured — suggestions are rule-generated. Add an Anthropic or OpenAI key for tailored copy suggestions.')
    }
    await setStep('ai', 'done', 'Rule-based suggestions (no AI key)')
  } else {
    await setStep('ai', 'done', `Generated by ${ai.generatedBy}`)
  }

  // ── Step 8: Finalize ──
  await setStep('report', 'running')
  const results: ReportResults = {
    serp,
    userAnalysis,
    competitors,
    contentGap,
    schemaGap,
    technicalIssues,
    backlinks,
    scores,
    recommendations,
    ai,
    warnings,
  }
  report.results = results
  report.overallScore = scores.overall.score
  report.status = 'complete'
  report.completedAt = new Date().toISOString()
  const reportStep = report.steps.find((s) => s.id === 'report')
  if (reportStep) reportStep.state = 'done'
  await emit(report)
  return report
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}
