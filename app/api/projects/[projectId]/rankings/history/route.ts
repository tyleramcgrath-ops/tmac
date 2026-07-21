// Real rank-position history — every snapshot ever recorded for this
// project's tracked keywords (manual checks + the rank_tracking schedule),
// grouped by keyword so the UI can chart a trend per keyword.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const keyword = new URL(request.url).searchParams.get('keyword') ?? undefined
  const snapshots = await store.listRankSnapshots(projectId, keyword)
  return Response.json({ snapshots })
})
