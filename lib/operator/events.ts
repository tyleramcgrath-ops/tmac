import { getPrismaClient } from '@/lib/db'

export type OperatorEventKind =
  | 'candidate_discovered'
  | 'candidate_consolidated'
  | 'candidate_promoted'
  | 'candidate_demoted'
  | 'candidate_suppressed'
  | 'mission_selected'
  | 'mission_changed'
  | 'recommendation_accepted'
  | 'recommendation_rejected'
  | 'recommendation_deferred'
  | 'action_completed'
  | 'outcome_verified'
  | 'learning_adjustment_made'
  | 'conflict_detected'
  | 'data_became_stale'
  | 'recommendation_expired'

export async function logEvent(input: {
  organizationId: string
  projectId: string
  kind: OperatorEventKind
  summary: string
  payload?: unknown
  candidateId?: string
  memoryId?: string
}) {
  const prisma = getPrismaClient()
  return prisma.operatorEvent.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      kind: input.kind,
      summary: input.summary,
      payload: input.payload ? (JSON.parse(JSON.stringify(input.payload)) as any) : undefined,
      candidateId: input.candidateId,
      memoryId: input.memoryId,
    },
  })
}

export async function listEvents(input: {
  projectId: string
  kind?: OperatorEventKind
  since?: Date
  limit?: number
}) {
  const prisma = getPrismaClient()
  return prisma.operatorEvent.findMany({
    where: {
      projectId: input.projectId,
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.since ? { createdAt: { gte: input.since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: input.limit ?? 100,
  })
}
