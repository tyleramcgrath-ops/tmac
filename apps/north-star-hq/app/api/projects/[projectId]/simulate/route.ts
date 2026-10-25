// Scenario simulation. POST because the caller sends a selection, not because
// it changes anything — this route is pure read + compute, writes nothing, and
// records no audit entry.
//
// Origin-checked and rate-limited like other POST routes: it reads several
// tables per call, and a UI that re-simulates on every checkbox click should
// not be able to turn that into a database hammer.

import { assertSameOrigin, enforceRateLimit, handled, requireProjectRole, requireUser, HttpError } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { latestScanPages } from '@/lib/foundation/operator/context'
import { simulate } from '@/lib/foundation/simulate/engine'

export const runtime = 'nodejs'

const MAX_SELECTED = 200

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  assertSameOrigin(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  enforceRateLimit(request, 'simulate', 30, 60_000)

  const body = (await request.json().catch(() => null)) as { recommendationIds?: unknown } | null
  const raw = body?.recommendationIds
  if (!Array.isArray(raw)) {
    throw new HttpError(400, 'Send { recommendationIds: string[] }.')
  }
  const selectedIds = [...new Set(raw.filter((v): v is string => typeof v === 'string'))]
  if (selectedIds.length > MAX_SELECTED) {
    throw new HttpError(400, `Select at most ${MAX_SELECTED} recommendations.`)
  }

  const store = await getStore()
  const [pages, recommendations, keywords, rankSnapshots, deployments] = await Promise.all([
    latestScanPages(store, projectId),
    store.listRecommendations(projectId),
    store.listTrackedKeywords(projectId),
    store.listRankSnapshots(projectId),
    store.listWpDeployments(projectId),
  ])

  return Response.json(simulate({ selectedIds, recommendations, pages, keywords, rankSnapshots, deployments }))
})
