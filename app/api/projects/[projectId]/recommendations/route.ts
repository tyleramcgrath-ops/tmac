import { audit, enforceRateLimit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { coordinateProject } from '@/lib/foundation/agents/service'
import { RECOMMENDATION_TRANSITIONS } from '@/lib/foundation/reco/transitions'
import { emitActivity } from '@/lib/foundation/activity/emit'
import type { ActivityEventType, RecommendationStatus } from '@/lib/foundation/types'

// The subset of transitions reachable from this general-purpose route that
// map cleanly onto a single Activity Stream event type. Transitions this
// route allows but that don't map here (e.g. into 'deployed'/'verified') are
// always driven by the deploy/rollback pipeline instead, which emits its own
// deployment.*/verification.* events at the source — never duplicated here.
const ACTIVITY_FOR_STATUS: Partial<Record<RecommendationStatus, ActivityEventType>> = {
  accepted: 'approval.granted',
  dismissed: 'mission.paused',
  rejected: 'mission.canceled',
  open: 'mission.resumed',
}

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  enforceRateLimit(request, 'recs-read', 120)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  // Multi-agent coordination (Phase F): each recommendation is returned with its
  // agent stances, consensus, and provenance chain; plus per-agent reports,
  // memory, and consensus metrics. No new dashboard — the existing
  // Recommendations tab renders this inline.
  const { coordinated, reports, memory, metrics } = await coordinateProject(store, project)
  // Apply the human priority override (Phase H): a recommendation with a
  // userPriority is ordered by it; the rest keep their engine rank. Stable sort
  // so equal keys retain coordination order.
  const rank = (r: { userPriority?: number; priorityRank?: number }) =>
    r.userPriority ?? (r.priorityRank !== undefined ? 1000 + r.priorityRank : 100000)
  const ordered = [...coordinated].sort((a, b) => rank(a) - rank(b))
  return Response.json({ recommendations: ordered, agents: reports, memory, metrics })
})

export const PATCH = handled(async (request, { params }) => {
  enforceRateLimit(request, 'recs-write', 120)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = String(body.id ?? '')

  const store = await getStore()
  const rec = await store.getRecommendation(id)
  if (!rec || rec.projectId !== projectId) {
    return Response.json({ error: 'Recommendation not found.' }, { status: 404 })
  }

  const hasStatus = typeof body.status === 'string' && (body.status as string).length > 0
  const hasPriority = 'userPriority' in body

  // Priority override (Phase H): reorder the list without changing triage state.
  if (hasPriority) {
    const raw = body.userPriority
    if (raw === null) {
      rec.userPriority = undefined
    } else {
      const n = Number(raw)
      if (!Number.isFinite(n)) return Response.json({ error: 'userPriority must be a number or null.' }, { status: 400 })
      rec.userPriority = n
    }
  }

  if (hasStatus) {
    const to = body.status as RecommendationStatus
    if (!RECOMMENDATION_TRANSITIONS[rec.status]?.includes(to)) {
      return Response.json({ error: `Cannot move a ${rec.status} recommendation to ${to}.` }, { status: 400 })
    }
    // History is append-only — the full decision trail is preserved (A8).
    rec.history.push({ at: new Date().toISOString(), by: user.id, from: rec.status, to })
    rec.status = to
  }

  if (!hasStatus && !hasPriority) {
    return Response.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  await store.updateRecommendation(rec)
  await audit(
    project.orgId,
    user.id,
    hasStatus ? 'recommendation.status' : 'recommendation.priority',
    rec.id,
    hasStatus ? `${rec.title}: → ${rec.status}` : `${rec.title}: priority=${rec.userPriority ?? 'cleared'}`
  )
  if (hasStatus) {
    const activityType = ACTIVITY_FOR_STATUS[rec.status]
    if (activityType) {
      await emitActivity(store, {
        orgId: project.orgId,
        projectId,
        type: activityType,
        summary: `"${rec.title}" is now ${rec.status}.`,
        missionId: rec.issueId,
        recommendationId: rec.id,
        actorId: user.id,
      })
    }
  }
  return Response.json({ recommendation: rec })
})
