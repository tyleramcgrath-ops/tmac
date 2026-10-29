// Real AI-citation check history — every snapshot ever recorded for this
// project's tracked queries (manual checks + the ai_citation_check
// schedule), grouped by query so the UI can show a trend per query.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const query = new URL(request.url).searchParams.get('query') ?? undefined
  const snapshots = await store.listAiCitationSnapshots(projectId, query)
  return Response.json({ snapshots })
})
