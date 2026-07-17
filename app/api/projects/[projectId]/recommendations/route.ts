import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import type { RecommendationStatus } from '@/lib/foundation/types'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  // Multi-agent coordination (Phase F): each recommendation is returned with its
  // agent stances, consensus, and provenance chain; plus per-agent reports,
  // memory, and consensus metrics. No new dashboard — the existing
  // Recommendations tab renders this inline.
  const { coordinated, reports, memory, metrics } = await coordinateProject(store, project)
  return Response.json({ recommendations: coordinated, agents: reports, memory, metrics })
})

// User-driven transitions. 'deployed'/'verified'/'rolled_back' are set by the
// WordPress execution flow, not by this endpoint, so they are terminal here.
const VALID_TRANSITIONS: Record<RecommendationStatus, RecommendationStatus[]> = {
  open: ['accepted', 'modified', 'rejected', 'dismissed'],
  accepted: ['open', 'modified', 'rejected', 'dismissed'],
  modified: ['accepted', 'open', 'rejected', 'dismissed'],
  rejected: ['open'],
  dismissed: ['open'],
  deployed: ['verified', 'rolled_back'],
  verified: ['rolled_back'],
  rolled_back: ['open'],
}

export const PATCH = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = String(body.id ?? '')
  const to = String(body.status ?? '') as RecommendationStatus

  const store = await getStore()
  const rec = await store.getRecommendation(id)
  if (!rec || rec.projectId !== projectId) {
    return Response.json({ error: 'Recommendation not found.' }, { status: 404 })
  }
  if (!VALID_TRANSITIONS[rec.status]?.includes(to)) {
    return Response.json(
      { error: `Cannot move a ${rec.status} recommendation to ${to}.` },
      { status: 400 }
    )
  }

  // History is append-only — the full decision trail is preserved (A8).
  rec.history.push({ at: new Date().toISOString(), by: user.id, from: rec.status, to })
  rec.status = to
  await store.updateRecommendation(rec)
  await audit(project.orgId, user.id, 'recommendation.status', rec.id, `${rec.title}: → ${to}`)
  return Response.json({ recommendation: rec })
})
