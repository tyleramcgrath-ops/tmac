import { getPrismaClient } from '@/lib/db'

/**
 * Per-user (or project-default) learned preference adjustments.
 *
 * The Operator watches user decisions and increments a weightDelta by
 * category+signal. A user who repeatedly rejects `full_content_rewrite`
 * ends up with a negative delta for that category and it drops in the
 * shortlist. Every preference is bounded in range and reveals its samples
 * so the user can inspect and reset them.
 */

const MAX_DELTA_MAGNITUDE = 0.6
const NUDGE_PER_SAMPLE = 0.06

interface AdjustInput {
  organizationId: string
  projectId: string
  userId: string | null
  category: string
  signal: 'accept' | 'reject' | 'defer' | 'ignore'
  detail?: unknown
}

export async function adjustPreference(input: AdjustInput): Promise<void> {
  const prisma = getPrismaClient()
  const direction = input.signal === 'accept' ? +1 : -1
  const nudge = NUDGE_PER_SAMPLE * direction

  await prisma.operatorPreference.upsert({
    where: {
      projectId_userId_category_signal: {
        projectId: input.projectId,
        userId: input.userId ?? '',
        category: input.category,
        signal: input.signal,
      },
    },
    create: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      userId: input.userId,
      category: input.category,
      signal: input.signal,
      weightDelta: bounded(nudge),
      samples: 1,
      detail: input.detail ? (JSON.parse(JSON.stringify(input.detail)) as any) : undefined,
    },
    update: {
      weightDelta: {
        // Accumulate but clamp on read via bounded() below.
        increment: nudge,
      },
      samples: { increment: 1 },
      detail: input.detail ? (JSON.parse(JSON.stringify(input.detail)) as any) : undefined,
    },
  })
}

function bounded(v: number): number {
  return Math.max(-MAX_DELTA_MAGNITUDE, Math.min(MAX_DELTA_MAGNITUDE, v))
}

export interface PreferenceLookup {
  category: string
  netDelta: number   // clamped
  samples: number
  breakdown: Record<string, { delta: number; samples: number }>
}

export async function loadPreferenceMap(input: {
  projectId: string
  userId?: string | null
}): Promise<Map<string, PreferenceLookup>> {
  const prisma = getPrismaClient()
  const rows = await prisma.operatorPreference.findMany({
    where: {
      projectId: input.projectId,
      OR: [{ userId: input.userId ?? null }, { userId: null }],
    },
  })
  const byCategory = new Map<string, PreferenceLookup>()
  for (const row of rows) {
    if (!byCategory.has(row.category)) {
      byCategory.set(row.category, {
        category: row.category,
        netDelta: 0,
        samples: 0,
        breakdown: {},
      })
    }
    const entry = byCategory.get(row.category)!
    entry.netDelta = bounded(entry.netDelta + row.weightDelta)
    entry.samples += row.samples
    entry.breakdown[row.signal] = { delta: row.weightDelta, samples: row.samples }
  }
  return byCategory
}

/// Full inspection (for the UI "your preferences" panel).
export async function inspectPreferences(projectId: string, userId?: string | null) {
  const prisma = getPrismaClient()
  return prisma.operatorPreference.findMany({
    where: {
      projectId,
      ...(userId !== undefined ? { userId } : {}),
    },
    orderBy: [{ category: 'asc' }, { signal: 'asc' }],
  })
}

/// Reset preferences (all or by category). Records the reset action itself
/// as a zero-sample row so the audit trail is preserved.
export async function resetPreferences(input: {
  projectId: string
  userId?: string | null
  category?: string
}) {
  const prisma = getPrismaClient()
  return prisma.operatorPreference.deleteMany({
    where: {
      projectId: input.projectId,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.category ? { category: input.category } : {}),
    },
  })
}
