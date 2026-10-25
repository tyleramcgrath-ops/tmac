// GEO audit for a project: live robots.txt + AI-crawler access, plus the
// structured-data census from the latest usable scan.
//
// Rate-limited because this makes a real outbound request to the project's
// domain on every call — a chatty UI (or an agent in a loop) should not be
// able to hammer a customer's server through us.

import { enforceRateLimit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { latestScanPages } from '@/lib/foundation/operator/context'
import { auditGeo } from '@/lib/foundation/geo/engine'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  enforceRateLimit(request, 'geo-audit', 20, 60_000)

  const store = await getStore()
  const pages = await latestScanPages(store, projectId)
  const audit = await auditGeo({ domain: project.domain, pages })
  return Response.json(audit)
})
