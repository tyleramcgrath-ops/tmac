// List the Search Console properties the connected Google account can see
// (Phase H follow-up). Lets the Atlas UI offer a picker for the resourceId
// override instead of making the user guess the exact property string that
// avoids a 403 (the app otherwise assumes a Domain property by default).

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { listGoogleSearchConsoleProperties } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const result = await listGoogleSearchConsoleProperties(store, projectId, Date.now())
  if (!result.ok) return Response.json({ sites: [], error: result.reason })
  return Response.json({ sites: result.sites })
})
