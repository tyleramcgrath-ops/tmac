// Assembles the AI search view: who gets cited for your topics, how you
// compare, which prompts to try next, and what the cited sources have in
// common.
//
// Joins four things the project already stores and had never read together:
// citation snapshots (now carrying every source, not just ours), tracked
// competitors, the Search Console keyword corpus, and the latest crawl.

import type { FoundationStore } from '../store'
import { assembleKeywordIntelligence } from '../external/service'
import { latestScanPages } from '../operator/context'
import {
  buildCitationLandscape,
  buildQueryGuidance,
  recommendPrompts,
  type CitationLandscape,
  type GuidancePage,
  type PromptSuggestion,
  type QueryGuidance,
} from './landscape'

export interface AiSearchPlan {
  landscape: CitationLandscape
  guidance: QueryGuidance[]
  prompts: PromptSuggestion[]
  competitorsTracked: number
  /** Why prompt suggestions are missing, when they are — they are drawn from
   *  Search Console demand, so no GSC means no suggestions worth making. */
  promptsUnavailable: string | null
  /** True when at least one stored snapshot carries a source list. Checks
   *  recorded before sources were captured have none, and the UI should say
   *  "re-run a check" rather than "nobody cites anyone". */
  hasSourceData: boolean
  hasCrawl: boolean
}

// Only queries we are LOSING get guidance. When we are already cited there is
// nothing to recommend, and burying the losses under the wins is how a report
// gets ignored.
const MAX_GUIDANCE = 10

export async function assembleAiSearchPlan(
  store: FoundationStore,
  projectId: string,
  project: { domain: string },
  nowMs: number
): Promise<AiSearchPlan> {
  const [snapshots, competitors, trackedQueries, intel, rawPages] = await Promise.all([
    store.listAiCitationSnapshots(projectId),
    store.listCompetitors(projectId),
    store.listTrackedAiQueries(projectId),
    assembleKeywordIntelligence(store, projectId, project, nowMs),
    latestScanPages(store, projectId),
  ])

  const competitorDomains = competitors.map((c) => c.domain).filter(Boolean)
  const landscape = buildCitationLandscape({ snapshots, ourDomain: project.domain, competitorDomains })

  const pages: GuidancePage[] = rawPages.map((p) => ({
    url: typeof p.url === 'string' ? p.url : '',
    title: typeof p.title === 'string' ? p.title : undefined,
    wordCount: typeof p.wordCount === 'number' ? p.wordCount : undefined,
    hasFaq: typeof p.hasFaq === 'boolean' ? p.hasFaq : undefined,
  }))

  const guidance = landscape.comparisons
    .filter((c) => !c.weAreCited)
    .slice(0, MAX_GUIDANCE)
    .map((comparison) => buildQueryGuidance({ comparison, ourDomain: project.domain, competitorDomains, pages }))

  const prompts = recommendPrompts({
    keywords: intel.keywords.map((k) => ({ query: k.query, impressions: k.impressions, position: k.position })),
    trackedQueries: trackedQueries.map((q) => q.query),
  })

  return {
    landscape,
    guidance,
    prompts,
    competitorsTracked: competitorDomains.length,
    promptsUnavailable: intel.unavailable,
    hasSourceData: snapshots.some((s) => (s.sources?.length ?? 0) > 0),
    hasCrawl: pages.length > 0,
  }
}
