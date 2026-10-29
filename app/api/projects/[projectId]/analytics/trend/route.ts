// Day-by-day GSC + GA4 trend for the Atlas dashboard's charts (Phase H
// follow-up). Each side degrades independently to a clear reason — never a
// fabricated series — so the chart can show "Search Console: connected,
// Analytics: no property selected" instead of a single all-or-nothing state.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { fetchGoogleTrends } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const trends = await fetchGoogleTrends(store, projectId, project, Date.now())
  return Response.json(trends)
})
