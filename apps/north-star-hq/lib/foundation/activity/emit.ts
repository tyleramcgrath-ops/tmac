// The one function anything in the domain layer calls to record that a real
// event happened. No UI concerns, no fabrication — every call site here is
// wired to a genuine state change (a real transition, a real deploy attempt,
// a real detected agent-status change). See ActivityEvent in ../types.ts and
// the FoundationStore contract in ../store.ts.

import { randomUUID } from 'crypto'
import type { FoundationStore } from '../store'
import type { ActivityEvent, ActivityEventType } from '../types'

export interface EmitActivityInput {
  orgId: string
  projectId: string
  type: ActivityEventType
  summary: string
  missionId?: string | null
  recommendationId?: string | null
  agentRole?: string | null
  actorId?: string | null
  detail?: string | null
}

export async function emitActivity(store: FoundationStore, input: EmitActivityInput): Promise<ActivityEvent> {
  const event: ActivityEvent = {
    id: randomUUID(),
    orgId: input.orgId,
    projectId: input.projectId,
    type: input.type,
    summary: input.summary,
    missionId: input.missionId ?? null,
    recommendationId: input.recommendationId ?? null,
    agentRole: input.agentRole ?? null,
    actorId: input.actorId ?? null,
    detail: input.detail ?? null,
    at: new Date().toISOString(),
  }
  await store.appendActivity(event)
  return event
}
