// Mission Atlas assembly (Phase G). Given a project's providers (default: none
// connected → everything Unavailable), gather external intelligence into ONE
// snapshot with a morning briefing. The recommendation/strategy engines never
// see a provider — they see graded Observations. This is the seam that keeps
// provider-specific logic out of the core (§10).

import type { Competitor, Project } from '../types'
import type { PageSignals } from '../reco/signals'
import { computeOverlap, type CompetitorOverlap } from './competitors'
import { buildExternalGraph, type ExternalGraph } from './knowledge-graph'
import { generateBriefing, type MorningBriefing } from './briefing'
import { detectAiCitationChanges, detectBacklinkChanges, detectRankingChanges, significantChanges, type Change } from './change-detection'
import { unavailable, type EvidenceGrade, type Observation, type ProviderOutcome, type ProviderStatus } from './types'
import type { AiSearchProvider, AiVisibility } from './providers/ai-search'
import type { BacklinkProfile, BacklinkProvider } from './providers/backlinks'
import type { GscReport, SearchConsoleProvider } from './providers/search-console'
import type { Ga4Report, AnalyticsProvider } from './providers/analytics'
import type { TrendReport, TrendProvider } from './providers/trends'
import { NullSearchConsoleProvider } from './providers/search-console'
import { NullAnalyticsProvider } from './providers/analytics'
import { NullTrendProvider } from './providers/trends'
import { NullBacklinkProvider } from './providers/backlinks'

export interface ProviderSet {
  aiSearch: AiSearchProvider[]
  backlinks: BacklinkProvider
  searchConsole: SearchConsoleProvider
  analytics: AnalyticsProvider
  trends: TrendProvider
}

// The default in THIS environment: nothing connected. Everything degrades to a
// clear "unavailable" rather than a fabricated number.
export function disconnectedProviderSet(): ProviderSet {
  return {
    aiSearch: [],
    backlinks: new NullBacklinkProvider('backlinks'),
    searchConsole: new NullSearchConsoleProvider(),
    analytics: new NullAnalyticsProvider(),
    trends: new NullTrendProvider(),
  }
}

export interface AtlasSnapshot {
  generatedAt: string
  providers: ProviderStatus[]
  competitors: { competitor: Competitor; overlap: CompetitorOverlap }[]
  aiVisibility: Observation<AiVisibility[]>
  backlinks: Observation<BacklinkProfile>
  gsc: Observation<GscReport>
  analytics: Observation<Ga4Report>
  trends: Observation<TrendReport>
  graph: ExternalGraph
  changes: Change[]
  briefing: MorningBriefing
  grades: Record<EvidenceGrade, number>
}

export interface PriorSnapshotData {
  gsc?: GscReport | null
  backlinks?: BacklinkProfile | null
  aiVisibility?: AiVisibility[]
}

function toObservation<T>(o: ProviderOutcome<T>, unavailableWhat: string): Observation<T> {
  if (o.ok) {
    return {
      value: o.data,
      evidence: { grade: o.grade, source: o.source, fetchedAt: o.fetchedAt, note: o.partial ? 'partial response' : undefined },
      confidence: 'unknown',
    }
  }
  return unavailable<T>('none', `${unavailableWhat} unavailable (${o.reason}: ${o.detail}).`)
}

export async function assembleAtlas(input: {
  now: string
  project: Pick<Project, 'domain' | 'name'>
  ourPages: PageSignals[]
  competitors: Competitor[]
  providers: ProviderSet
  aiQueries?: string[]
  prev?: PriorSnapshotData
}): Promise<AtlasSnapshot> {
  const { now, project, competitors, providers } = input

  // Provider statuses (every provider reports, including the disconnected ones).
  const providerStatuses: ProviderStatus[] = [
    ...providers.aiSearch.map((p) => p.status()),
    providers.backlinks.status(),
    providers.searchConsole.status(),
    providers.analytics.status(),
    providers.trends.status(),
  ]

  // AI search: probe each connected engine for each query; collect observations.
  const queries = input.aiQueries ?? [`best ${project.name || project.domain}`]
  const aiObservations: AiVisibility[] = []
  let anyAiObserved = false
  for (const engine of providers.aiSearch) {
    for (const q of queries) {
      const o = await engine.probe(q)
      if (o.ok) { aiObservations.push(o.data); anyAiObserved = true }
    }
  }
  const aiVisibility: Observation<AiVisibility[]> = anyAiObserved
    ? { value: aiObservations, evidence: { grade: 'observed', source: 'ai-search', fetchedAt: now }, confidence: 'unknown' }
    : unavailable<AiVisibility[]>('none', 'No AI-search engine connected — AI-visibility is unavailable.')

  const backlinks = toObservation(await providers.backlinks.fetchProfile(project.domain), 'Backlink profile')
  const gsc = toObservation(await providers.searchConsole.fetchReport(project.domain), 'Search Console data')
  const analytics = toObservation(await providers.analytics.fetchReport(project.domain), 'Analytics data')
  const trends = toObservation(await providers.trends.fetchTrends([project.name || project.domain]), 'Trend data')

  // Competitor overlap. Their pages are not crawled in this environment, so
  // overlap degrades to Unavailable per dimension (with reasons) — never faked.
  const overlaps = competitors.map((competitor) => ({
    competitor,
    overlap: computeOverlap(input.ourPages, null, now),
  }))

  const graph = buildExternalGraph(project.domain, overlaps, aiVisibility.value ?? [])

  // Changes vs the prior snapshot (empty when there is nothing to compare).
  const changes = significantChanges([
    ...detectRankingChanges(input.prev?.gsc ?? null, gsc.value),
    ...detectBacklinkChanges(input.prev?.backlinks ?? null, backlinks.value),
    ...detectAiCitationChanges(input.prev?.aiVisibility ?? [], aiVisibility.value ?? []),
  ])

  const briefing = generateBriefing({
    date: now.slice(0, 10),
    providers: providerStatuses,
    changes,
    aiVisibility: aiVisibility.value,
    competitorCount: competitors.length,
  })

  // Tally evidence grades across the top-level observations for an at-a-glance
  // "how much of this is real vs unknown".
  const grades: Record<EvidenceGrade, number> = { observed: 0, imported: 0, estimated: 0, unavailable: 0 }
  const count = (o: Observation<unknown>) => { grades[o.evidence.grade]++ }
  count(aiVisibility); count(backlinks); count(gsc); count(analytics); count(trends)
  for (const { overlap } of overlaps) for (const dim of Object.values(overlap)) count(dim)

  return {
    generatedAt: now,
    providers: providerStatuses,
    competitors: overlaps,
    aiVisibility, backlinks, gsc, analytics, trends,
    graph, changes, briefing, grades,
  }
}
