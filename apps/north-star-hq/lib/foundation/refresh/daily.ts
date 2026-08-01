// Daily refresh: keep every project's snapshot current, and notice what moved,
// without anyone having to open the room.
//
// Until now nothing in this app ran on a schedule. Every number was fetched
// because a human loaded a page, which means a traffic collapse at 2am was
// invisible until someone happened to look. This runs the same Mission Atlas
// assembly the brief route already performs, per project, on a timer — storing
// the snapshot and emitting an activity event when a metric genuinely moves.
//
// SCOPE, stated honestly: this refreshes real external intelligence (Search
// Console, Analytics, backlinks, AI visibility) and detects real change in it.
// It does NOT regenerate recommendations. The recommendations this app shows
// come from seed.ts's static demo list — generateRecommendationsV2 has no call
// site here, and feeding it would require a crawler this app does not have.
// Refreshing on a schedule cannot make fabricated missions true, so this does
// not pretend to; see the PR for what closing that gap would take.

import { emitActivity } from '../activity/emit'
import { describeChanges, gscTotals } from './changes'
import {
  assembleAtlas,
  connectedProviderSet,
  nextPriorSnapshot,
  type PriorSnapshotData,
} from '../external/service'
import { latestScanPages } from '../operator/context'
import { toPageSignals } from '../reco/signals'
import type { FoundationStore } from '../store'
import type { Project } from '../types'

export interface ProjectRefreshResult {
  projectId: string
  domain: string
  status: 'refreshed' | 'skipped' | 'failed'
  /** Why it was skipped or how it failed. Null on success. */
  reason: string | null
  /** Human-readable changes worth surfacing. Empty when nothing moved. */
  changes: string[]
}

export interface DailyRefreshSummary {
  startedAt: string
  finishedAt: string
  projects: number
  refreshed: number
  skipped: number
  failed: number
  results: ProjectRefreshResult[]
}

async function refreshProject(
  store: FoundationStore,
  project: Project,
  nowIso: string
): Promise<ProjectRefreshResult> {
  const base: ProjectRefreshResult = {
    projectId: project.id,
    domain: project.domain,
    status: 'refreshed',
    reason: null,
    changes: [],
  }

  const [atlasHistory, competitors, rawPages] = await Promise.all([
    store.getAtlasHistory(project.id),
    store.listCompetitors(project.id),
    latestScanPages(store, project.id),
  ])
  const prev = (atlasHistory?.data as PriorSnapshotData | undefined) ?? undefined

  const providers = await connectedProviderSet(store, project.id, { domain: project.domain }, Date.parse(nowIso))
  const atlas = await assembleAtlas({
    now: nowIso,
    project: { domain: project.domain, name: project.name },
    ourPages: rawPages.map(toPageSignals),
    competitors,
    providers,
    prev,
  })

  // Nothing connected means nothing real to compare. Recording a snapshot of
  // "unavailable" would poison tomorrow's baseline, so skip instead.
  const current = gscTotals(atlas.gsc)
  if (current.clicks == null && current.impressions == null) {
    return { ...base, status: 'skipped', reason: 'No connected Search Console data to refresh.' }
  }

  const changes = prev ? describeChanges(current, gscTotals(prev.gsc)) : []

  await store.upsertAtlasHistory({
    projectId: project.id,
    data: nextPriorSnapshot(atlas, prev),
    capturedAt: nowIso,
  })

  // One event per real change, so the room can show what moved overnight.
  // Best-effort per event: a failed write must not lose the snapshot above.
  for (const change of changes) {
    try {
      await emitActivity(store, {
        orgId: project.orgId,
        projectId: project.id,
        type: 'atlas.metric_changed',
        summary: change,
        agentRole: 'atlas',
      })
    } catch {
      // Recorded in the summary regardless; the snapshot is the durable part.
    }
  }

  return { ...base, changes }
}

/**
 * Refresh every project across every org. One project's failure never stops
 * the rest — a single expired Google token must not freeze the whole estate.
 */
export async function runDailyRefresh(
  store: FoundationStore,
  opts: { now?: Date } = {}
): Promise<DailyRefreshSummary> {
  const startedAt = (opts.now ?? new Date()).toISOString()
  const results: ProjectRefreshResult[] = []

  const orgs = await store.listOrgs()
  for (const org of orgs) {
    const projects = await store.listProjects(org.id)
    for (const project of projects) {
      try {
        results.push(await refreshProject(store, project, startedAt))
      } catch (err) {
        results.push({
          projectId: project.id,
          domain: project.domain,
          status: 'failed',
          reason: err instanceof Error ? err.message : String(err),
          changes: [],
        })
      }
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    projects: results.length,
    refreshed: results.filter((r) => r.status === 'refreshed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  }
}
