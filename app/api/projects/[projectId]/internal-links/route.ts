// Internal-link equity: which pages earn the most from search and are linked
// the least from the site's own pages, plus which topically-related pages
// should carry the new link.
//
// Both inputs are required and degrade with a named reason — the crawl supplies
// the link graph, Search Console supplies which pages are worth linking to.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { assembleLinkEquityPlan } from '@/lib/foundation/content/link-plan'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json(await assembleLinkEquityPlan(store, projectId, project, Date.now()))
})
