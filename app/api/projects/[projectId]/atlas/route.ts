// Mission Atlas endpoint (Phase G). Assembles the external-intelligence snapshot
// + morning briefing for a project. In THIS environment no external provider is
// reachable (outbound network is restricted), so the disconnected provider set
// is used and everything degrades honestly to Unavailable — the architecture is
// ready for real providers to be plugged in behind the same interfaces.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { latestScanPages } from '@/lib/foundation/operator/context'
import { toPageSignals } from '@/lib/foundation/reco/signals'
import { assembleAtlas, disconnectedProviderSet } from '@/lib/foundation/external/service'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const [competitors, rawPages] = await Promise.all([
    store.listCompetitors(projectId),
    latestScanPages(store, projectId),
  ])
  const ourPages = rawPages.map(toPageSignals)

  const snapshot = await assembleAtlas({
    now: new Date().toISOString(),
    project: { domain: project.domain, name: project.name },
    ourPages,
    competitors,
    // Real providers would be resolved from the project's connected integrations
    // here; none are reachable in this environment, so we degrade gracefully.
    providers: disconnectedProviderSet(),
  })

  return Response.json({ snapshot })
})
