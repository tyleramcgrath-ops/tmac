// Live Agent Roster (Headquarters, Milestone 1/2) — a read-time projection of
// real workflow state onto five named operational roles. See
// lib/foundation/agents/runtime.ts for the documented status-mapping rules.
// No new persistence, no autonomous execution.
//
// Milestone 2: Operator and Sentinel are derived from the mission queue (the
// single source of truth for work — lib/foundation/missions/engine.ts), not
// independently re-scanned here. Scout/Atlas/Forge still read their own
// workflows directly (scans, background jobs, content briefs), since crawling
// and intelligence-gathering aren't themselves missions — they're what
// produces and feeds missions.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import { buildMissionQueue } from '@/lib/foundation/missions/engine'
import { buildAgentRoster } from '@/lib/foundation/agents/runtime'
import { emitActivity } from '@/lib/foundation/activity/emit'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const [scans, jobs, contentBriefs, atlasHistory, coordination, deployments] = await Promise.all([
    store.listScans(projectId, 5),
    store.listJobs(projectId, 20),
    store.listContentBriefs(projectId),
    store.getAtlasHistory(projectId),
    coordinateProject(store, project),
    store.listWpDeployments(projectId),
  ])

  const missionQueue = buildMissionQueue({
    project: { id: project.id, name: project.name },
    coordination,
    deployments,
  })

  const roster = buildAgentRoster({
    project,
    scans,
    jobs,
    contentBriefs,
    atlasHistory,
    missionQueue,
  })

  // Agent Roster is polled, not pushed — but a genuine active/idle
  // transition is still a real event worth recording once, not on every
  // poll. Detect it by comparing against the last agent.active/agent.idle
  // event this project actually emitted, per role.
  const recentAgentEvents = await store.listActivity(projectId, {
    types: ['agent.active', 'agent.idle'],
    limit: 50,
  })
  const lastBucketByRole = new Map<string, 'active' | 'idle'>()
  for (const e of recentAgentEvents) {
    if (e.agentRole && !lastBucketByRole.has(e.agentRole)) {
      lastBucketByRole.set(e.agentRole, e.type === 'agent.active' ? 'active' : 'idle')
    }
  }
  for (const agent of roster.agents) {
    const bucket: 'active' | 'idle' = agent.status === 'idle' ? 'idle' : 'active'
    if (lastBucketByRole.get(agent.agentId) === bucket) continue
    await emitActivity(store, {
      orgId: project.orgId,
      projectId,
      type: bucket === 'active' ? 'agent.active' : 'agent.idle',
      summary: `${agent.name} became ${bucket}${agent.currentActivity ? `: ${agent.currentActivity}` : '.'}`,
      agentRole: agent.agentId,
    })
  }

  return Response.json({ roster })
})
