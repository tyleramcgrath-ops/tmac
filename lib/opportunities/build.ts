// SEO Opportunities normalizer.
//
// Every opportunity — whatever its source (rankings, keyword discovery, crawl
// issues, schema gaps, cannibalization) — becomes one normalized record with a
// consistent shape so the Opportunities Center can rank them by business impact
// and flow each through the same Preview -> Approve -> Deploy workflow.
//
// Consolidation: related evidence for the same page+type collapses into a
// single record rather than appearing as several near-duplicate rows.

export type OpportunityType =
  | 'ranking'
  | 'ctr'
  | 'traffic_recovery'
  | 'conversion'
  | 'technical'
  | 'content_gap'
  | 'content_decay'
  | 'internal_linking'
  | 'schema'
  | 'cannibalization'
  | 'local'
  | 'ai_search'
  | 'money_page'
  | 'new_keyword'
  | 'lost_keyword'

export type OpportunitySource = 'rankings' | 'keywords' | 'crawl' | 'gsc' | 'ga4' | 'competitor'
export type Effort = 'low' | 'medium' | 'high'
export type Risk = 'low' | 'medium' | 'high'

export interface Opportunity {
  id: string // stable, derived from project+type+page/keyword — dedupe key
  projectId: string
  page: string | null
  keyword: string | null
  type: OpportunityType
  title: string
  whyItMatters: string
  businessValue: number // 0..100
  expectedReturn: number // 0..100 (model estimate, labeled as such in UI)
  effort: Effort
  risk: Risk
  confidence: number // 0..1
  evidence: string[]
  dataSource: OpportunitySource
  recommendedFix: string
  status: 'open'
}

// ── Inputs (already fetched from the DB by the route) ──
export interface KeywordInput {
  keyword: string
  currentPosition: number | null
  previousPosition: number | null
  status: string // tracking / winning / declining / lost / cannibalized / ...
  targetPageUrl: string | null
  confidence: number
  intent: string
}
export interface CrawlIssueInput {
  pageUrl: string | null // null for site-level aggregated issues
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  affectedPages?: number
}

function effortForType(t: OpportunityType): Effort {
  switch (t) {
    case 'ctr': case 'schema': case 'technical': return 'low'
    case 'ranking': case 'content_decay': case 'internal_linking': case 'new_keyword': return 'medium'
    default: return 'high'
  }
}
function riskForSeverity(sev: 'critical' | 'warning' | 'info'): Risk {
  return sev === 'critical' ? 'high' : sev === 'warning' ? 'medium' : 'low'
}

function keywordOpportunity(projectId: string, k: KeywordInput): Opportunity | null {
  // A recent drop is more urgent than a static page-2 position, so check it
  // first: a keyword that fell from #8 to #15 is a traffic-recovery problem,
  // not merely a page-2 opportunity.
  if (k.currentPosition !== null && k.previousPosition !== null && k.previousPosition - k.currentPosition < 0) {
    const drop = k.currentPosition - k.previousPosition
    return {
      id: `${projectId}:traffic_recovery:${k.keyword.toLowerCase()}`,
      projectId, page: k.targetPageUrl, keyword: k.keyword, type: 'traffic_recovery',
      title: `Recover ranking for "${k.keyword}"`,
      whyItMatters: `Dropped ${drop} position${drop !== 1 ? 's' : ''} (from #${k.previousPosition} to #${k.currentPosition}) — losing visibility and clicks.`,
      businessValue: Math.round(55 + Math.min(30, drop * 3)),
      expectedReturn: Math.round(45 + Math.min(25, drop * 3)),
      effort: 'medium', risk: 'medium', confidence: Math.max(0.4, k.confidence),
      evidence: [`Previous position: #${k.previousPosition}`, `Current position: #${k.currentPosition}`],
      dataSource: 'keywords',
      recommendedFix: 'Review what changed on the page and among competitors since the drop; refresh the content and re-verify.',
      status: 'open',
    }
  }
  // Lost entirely.
  if (k.status === 'lost') {
    return {
      id: `${projectId}:lost_keyword:${k.keyword.toLowerCase()}`,
      projectId, page: k.targetPageUrl, keyword: k.keyword, type: 'lost_keyword',
      title: `Regain lost keyword "${k.keyword}"`,
      whyItMatters: 'This keyword fell out of the tracked results entirely — full visibility loss.',
      businessValue: 70, expectedReturn: 50, effort: 'high', risk: 'medium', confidence: Math.max(0.4, k.confidence),
      evidence: ['Keyword no longer appears in observed results'],
      dataSource: 'keywords',
      recommendedFix: 'Re-establish topical coverage and internal links for this term; confirm the target page is indexable.',
      status: 'open',
    }
  }
  // Cannibalized.
  if (k.status === 'cannibalized') {
    return {
      id: `${projectId}:cannibalization:${k.keyword.toLowerCase()}`,
      projectId, page: k.targetPageUrl, keyword: k.keyword, type: 'cannibalization',
      title: `Resolve cannibalization for "${k.keyword}"`,
      whyItMatters: 'More than one page targets this term as primary, splitting ranking signals between them.',
      businessValue: 60, expectedReturn: 45, effort: 'high', risk: 'medium', confidence: Math.max(0.4, k.confidence),
      evidence: ['Multiple pages claim this keyword as primary'],
      dataSource: 'keywords',
      recommendedFix: 'Consolidate the competing pages, or clearly differentiate their intent and re-point internal links.',
      status: 'open',
    }
  }
  // Page-2 keyword (not dropping) → ranking opportunity within reach of page 1.
  if (k.currentPosition !== null && k.currentPosition >= 11 && k.currentPosition <= 20) {
    const closeness = 21 - k.currentPosition // 1..10, higher = closer to page 1
    return {
      id: `${projectId}:ranking:${k.keyword.toLowerCase()}`,
      projectId, page: k.targetPageUrl, keyword: k.keyword, type: 'ranking',
      title: `Push "${k.keyword}" from page 2 to page 1`,
      whyItMatters: `Ranks #${k.currentPosition} — page-1 placement captures the vast majority of clicks for this term.`,
      businessValue: Math.round(50 + closeness * 3),
      expectedReturn: Math.round(40 + closeness * 4),
      effort: 'medium', risk: 'low', confidence: Math.max(0.4, k.confidence),
      evidence: [`Current observed position: #${k.currentPosition}`, `Search intent: ${k.intent}`],
      dataSource: 'keywords',
      recommendedFix: 'Strengthen the target page for this term: sharpen the title, expand thin sections, and add supporting internal links.',
      status: 'open',
    }
  }
  return null
}

const CATEGORY_TO_TYPE: Record<string, OpportunityType> = {
  schema: 'schema', 'structured data': 'schema',
  content: 'content_gap', 'thin content': 'content_gap',
  links: 'internal_linking', 'internal links': 'internal_linking',
  title: 'ctr', meta: 'ctr', 'meta description': 'ctr',
}
function crawlOpportunity(projectId: string, issue: CrawlIssueInput): Opportunity {
  const type = CATEGORY_TO_TYPE[issue.category.toLowerCase()] ?? 'technical'
  // Dedup key: the specific page when we have one, else the issue title
  // (site-level aggregated issues collapse by title).
  const scopeKey = issue.pageUrl ?? issue.title
  const affected = issue.affectedPages && issue.affectedPages > 1 ? ` (${issue.affectedPages} pages)` : ''
  return {
    id: `${projectId}:${type}:${scopeKey}`,
    projectId, page: issue.pageUrl, keyword: null, type,
    title: issue.title + affected,
    whyItMatters: issue.severity === 'critical'
      ? 'A critical issue that can block ranking or indexing on this page.'
      : issue.severity === 'warning'
        ? 'A warning that likely holds this page back from its ranking potential.'
        : 'A minor improvement that incrementally strengthens this page.',
    businessValue: issue.severity === 'critical' ? 75 : issue.severity === 'warning' ? 50 : 30,
    expectedReturn: issue.severity === 'critical' ? 60 : issue.severity === 'warning' ? 40 : 20,
    effort: effortForType(type), risk: riskForSeverity(issue.severity), confidence: 0.7,
    evidence: [`${issue.category} · ${issue.severity}`],
    dataSource: 'crawl',
    recommendedFix: `Fix the ${issue.category.toLowerCase()} issue on this page, then re-verify.`,
    status: 'open',
  }
}

export interface BuildOpportunitiesInput {
  projectId: string
  keywords: KeywordInput[]
  crawlIssues: CrawlIssueInput[]
}

/** Builds and consolidates the normalized opportunity list for one project. */
export function buildOpportunities(input: BuildOpportunitiesInput): Opportunity[] {
  const byId = new Map<string, Opportunity>()
  const add = (o: Opportunity | null) => {
    if (!o) return
    const existing = byId.get(o.id)
    if (existing) {
      // Consolidate: merge evidence, keep the higher business value.
      existing.evidence = Array.from(new Set([...existing.evidence, ...o.evidence]))
      existing.businessValue = Math.max(existing.businessValue, o.businessValue)
      existing.expectedReturn = Math.max(existing.expectedReturn, o.expectedReturn)
      return
    }
    byId.set(o.id, o)
  }

  for (const k of input.keywords) add(keywordOpportunity(input.projectId, k))
  for (const issue of input.crawlIssues) add(crawlOpportunity(input.projectId, issue))

  // Rank by business value, then expected return, then confidence.
  return [...byId.values()].sort(
    (a, b) => b.businessValue - a.businessValue || b.expectedReturn - a.expectedReturn || b.confidence - a.confidence
  )
}

export function summarizeOpportunities(list: Opportunity[]): { total: number; byType: Record<string, number>; highValue: number } {
  const byType: Record<string, number> = {}
  for (const o of list) byType[o.type] = (byType[o.type] ?? 0) + 1
  return { total: list.length, byType, highValue: list.filter((o) => o.businessValue >= 70).length }
}
