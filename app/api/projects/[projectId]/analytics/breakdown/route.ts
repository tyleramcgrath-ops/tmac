// Device/country (GSC) + traffic-channel (GA4) breakdowns (Phase H follow-up)
// — "see everything you'd see in the native Search Console / Analytics UI",
// not just the query/page tables the atlas snapshot already carries. Each
// side degrades independently to a clear reason, never a fabricated row.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { fetchGoogleBreakdowns } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const breakdowns = await fetchGoogleBreakdowns(store, projectId, project, Date.now())
  return Response.json(breakdowns)
})
