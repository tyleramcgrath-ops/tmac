// Data Fusion Engine.
//
// Merges every available RankForge signal into one unified intelligence record
// per page and per keyword. Works with ANY combination of available data:
// missing integrations lower confidence and surface as explicit missing-data
// signals — they never break the engine or get filled with invented values.
//
// Three ranking concepts are kept strictly separate throughout — observed live
// ranking, GSC average position, and estimated ranking potential are never
// merged into a single "rank" number.

// ── Inputs (plain shapes; the route fetches these from the DB) ──
export interface CrawlPageInput {
  url: string
  status: number
  title: string | null
  metaDescription: string | null
  h1Count: number
  contentLength: number
  canonical: string | null
  hasNoindex: boolean
  hasMixedContent: boolean
  schemaTypes: string[]
  internalLinks: number
  inboundCount: number
  technicalScore: number
  contentScore: number
  schemaScore: number
  aiScore: number
}
export interface KeywordInput {
  keyword: string
  normalizedKeyword: string
  intent: string
  type: string
  status: string
  targetPageUrl: string | null
  currentPosition: number | null
  previousPosition: number | null
  bestPosition: number | null
  dataSource: string | null // observed-rank source label
  confidence: number
  estimatedDemand: number | null
}
export interface GscRowInput {
  url: string
  clicks: number
  impressions: number
  ctr: number
  position: number // GSC AVERAGE position — never an observed live rank
  dataDate: string | null
}
export interface Ga4RowInput {
  url: string
  sessions: number
  users: number
  engagementRate: number
  conversions: number
  revenue: number
  dataDate: string | null
}
export interface DeploymentInput { pageUrl: string; at: string; status: string }
export interface VerificationInput { pageUrl: string; at: string; passed: boolean }

export interface FusionInputs {
  projectId: string
  domain: string
  pages: CrawlPageInput[]
  keywords: KeywordInput[]
  gsc: GscRowInput[] | null // null = not connected
  ga4: Ga4RowInput[] | null // null = not connected
  deployments?: DeploymentInput[]
  verifications?: VerificationInput[]
  now?: Date
}

// ── Outputs ──
export type IntegrationState = 'connected' | 'not_connected'
export interface DataSourceStatus {
  crawl: boolean
  keywords: boolean
  observedRankings: boolean
  gsc: IntegrationState
  ga4: IntegrationState
}

export interface PageIntelligence {
  url: string
  pageType: string
  moneyPage: boolean
  businessValue: number
  crawlHealth: number // 0..100
  httpStatus: number
  indexable: boolean
  canonicalStatus: 'self' | 'other' | 'none'
  schemaCoverage: number // count of schema types
  contentQuality: number
  internalLinkStrength: number
  // The three separate ranking concepts:
  observedRankings: { keyword: string; position: number; source: string }[]
  gscAveragePosition: number | null
  gscClicks: number | null
  gscImpressions: number | null
  gscCtr: number | null
  ga4OrganicSessions: number | null
  ga4Engagement: number | null
  ga4Conversions: number | null
  ga4Revenue: number | null
  recentDeployments: number
  verificationsPassed: number | null
  confidence: number // 0..1 — reduced by missing signals
  dataSources: string[]
  missingSignals: string[]
  recommendedNextAction: string
}

export interface KeywordIntelligence {
  keyword: string
  intent: string
  targetPage: string | null
  // Separate ranking concepts:
  observedRanking: number | null
  observedRankingSource: string | null
  previousObservedRanking: number | null
  bestObservedRanking: number | null
  gscAveragePosition: number | null
  gscClicks: number | null
  gscImpressions: number | null
  gscCtr: number | null
  estimatedRankingPotential: number | null // model estimate, never an observed rank
  businessValue: number
  moneyPageRelationship: boolean
  currentOpportunity: string | null
  confidence: number
  dataSource: string | null
  missingSignals: string[]
  recommendedNextAction: string
}

export interface ProjectFusion {
  projectId: string
  generatedAt: string
  dataSources: DataSourceStatus
  pages: PageIntelligence[]
  keywords: KeywordIntelligence[]
  missingIntegrations: string[]
}

function pathType(url: string): string {
  let path = url
  try { path = new URL(url).pathname } catch { /* keep raw */ }
  if (path === '/' || path === '') return 'homepage'
  if (/\/(contact|get-in-touch)/i.test(path)) return 'contact'
  if (/\/(about|team|our-story)/i.test(path)) return 'about'
  if (/\/(blog|article|news|post)/i.test(path)) return 'blog_post'
  if (/\/(service|solutions)/i.test(path)) return 'service_page'
  if (/\/(product|shop|store|pricing)/i.test(path)) return 'product_page'
  if (/\/(faq|help|support)/i.test(path)) return 'faq'
  return 'content_page'
}

function canonicalStatusOf(p: CrawlPageInput): 'self' | 'other' | 'none' {
  if (!p.canonical) return 'none'
  const norm = (u: string) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') } catch { return u } }
  return norm(p.canonical) === norm(p.url) ? 'self' : 'other'
}

/** Business value 0..100 from page type, inbound links, and content quality. */
function pageBusinessValue(p: CrawlPageInput, type: string): number {
  let v = 40
  if (type === 'service_page' || type === 'product_page') v += 25
  else if (type === 'homepage' || type === 'contact') v += 15
  v += Math.min(20, p.inboundCount) // authority signal
  v += Math.round((p.contentScore / 100) * 15)
  return Math.max(0, Math.min(100, v))
}

export function fuse(inputs: FusionInputs): ProjectFusion {
  const now = inputs.now ?? new Date()
  const gscConnected = inputs.gsc !== null
  const ga4Connected = inputs.ga4 !== null

  const norm = (u: string) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || '/') } catch { return u.replace(/\/+$/, '') } }

  const gscByUrl = new Map<string, GscRowInput>()
  for (const r of inputs.gsc ?? []) gscByUrl.set(norm(r.url), r)
  const ga4ByUrl = new Map<string, Ga4RowInput>()
  for (const r of inputs.ga4 ?? []) ga4ByUrl.set(norm(r.url), r)

  const deploymentsByUrl = new Map<string, number>()
  for (const d of inputs.deployments ?? []) deploymentsByUrl.set(norm(d.pageUrl), (deploymentsByUrl.get(norm(d.pageUrl)) ?? 0) + 1)
  const verifByUrl = new Map<string, { passed: number; total: number }>()
  for (const v of inputs.verifications ?? []) {
    const cur = verifByUrl.get(norm(v.pageUrl)) ?? { passed: 0, total: 0 }
    cur.total++; if (v.passed) cur.passed++
    verifByUrl.set(norm(v.pageUrl), cur)
  }

  // Observed rankings grouped by target page.
  const observedByPage = new Map<string, { keyword: string; position: number; source: string }[]>()
  for (const k of inputs.keywords) {
    if (k.currentPosition !== null && k.targetPageUrl) {
      const key = norm(k.targetPageUrl)
      const arr = observedByPage.get(key) ?? []
      arr.push({ keyword: k.keyword, position: k.currentPosition, source: k.dataSource ?? 'rankforge_live_check' })
      observedByPage.set(key, arr)
    }
  }

  const pages: PageIntelligence[] = inputs.pages.map((p) => {
    const key = norm(p.url)
    const type = pathType(p.url)
    const gsc = gscByUrl.get(key) ?? null
    const ga4 = ga4ByUrl.get(key) ?? null
    const businessValue = pageBusinessValue(p, type)
    const moneyPage = (type === 'service_page' || type === 'product_page') && businessValue >= 65
    const crawlHealth = Math.round((p.technicalScore + p.contentScore + p.schemaScore) / 3)

    const missingSignals: string[] = []
    if (!gscConnected) missingSignals.push('gsc')
    else if (!gsc) missingSignals.push('gsc_page_data')
    if (!ga4Connected) missingSignals.push('ga4')
    else if (!ga4) missingSignals.push('ga4_page_data')
    if (!observedByPage.has(key)) missingSignals.push('observed_rankings')

    const dataSources: string[] = ['crawl']
    if (observedByPage.has(key)) dataSources.push('observed_rankings')
    if (gsc) dataSources.push('gsc')
    if (ga4) dataSources.push('ga4')
    if (deploymentsByUrl.has(key)) dataSources.push('wordpress')

    // Confidence: starts high for crawl, grows with each corroborating source.
    let confidence = 0.4
    if (observedByPage.has(key)) confidence += 0.2
    if (gsc) confidence += 0.2
    if (ga4) confidence += 0.2
    confidence = Math.min(1, confidence)

    // Recommended next action from the fused picture.
    let action = 'Keep monitoring.'
    if (p.status !== 200) action = `Fix the ${p.status} response — this page can't rank while it errors.`
    else if (p.hasNoindex) action = 'Remove noindex if this page should rank.'
    else if (gsc && gsc.impressions > 100 && gsc.ctr < 0.02) action = 'High impressions but low CTR — rewrite the title and meta description.'
    else if (ga4 && ga4.sessions > 50 && ga4.conversions === 0 && moneyPage) action = 'Traffic but no conversions on a money page — review the conversion path and CTAs.'
    else if (p.schemaTypes.length === 0) action = 'Add structured data to unlock rich results.'
    else if (observedByPage.get(key)?.some((o) => o.position >= 11 && o.position <= 20)) action = 'A tracked keyword sits on page 2 — strengthen this page to push it onto page 1.'

    return {
      url: p.url,
      pageType: type,
      moneyPage,
      businessValue,
      crawlHealth,
      httpStatus: p.status,
      indexable: p.status === 200 && !p.hasNoindex,
      canonicalStatus: canonicalStatusOf(p),
      schemaCoverage: p.schemaTypes.length,
      contentQuality: p.contentScore,
      internalLinkStrength: p.inboundCount,
      observedRankings: observedByPage.get(key) ?? [],
      gscAveragePosition: gsc ? gsc.position : null,
      gscClicks: gsc ? gsc.clicks : null,
      gscImpressions: gsc ? gsc.impressions : null,
      gscCtr: gsc ? gsc.ctr : null,
      ga4OrganicSessions: ga4 ? ga4.sessions : null,
      ga4Engagement: ga4 ? ga4.engagementRate : null,
      ga4Conversions: ga4 ? ga4.conversions : null,
      ga4Revenue: ga4 ? ga4.revenue : null,
      recentDeployments: deploymentsByUrl.get(key) ?? 0,
      verificationsPassed: verifByUrl.has(key) ? verifByUrl.get(key)!.passed : null,
      confidence,
      dataSources,
      missingSignals,
      recommendedNextAction: action,
    }
  })

  // Keyword intelligence. GSC rows are keyed by URL, so a keyword picks up GSC
  // metrics from its target page — but GSC *average position* stays labeled as
  // such and never becomes the observed ranking.
  const pageByKey = new Map(pages.map((p) => [norm(p.url), p]))
  const keywords: KeywordIntelligence[] = inputs.keywords.map((k) => {
    const targetKey = k.targetPageUrl ? norm(k.targetPageUrl) : null
    const gsc = targetKey ? gscByUrl.get(targetKey) ?? null : null
    const page = targetKey ? pageByKey.get(targetKey) ?? null : null
    const moneyPageRel = page?.moneyPage ?? false

    const missingSignals: string[] = []
    if (k.currentPosition === null) missingSignals.push('observed_ranking')
    if (!gscConnected) missingSignals.push('gsc')
    else if (!gsc) missingSignals.push('gsc_query_data')

    // Estimated ranking potential — a MODEL estimate, only when we lack an
    // observed rank, clearly separate from any real position.
    const estimatedRankingPotential = k.currentPosition === null && k.estimatedDemand !== null
      ? Math.min(100, Math.round((k.confidence * 60) + Math.min(40, (k.estimatedDemand / 10))))
      : null

    const businessValue = Math.round(
      (moneyPageRel ? 60 : 40) +
      (k.intent === 'transactional' || k.intent === 'commercial' ? 20 : 0) +
      Math.min(20, (k.estimatedDemand ?? 0) / 50)
    )

    let opportunity: string | null = null
    if (k.currentPosition !== null && k.currentPosition >= 11 && k.currentPosition <= 20) opportunity = 'page_2_to_page_1'
    else if (k.currentPosition !== null && k.previousPosition !== null && k.currentPosition > k.previousPosition) opportunity = 'traffic_recovery'
    else if (k.status === 'lost') opportunity = 'regain_lost'
    else if (k.status === 'cannibalized') opportunity = 'resolve_cannibalization'
    else if (gsc && gsc.impressions > 100 && gsc.ctr < 0.02) opportunity = 'ctr_improvement'

    let action = 'Track and re-check.'
    if (opportunity === 'page_2_to_page_1') action = 'Strengthen the target page to move this from page 2 to page 1.'
    else if (opportunity === 'traffic_recovery') action = 'Investigate the drop and refresh the target page.'
    else if (opportunity === 'ctr_improvement') action = 'Rewrite the title/meta — impressions are high but CTR is low.'
    else if (opportunity === 'regain_lost') action = 'Rebuild topical coverage; confirm the page is indexable.'
    else if (k.currentPosition === null) action = 'Run a rank check to establish a baseline position.'

    let confidence = 0.3
    if (k.currentPosition !== null) confidence += 0.3
    if (gsc) confidence += 0.2
    confidence = Math.min(1, confidence + k.confidence * 0.2)

    return {
      keyword: k.keyword,
      intent: k.intent,
      targetPage: k.targetPageUrl,
      observedRanking: k.currentPosition,
      observedRankingSource: k.currentPosition !== null ? (k.dataSource ?? 'rankforge_live_check') : null,
      previousObservedRanking: k.previousPosition,
      bestObservedRanking: k.bestPosition,
      gscAveragePosition: gsc ? gsc.position : null,
      gscClicks: gsc ? gsc.clicks : null,
      gscImpressions: gsc ? gsc.impressions : null,
      gscCtr: gsc ? gsc.ctr : null,
      estimatedRankingPotential,
      businessValue: Math.max(0, Math.min(100, businessValue)),
      moneyPageRelationship: moneyPageRel,
      currentOpportunity: opportunity,
      confidence,
      dataSource: k.dataSource,
      missingSignals,
      recommendedNextAction: action,
    }
  })

  const missingIntegrations: string[] = []
  if (!gscConnected) missingIntegrations.push('Google Search Console')
  if (!ga4Connected) missingIntegrations.push('Google Analytics 4')

  return {
    projectId: inputs.projectId,
    generatedAt: now.toISOString(),
    dataSources: {
      crawl: inputs.pages.length > 0,
      keywords: inputs.keywords.length > 0,
      observedRankings: inputs.keywords.some((k) => k.currentPosition !== null),
      gsc: gscConnected ? 'connected' : 'not_connected',
      ga4: ga4Connected ? 'connected' : 'not_connected',
    },
    pages: pages.sort((a, b) => b.businessValue - a.businessValue),
    keywords: keywords.sort((a, b) => b.businessValue - a.businessValue),
    missingIntegrations,
  }
}
