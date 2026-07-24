// Read-only API over the Activity Stream (lib/foundation/store.ts's
// appendActivity/listActivity). Thin wrapper: auth, authorization, DTO —
// no business logic. Every event returned already happened; nothing here
// computes or infers state.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { ActivityEventType } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const VALID_TYPES = new Set<string>([
  'mission.created', 'recommendation.generated', 'mission.prioritized', 'approval.requested',
  'approval.granted', 'mission.paused', 'mission.resumed', 'mission.canceled', 'mission.retried',
  'deployment.started', 'deployment.finished', 'verification.passed', 'verification.failed',
  'rollback.started', 'rollback.finished', 'agent.active', 'agent.idle', 'command.executed',
  'command.failed', 'atlas.recommendation_updated', 'scout.discovery_completed',
])

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const url = new URL(request.url)
  const limitParam = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100
  const typesParam = url.searchParams.get('types')
  const types = typesParam
    ? (typesParam.split(',').map((t) => t.trim()).filter((t) => VALID_TYPES.has(t)) as ActivityEventType[])
    : undefined

  const events = await store.listActivity(projectId, { limit, types: types && types.length > 0 ? types : undefined })
  return Response.json({ events })
})
