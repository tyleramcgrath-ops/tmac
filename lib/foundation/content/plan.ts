// Assembles the content plan: what to write next, from what the project
// already knows. Joins three existing sources that had never been read
// together —
//
//   Search Console  → what people actually search for and where you rank
//   the latest crawl → how substantial the page that ranks actually is
//   tracked competitors → topics somebody else bet on
//
// The join is the point. "You rank #12" is a Rankings fact. "That page is 240
// words" is an audit fact. Neither is interesting alone; together they say
// "expand this page and you will probably move" — which is a content decision.

import type { FoundationStore } from '../store'
import { assembleKeywordIntelligence } from '../external/service'
import { latestScanPages } from '../operator/context'
import { findContentGaps } from './brief'
import {
  findContentOpportunities,
  summarizeOpportunities,
  type ContentOpportunity,
  type OpportunityPage,
  type OpportunitySummary,
} from './opportunities'

export interface ContentPlan {
  opportunities: ContentOpportunity[]
  summary: OpportunitySummary
  /** Why the demand-driven half of the plan is missing, when it is. Null when
   *  Search Console returned. Competitor gaps still work without it. */
  searchConsoleUnavailable: string | null
  /** True when a crawl has run. Without one there are no word counts, so the
   *  "expand this thin page" half cannot be computed and the UI should say so
   *  rather than quietly omitting the best opportunity type. */
  hasCrawl: boolean
  pagesCrawled: number
  competitorsTracked: number
  range: { from: string; to: string } | null
}

export async function assembleContentPlan(
  store: FoundationStore,
  projectId: string,
  project: { domain: string },
  nowMs: number
): Promise<ContentPlan> {
  const [intel, rawPages, competitors] = await Promise.all([
    assembleKeywordIntelligence(store, projectId, project, nowMs),
    latestScanPages(store, projectId),
    store.listCompetitors(projectId),
  ])

  const pages: OpportunityPage[] = rawPages.map((p) => ({
    url: typeof p.url === 'string' ? p.url : '',
    title: typeof p.title === 'string' ? p.title : undefined,
    wordCount: typeof p.wordCount === 'number' ? p.wordCount : undefined,
  }))

  const competitorGaps = findContentGaps(
    pages.map((p) => ({ title: p.title })),
    competitors,
    10
  )

  const opportunities = findContentOpportunities({
    keywords: intel.keywords,
    cannibalization: intel.cannibalization,
    pages,
    competitorGaps,
    limit: 25,
  })

  return {
    opportunities,
    summary: summarizeOpportunities(opportunities),
    searchConsoleUnavailable: intel.unavailable,
    hasCrawl: pages.length > 0,
    pagesCrawled: pages.length,
    competitorsTracked: competitors.length,
    range: intel.range,
  }
}
