import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { RecommendationStatus } from '@/lib/foundation/types'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json({ recommendations: await store.listRecommendations(projectId) })
})

const VALID_TRANSITIONS: Record<RecommendationStatus, RecommendationStatus[]> = {
  open: ['accepted', 'dismissed'],
  accepted: ['open', 'dismissed', 'deployed'],
  dismissed: ['open'],
  deployed: [],
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
