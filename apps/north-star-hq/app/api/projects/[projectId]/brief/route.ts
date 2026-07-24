// Executive Brief — the API layer (Engine -> API -> UI). A thin wrapper:
// auth, fetch the real records the engine needs (same sources the Mission
// Queue, Agent Roster, and Atlas routes already fetch), call the engine,
// return the DTO. No business logic lives here — see
// lib/foundation/briefing/engine.ts.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import { buildMissionQueue } from '@/lib/foundation/missions/engine'
import { buildAgentRoster } from '@/lib/foundation/agents/runtime'
import { buildExecutiveBrief } from '@/lib/foundation/briefing/engine'
import { latestScanPages } from '@/lib/foundation/operator/context'
import { toPageSignals } from '@/lib/foundation/reco/signals'
import { assembleAtlas, connectedProviderSet, nextPriorSnapshot, type PriorSnapshotData } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

const ACTIVITY_WINDOW_MS = 24 * 3600 * 1000

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const now = new Date().toISOString()

  const [coordination, deployments, scans, jobs, contentBriefs, atlasHistory, activity, competitors, rawPages] = await Promise.all([
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
  // assembly itself throws (e.g. a provider outage), the brief still
  // renders from internal state alone rather than failing the whole page.
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

  const brief = buildExecutiveBrief({
    project: { id: project.id, name: project.name },
    missionQueue,
    roster,
    recentActivity,
    atlas,
    priorGsc: prev?.gsc ?? null,
    now,
  })

  return Response.json({ brief })
})
