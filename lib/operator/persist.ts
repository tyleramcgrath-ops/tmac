import { getPrismaClient } from '@/lib/db'
import type { ConsolidatedCandidate, ConsolidationResult } from './consolidate'

/**
 * Persistence layer for consolidated Operator candidates. Writes one row per
 * dedupeKey — upserts on subsequent runs so evidence and lastRecalculatedAt
 * stay fresh without losing memory associations.
 */

export interface PersistOptions {
  organizationId: string
  projectId: string
}

function categoryOf(actionType: string): string {
  if (actionType === 'money_page_reinforcement') return 'money_page'
  if (actionType.includes('faq_schema') || actionType.includes('schema')) return 'schema'
  if (actionType.includes('entity')) return 'authority'
  if (actionType.includes('cluster')) return 'authority'
  if (actionType.includes('internal_links') || actionType.startsWith('link_to')) return 'internal_link'
  if (actionType.startsWith('decay::')) return 'decay'
  if (actionType.startsWith('close_gap::')) return 'content_gap'
  return 'technical'
}

/**
 * Upserts the entire consolidated batch. Rows that no longer appear in the
 * incoming batch are moved to `expired` rather than deleted so we preserve
 * the memory linkage.
 */
export async function persistConsolidated(
  opts: PersistOptions,
  result: ConsolidationResult,
): Promise<{ persisted: number; expired: number; conflicts: number }> {
  const prisma = getPrismaClient()
  const keptDedupeKeys = new Set<string>()

  let persisted = 0
  for (const c of result.consolidated) {
    keptDedupeKeys.add(c.dedupeKey)
    await prisma.operatorCandidate.upsert({
      where: { projectId_dedupeKey: { projectId: opts.projectId, dedupeKey: c.dedupeKey } },
      create: {
        organizationId: opts.organizationId,
        projectId: opts.projectId,
        sourceSystem: c.source,
        sourceRecordId: c.id,
        category: categoryOf(c.recommendationType),
        actionType: c.recommendationType,
        primaryPageUrl: c.pageUrl,
        affectedPageUrls: [c.pageUrl],
        evidence: JSON.parse(JSON.stringify(c.evidence)) as any,
        decisionScores: JSON.parse(
          JSON.stringify({ rawScore: c.rawScore, confidence: c.confidence, ...c.metadata }),
        ) as any,
        estimatedMinutes: c.estimatedMinutes,
        confidence: c.confidence,
        dedupeKey: c.dedupeKey,
        consolidatedFrom: c.consolidatedFrom,
        status: 'new',
      },
      update: {
        evidence: JSON.parse(JSON.stringify(c.evidence)) as any,
        decisionScores: JSON.parse(
          JSON.stringify({ rawScore: c.rawScore, confidence: c.confidence, ...c.metadata }),
        ) as any,
        estimatedMinutes: c.estimatedMinutes,
        confidence: c.confidence,
        consolidatedFrom: c.consolidatedFrom,
        lastRecalculatedAt: new Date(),
      },
    })
    persisted++
  }

  // Expire rows that weren't produced this run.
  const stale = await prisma.operatorCandidate.findMany({
    where: {
      projectId: opts.projectId,
      status: { notIn: ['expired', 'superseded'] },
      dedupeKey: { notIn: Array.from(keptDedupeKeys) },
    },
    select: { id: true },
  })
  let expired = 0
  if (stale.length) {
    await prisma.operatorCandidate.updateMany({
      where: { id: { in: stale.map((r) => r.id) } },
      data: { status: 'expired', expiresAt: new Date() },
    })
    expired = stale.length
  }

  return { persisted, expired, conflicts: result.conflicts.length }
}

/// Helper to look up a consolidated candidate id from a memoryKey.
export async function findPersistedByDedupeKey(projectId: string, dedupeKey: string) {
  const prisma = getPrismaClient()
  return prisma.operatorCandidate.findUnique({
    where: { projectId_dedupeKey: { projectId, dedupeKey } },
  })
}
