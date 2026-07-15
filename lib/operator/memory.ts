import { getPrismaClient } from '@/lib/db'
import type { MemoryStatus } from './types'
import type { OperatorMemory } from '@prisma/client'

/**
 * Persistent work memory. The Operator refuses to recommend an action already
 * decided-on (accepted / rejected / ignored / completed / blocked) unless the
 * memory has expired. Deferred items can resurface after their expiry.
 */

export function memoryKey(pageUrl: string, recommendationType: string): string {
  return `${pageUrl}::${recommendationType}`
}

export async function loadMemoryMap(projectId: string): Promise<Map<string, OperatorMemory>> {
  const prisma = getPrismaClient()
  const rows = await prisma.operatorMemory.findMany({
    where: { projectId },
  })
  const map = new Map<string, OperatorMemory>()
  for (const row of rows) {
    map.set(memoryKey(row.pageUrl, row.recommendationType), row)
  }
  return map
}

export function isBlockedByMemory(memory: OperatorMemory | undefined): boolean {
  if (!memory) return false
  if (memory.status === 'proposed') return true // already surfaced, don't dupe
  if (memory.status === 'completed' || memory.status === 'accepted') return true
  if (memory.status === 'rejected' || memory.status === 'blocked') return true
  if (memory.status === 'ignored') return true
  if (memory.status === 'deferred') {
    // Deferred re-emerges after expiresAt (or 7 days by default)
    if (memory.expiresAt && memory.expiresAt.getTime() > Date.now()) return true
    return false
  }
  if (memory.status === 'expired') return false
  return false
}

export async function recordDecision(input: {
  organizationId: string
  projectId: string
  pageUrl: string
  recommendationType: string
  status: MemoryStatus
  reason?: string
  decidedBy?: string
  deferDays?: number
  snapshot?: unknown
}) {
  const prisma = getPrismaClient()
  const {
    organizationId,
    projectId,
    pageUrl,
    recommendationType,
    status,
    reason,
    decidedBy,
    deferDays,
    snapshot,
  } = input

  const expiresAt =
    status === 'deferred' && deferDays
      ? new Date(Date.now() + deferDays * 24 * 60 * 60 * 1000)
      : null

  return prisma.operatorMemory.upsert({
    where: {
      projectId_pageUrl_recommendationType: {
        projectId,
        pageUrl,
        recommendationType,
      },
    },
    create: {
      organizationId,
      projectId,
      pageUrl,
      recommendationType,
      status,
      reason,
      decidedBy,
      decidedAt: new Date(),
      expiresAt,
      snapshot: snapshot ? (JSON.parse(JSON.stringify(snapshot)) as any) : undefined,
    },
    update: {
      status,
      reason,
      decidedBy,
      decidedAt: new Date(),
      expiresAt,
      snapshot: snapshot ? (JSON.parse(JSON.stringify(snapshot)) as any) : undefined,
    },
  })
}

export async function proposeMemory(input: {
  organizationId: string
  projectId: string
  pageUrl: string
  recommendationType: string
  snapshot: unknown
}) {
  const prisma = getPrismaClient()
  const { organizationId, projectId, pageUrl, recommendationType, snapshot } = input
  const existing = await prisma.operatorMemory.findUnique({
    where: {
      projectId_pageUrl_recommendationType: {
        projectId,
        pageUrl,
        recommendationType,
      },
    },
  })
  if (existing) return existing

  return prisma.operatorMemory.create({
    data: {
      organizationId,
      projectId,
      pageUrl,
      recommendationType,
      status: 'proposed',
      decidedBy: 'operator',
      decidedAt: new Date(),
      snapshot: JSON.parse(JSON.stringify(snapshot)) as any,
    },
  })
}

export async function recordOutcome(input: {
  organizationId: string
  projectId: string
  memoryId: string
  trafficDelta?: number
  ctrDelta?: number
  rankingDelta?: number
  conversionDelta?: number
  revenueDelta?: number
  windowStart: Date
  windowEnd: Date
  notes?: string
}) {
  const prisma = getPrismaClient()
  return prisma.operatorOutcome.create({ data: input })
}

/**
 * Compute a learning multiplier from historical outcomes. If similar
 * recommendations produced positive deltas in the past, the Operator
 * should weight them more heavily; if they consistently produced nothing,
 * dial them down.
 */
export async function learningMultiplierFor(
  projectId: string,
  recommendationType: string,
): Promise<number> {
  const prisma = getPrismaClient()
  const outcomes = await prisma.operatorOutcome.findMany({
    where: {
      projectId,
      memory: { recommendationType },
    },
    take: 25,
    orderBy: { createdAt: 'desc' },
  })
  if (outcomes.length === 0) return 1
  let positive = 0
  let neutral = 0
  for (const o of outcomes) {
    const totalDelta =
      (o.trafficDelta ?? 0) + (o.ctrDelta ?? 0) * 100 + (o.conversionDelta ?? 0) * 10
    if (totalDelta > 0.1) positive += 1
    else if (Math.abs(totalDelta) < 0.05) neutral += 1
  }
  // Range: 0.6 (mostly ineffective) to 1.4 (strongly effective)
  const ratio = positive / outcomes.length
  return 0.6 + ratio * 0.8
}
