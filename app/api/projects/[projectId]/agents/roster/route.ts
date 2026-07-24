// Live Agent Roster (Headquarters, Milestone 1) — a read-time projection of
// real workflow state (scans, jobs, recommendations, deployments, content
// briefs, atlas history) onto five named operational roles. See
// lib/foundation/agents/runtime.ts for the documented status-mapping rules.
// No new persistence, no autonomous execution — this is pure recomputation
// over records other routes already produce.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { computeOperatorMetrics } from '@/lib/foundation/operator/metrics'
import { buildAgentRoster } from '@/lib/foundation/agents/runtime'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const [scans, jobs, recommendations, deployments, contentBriefs, atlasHistory] = await Promise.all([
    store.listScans(projectId, 5),
    store.listJobs(projectId, 20),
    store.listRecommendations(projectId),
    store.listWpDeployments(projectId),
    store.listContentBriefs(projectId),
    store.getAtlasHistory(projectId),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const operatorMetrics = computeOperatorMetrics(recommendations, deployments, today)

  const roster = buildAgentRoster({
    project,
    scans,
    jobs,
    recommendations,
    deployments,
    contentBriefs,
    atlasHistory,
    operatorMetrics,
  })

  return Response.json({ roster })
})
