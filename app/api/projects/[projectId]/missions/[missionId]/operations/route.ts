// Mission Operations — the API layer (Engine -> API -> UI). A thin wrapper:
// auth, fetch the real mission + its real activity history, call the
// engine, return the DTO. No business logic lives here — see
// lib/foundation/missions/operations.ts.

import { handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import { buildMissionQueue } from '@/lib/foundation/missions/engine'
import { buildMissionOperations } from '@/lib/foundation/missions/operations'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId, missionId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const [coordination, deployments, events] = await Promise.all([
    coordinateProject(store, project),
    store.listWpDeployments(projectId),
    store.listActivity(projectId, { limit: 500 }),
  ])

  const queue = buildMissionQueue({ project: { id: project.id, name: project.name }, coordination, deployments })
  const mission = queue.missions.find((m) => m.id === missionId || m.recommendationId === missionId)
  if (!mission) throw new HttpError(404, 'Mission not found.')

  const operations = buildMissionOperations(mission, events, new Date().toISOString())
  return Response.json({ operations })
})
