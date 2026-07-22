// Mission Atlas assembly (Phase G). Given a project's providers (default: none
// connected → everything Unavailable), gather external intelligence into ONE
// snapshot with a morning briefing. The recommendation/strategy engines never
// see a provider — they see graded Observations. This is the seam that keeps
// provider-specific logic out of the core (§10).

import type { Competitor, Project } from '../types'
import type { PageSignals } from '../reco/signals'
import { computeOverlap, isCompetitorOverlap, type CompetitorOverlap } from './competitors'
import { buildExternalGraph, type ExternalGraph } from './knowledge-graph'
import { generateBriefing, type MorningBriefing } from './briefing'
import { detectAiCitationChanges, detectBacklinkChanges, detectRankingChanges, significantChanges, type Change } from './change-detection'
import { freshnessOf, unavailable, type EvidenceGrade, type Observation, type ProviderOutcome, type ProviderStatus } from './types'
import type { AiSearchProvider, AiVisibility } from './providers/ai-search'
import type { BacklinkProfile, BacklinkProvider } from './providers/backlinks'
import type { GscReport, SearchConsoleProvider } from './providers/search-console'
import type { Ga4Report, AnalyticsProvider } from './providers/analytics'
import type { TrendReport, TrendProvider } from './providers/trends'
import { NullSearchConsoleProvider } from './providers/search-console'
import { NullAnalyticsProvider } from './providers/analytics'
import { NullTrendProvider } from './providers/trends'
import { NullBacklinkProvider } from './providers/backlinks'
import { GoogleSearchConsoleProvider, GoogleAnalyticsProvider, listSearchConsoleSites, type GscSiteEntry } from './providers/google'
import type { FoundationStore } from '../store'
import { googleOAuthConfig } from '../env'
import { decodeTokenBundle, encodeTokenBundle, type GoogleTokenBundle } from '../oauth/google'

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

// Resolve a project's REAL providers from its stored, encrypted connections
// (Phase H). Google Search Console / Analytics become live providers when the
// project has connected them; everything else stays Null (no Google equivalent).
// This is the seam the atlas route now uses in place of the all-disconnected
// default — so provider-specific logic never leaks into the reco/strategy layer.
//
// Refreshed tokens are persisted back through `store` so a long-lived connection
// doesn't re-refresh on every read. If Google OAuth isn't configured on the
// deployment (no client id/secret), we can't refresh, so we degrade to Null.
export async function connectedProviderSet(
  store: FoundationStore,
  projectId: string,
  project: { domain: string },
  nowMs: number
): Promise<ProviderSet> {
  const set = disconnectedProviderSet()
  const config = googleOAuthConfig()
  if (!config) return set

  const makeDeps = (bundle: GoogleTokenBundle, kind: 'search-console' | 'analytics') => ({
    bundle,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    nowMs,
    persist: async (next: GoogleTokenBundle) => {
      const fresh = await store.getProviderConnection(projectId, kind)
      if (fresh) await store.upsertProviderConnection({ ...fresh, credentialEnc: encodeTokenBundle(next), updatedAt: new Date(nowMs).toISOString() })
    },
  })

  const gsc = await store.getProviderConnection(projectId, 'search-console')
  if (gsc && gsc.status === 'connected') {
    try {
      set.searchConsole = new GoogleSearchConsoleProvider('gsc', makeDeps(decodeTokenBundle(gsc.credentialEnc), 'search-console'), gsc.resourceId, project.domain)
    } catch { /* corrupt credential → leave Null (disconnected) */ }
  }
  const ga = await store.getProviderConnection(projectId, 'analytics')
  if (ga && ga.status === 'connected') {
    try {
      set.analytics = new GoogleAnalyticsProvider('ga4', makeDeps(decodeTokenBundle(ga.credentialEnc), 'analytics'), ga.resourceId)
    } catch { /* corrupt credential → leave Null (disconnected) */ }
  }
  return set
}

// List every Search Console property the connected Google account can see
// (with permission level), so the UI can offer a picker instead of making the
// user guess the exact resourceId string that avoids a 403. Returns null when
// Search Console isn't connected or OAuth isn't configured — the route turns
// that into a clear error rather than an empty-but-successful list.
export async function listGoogleSearchConsoleProperties(
  store: FoundationStore,
  projectId: string,
  nowMs: number
): Promise<{ ok: true; sites: GscSiteEntry[] } | { ok: false; reason: string }> {
  const config = googleOAuthConfig()
  if (!config) return { ok: false, reason: 'Google OAuth is not configured on this deployment.' }
  const gsc = await store.getProviderConnection(projectId, 'search-console')
  if (!gsc || gsc.status !== 'connected') return { ok: false, reason: 'Search Console is not connected for this project.' }
  let bundle: GoogleTokenBundle
  try {
    bundle = decodeTokenBundle(gsc.credentialEnc)
  } catch {
    return { ok: false, reason: 'Stored Google credential could not be read — reconnect Google.' }
  }
  const outcome = await listSearchConsoleSites({
    bundle,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    nowMs,
    persist: async (next) => {
      const fresh = await store.getProviderConnection(projectId, 'search-console')
      if (fresh) await store.upsertProviderConnection({ ...fresh, credentialEnc: encodeTokenBundle(next), updatedAt: new Date(nowMs).toISOString() })
    },
  })
  if (!outcome.ok) return { ok: false, reason: outcome.detail }
  return { ok: true, sites: outcome.data }
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

function toObservation<T>(o: ProviderOutcome<T>, unavailableWhat: string, nowMs: number): Observation<T> {
  if (o.ok) {
    // Duck-type an applicable data window off the payload (GSC/GA4 carry .range).
    const range = (o.data as { range?: { from: string; to: string } } | null)?.range
    return {
      value: o.data,
      evidence: {
        grade: o.grade,
        source: o.source,
        fetchedAt: o.fetchedAt,
        partial: o.partial ?? false,
        dateRange: range && range.from ? range : null,
        // A just-fetched value is fresh; a 1h TTL is a placeholder used the day
        // stored snapshots are re-read (see freshnessOf).
        freshness: freshnessOf(o.fetchedAt, nowMs, 60 * 60 * 1000),
        note: o.partial ? 'partial response' : undefined,
      },
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
  const nowMs = Date.parse(now)
  const aiVisibility: Observation<AiVisibility[]> = anyAiObserved
    ? { value: aiObservations, evidence: { grade: 'observed', source: 'ai-search', fetchedAt: now, partial: false, freshness: freshnessOf(now, nowMs, 60 * 60 * 1000) }, confidence: 'unknown' }
    : unavailable<AiVisibility[]>('none', 'No AI-search engine connected — AI-visibility is unavailable.')

  const backlinks = toObservation(await providers.backlinks.fetchProfile(project.domain), 'Backlink profile', nowMs)
  const gsc = toObservation(await providers.searchConsole.fetchReport(project.domain), 'Search Console data', nowMs)
  const analytics = toObservation(await providers.analytics.fetchReport(project.domain), 'Analytics data', nowMs)
  const trends = toObservation(await providers.trends.fetchTrends([project.name || project.domain]), 'Trend data', nowMs)

  // Competitor overlap. Uses the last real crawl snapshot (Refresh action,
  // per-dimension Observed) when one exists and is shaped correctly; otherwise
  // degrades to Unavailable per dimension (with reasons) — never faked.
  const overlaps = competitors.map((competitor) => ({
    competitor,
    overlap: isCompetitorOverlap(competitor.overlap) ? competitor.overlap : computeOverlap(input.ourPages, null, now),
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

// The rolling baseline to persist as "yesterday" for the NEXT call's change
// detection. Per-dimension: only overwrite with a fresh value when this call
// actually OBSERVED it — a transient disconnect (provider errored, token
// expired) must never silently reset the baseline to null and erase the
// ability to detect a change once the provider reconnects. Pure so the
// baseline-rollover logic is testable without any store/route plumbing.
export function nextPriorSnapshot(snapshot: AtlasSnapshot, prev?: PriorSnapshotData): PriorSnapshotData {
  return {
    gsc: snapshot.gsc.evidence.grade === 'observed' ? snapshot.gsc.value : prev?.gsc ?? null,
    backlinks: snapshot.backlinks.evidence.grade === 'observed' ? snapshot.backlinks.value : prev?.backlinks ?? null,
    aiVisibility: snapshot.aiVisibility.evidence.grade === 'observed' ? (snapshot.aiVisibility.value ?? []) : prev?.aiVisibility ?? [],
  }
}
