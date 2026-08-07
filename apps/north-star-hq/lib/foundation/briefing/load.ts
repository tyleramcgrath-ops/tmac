// Composition for the executive brief: fetch the real records, run the same
// engines the Mission Queue / Agent Roster / Atlas routes run, build the brief.
//
// Extracted so /brief and /brief/audio cannot drift apart. Two copies of a
// nine-source composition is two chances for the spoken briefing to describe a
// different reality than the written one — which is the single worst bug this
// feature could have, because nobody would notice it.

import type { FoundationStore } from '../store'
import type { Project } from '../types'
import { coordinateProject } from '../agents/service'
import { buildMissionQueue } from '../missions/engine'
import { buildAgentRoster } from '../agents/runtime'
import { buildExecutiveBrief, type ExecutiveBrief } from './engine'
import { latestScanPages } from '../operator/context'
import { toPageSignals } from '../reco/signals'
import { assembleAtlas, connectedProviderSet, nextPriorSnapshot, type PriorSnapshotData } from '../external/service'

const ACTIVITY_WINDOW_MS = 24 * 3600 * 1000

export async function loadExecutiveBrief(store: FoundationStore, project: Project): Promise<ExecutiveBrief> {
  const projectId = project.id
  const now = new Date().toISOString()

  const [coordination, deployments, scans, jobs, contentBriefs, atlasHistory, activity, competitors, rawPages] =
    await Promise.all([
      coordinateProject(store, project),
      store.listWpDeployments(projectId),
      store.listScans(projectId, 5),
      store.listJobs(projectId, 20),
      store.listContentBriefs(projectId),
      store.getAtlasHistory(projectId),
      store.listActivity(projectId, { limit: 200 }),
      store.listCompetitors(projectId),
      latestScanPages(store, projectId),
    ])

  const missionQueue = buildMissionQueue({ project: { id: project.id, name: project.name }, coordination, deployments })
  const roster = buildAgentRoster({ project, scans, jobs, contentBriefs, atlasHistory, missionQueue })

  const windowStart = Date.now() - ACTIVITY_WINDOW_MS
  const recentActivity = activity.filter((e) => Date.parse(e.at) >= windowStart)

  // Same real Mission Atlas pipeline the /atlas route uses — external
  // intelligence degrades honestly to unavailable, never fabricated. If
  // assembly itself throws (e.g. a provider outage), the brief still renders
  // from internal state alone rather than failing the whole page.
  let atlas: Awaited<ReturnType<typeof assembleAtlas>> | null = null
  const prev = (atlasHistory?.data as PriorSnapshotData | undefined) ?? undefined
  try {
    const providers = await connectedProviderSet(store, projectId, { domain: project.domain }, Date.parse(now))
    atlas = await assembleAtlas({
      now,
      project: { domain: project.domain, name: project.name },
      ourPages: rawPages.map(toPageSignals),
      competitors,
      providers,
      prev,
    })
    await store.upsertAtlasHistory({ projectId, data: nextPriorSnapshot(atlas, prev), capturedAt: now })
  } catch {
    atlas = null
  }

  return buildExecutiveBrief({
    project: { id: project.id, name: project.name },
    missionQueue,
    roster,
    recentActivity,
    atlas,
    priorGsc: prev?.gsc ?? null,
    now,
  })
}
