// The project's whole Search Console keyword corpus, rolled up per keyword and
// joined to the GA4 outcome for each keyword's landing page — the Rankings
// tab's decision surface. One call so the UI doesn't fan out to five endpoints
// and stitch them together client-side.
//
// Search Console and Analytics degrade independently: no GSC → a clear reason
// and no keyword rows (never invented ones); no GA4 → keywords still render,
// minus the landing-page outcome columns.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { assembleKeywordIntelligence } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const intelligence = await assembleKeywordIntelligence(store, projectId, project, Date.now())
  return Response.json(intelligence)
})
