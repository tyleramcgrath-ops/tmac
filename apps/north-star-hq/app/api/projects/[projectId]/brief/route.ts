// Executive Brief — the API layer (Engine -> API -> UI). A thin wrapper:
// auth, build the brief from the real records, return the DTO. No business
// logic lives here — the composition is in lib/foundation/briefing/load.ts
// (shared with /brief/audio) and the brief itself in
// lib/foundation/briefing/engine.ts.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { loadExecutiveBrief } from '@/lib/foundation/briefing/load'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const brief = await loadExecutiveBrief(store, project)
  return Response.json({ brief })
})
