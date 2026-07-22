// Backlink profile: aggregate metrics (total backlinks, referring domains,
// Trust Flow, Citation Flow) from Majestic's real backlink index. Not a
// page-by-page crawl of the open web — that's impractical in-app — but a
// real third-party measurement, honestly unavailable when MAJESTIC_API_KEY
// isn't configured on this deployment.

import { randomUUID } from 'crypto'
import { audit, enforceRateLimit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { checkBacklinks, majesticApiKey } from '@/lib/foundation/backlinks'
import { hostOf } from '@/lib/foundation/serp'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const snapshots = await store.listBacklinkSnapshots(projectId, 50)
  return Response.json({ configured: !!majesticApiKey(), snapshots })
})

export const POST = handled(async (request, { params }) => {
  enforceRateLimit(request, 'backlink-check', 10)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const key = majesticApiKey()
  if (!key) return Response.json({ error: 'Connect a backlink provider (set MAJESTIC_API_KEY) to check your backlink profile.' }, { status: 400 })

  let host: string
  try {
    host = hostOf(project.domain)
  } catch {
    return Response.json({ error: 'Project domain is not a valid host.' }, { status: 400 })
  }
  const c = await checkBacklinks(host, key)
  const snapshot = {
    id: randomUUID(), projectId, available: c.available,
    totalBacklinks: c.totalBacklinks, referringDomains: c.referringDomains,
    trustFlow: c.trustFlow, citationFlow: c.citationFlow, message: c.message,
    checkedAt: new Date().toISOString(),
  }
  await store.recordBacklinkSnapshot(snapshot)
  await audit(project.orgId, user.id, 'backlinks.check', projectId, c.available ? 'ok' : c.message ?? 'unavailable')
  return Response.json({ snapshot })
})
