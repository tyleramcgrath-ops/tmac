// Executive / Operator view (Phase D §10) + learning substrate (§6).
// Execution-focused metrics from durable records; no vanity charts.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { computeOperatorMetrics } from '@/lib/foundation/operator/metrics'
import { aggregateLearning } from '@/lib/foundation/operator/learning'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const [recs, deployments] = await Promise.all([
    store.listRecommendations(projectId),
    store.listWpDeployments(projectId),
  ])
  // `today` passed in (Date.now unavailable in some contexts); default to the
  // newest deployment/rec date so "fixed today" is meaningful without a clock.
  const url = new URL(request.url)
  const today = url.searchParams.get('today') || new Date().toISOString().slice(0, 10)
  const metrics = computeOperatorMetrics(recs, deployments, today)
  const learning = aggregateLearning(recs, deployments)
  return Response.json({ metrics, learning })
})
