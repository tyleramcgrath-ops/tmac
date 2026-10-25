// List the GA4 properties the connected Google account can read, so the
// Integrations panel can offer a picker instead of asking for a property id
// typed off the GA4 admin screen. A typed id that the account cannot access
// fails later, at query time, with "does not have access to this property";
// a property listed here is one the account demonstrably can read.
//
// Mirrors the Search Console sites route exactly, including its contract:
// on failure return the reason rather than an empty list, so the UI can say
// what went wrong instead of showing "no properties found".

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { listGoogleAnalyticsProperties } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const result = await listGoogleAnalyticsProperties(store, projectId, Date.now())
  if (!result.ok) return Response.json({ properties: [], error: result.reason })
  return Response.json({ properties: result.properties })
})
