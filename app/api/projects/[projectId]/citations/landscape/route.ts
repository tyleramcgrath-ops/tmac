// The AI search landscape: who answer engines cite for this project's tracked
// prompts, how the project compares against tracked competitors, which prompts
// to try next (drawn from real Search Console demand), and what the cited
// sources have in common.
//
// Reads only stored snapshots — no live answer-engine calls happen here, so
// opening the tab costs nothing. Running a new check stays an explicit action.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { assembleAiSearchPlan } from '@/lib/foundation/ai/plan'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json(await assembleAiSearchPlan(store, projectId, project, Date.now()))
})
