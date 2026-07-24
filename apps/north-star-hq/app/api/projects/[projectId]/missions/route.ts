// Mission Queue — the API layer (Engine -> API -> UI). A thin wrapper: auth,
// fetch the real records the engine needs, call the engine, return the DTO.
// No business logic lives here — see lib/foundation/missions/engine.ts.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import { buildMissionQueue } from '@/lib/foundation/missions/engine'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const [coordination, deployments] = await Promise.all([
    coordinateProject(store, project),
    store.listWpDeployments(projectId),
  ])

  const queue = buildMissionQueue({
    project: { id: project.id, name: project.name },
    coordination,
    deployments,
  })

  return Response.json({ queue })
})
