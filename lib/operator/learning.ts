import { getPrismaClient } from '@/lib/db'

/**
 * Learning engine (Phase 8.1A).
 *
 * Stores predicted-vs-actual outcomes and computes calibration multipliers
 * with dampening safeguards so one noisy result never drastically alters
 * global weighting.
 *
 * Learning happens at three separately-scoped levels:
 *
 *  - Global: aggregate across all projects using anonymised statistical
 *    patterns only. Nothing customer-specific ever leaves the row.
 *  - Industry: filtered by business_profile.industry.
 *  - Project: scoped to a single projectId.
 *
 * Project-scoped rows never leak into another organization because every
 * query includes projectId in the WHERE clause; global/industry aggregations
 * only summarise counts and averages, not row content.
 */

const MIN_SAMPLES_GLOBAL = 20
const MIN_SAMPLES_INDUSTRY = 10
const MIN_SAMPLES_PROJECT = 4

// Bound the effective multiplier so a small run of positive / negative
// outcomes can nudge, but not swing, the ranking.
const MULTIPLIER_MIN = 0.5
const MULTIPLIER_MAX = 1.5

interface OutcomeStats {
  samples: number
  positive: number
  negative: number
  neutral: number
  totalTraffic: number
  totalCtr: number
  totalConversion: number
}

async function collectStats(
  projectId: string | null,
  industry: string | null,
  recommendationType: string,
): Promise<OutcomeStats> {
  const prisma = getPrismaClient()
  const rows = await prisma.operatorOutcome.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      memory: { recommendationType },
      ...(industry
        ? {
            project: {
              businessProfile: { industry },
            },
          }
        : {}),
    },
    take: 250,
  })
  const stats: OutcomeStats = {
    samples: rows.length,
    positive: 0,
    negative: 0,
    neutral: 0,
    totalTraffic: 0,
    totalCtr: 0,
    totalConversion: 0,
  }
  for (const r of rows) {
    const totalDelta =
      (r.trafficDelta ?? 0) + (r.ctrDelta ?? 0) * 100 + (r.conversionDelta ?? 0) * 10
    if (totalDelta > 0.1) stats.positive += 1
    else if (totalDelta < -0.1) stats.negative += 1
    else stats.neutral += 1
    stats.totalTraffic += r.trafficDelta ?? 0
    stats.totalCtr += r.ctrDelta ?? 0
    stats.totalConversion += r.conversionDelta ?? 0
  }
  return stats
}

function ratioToMultiplier(positive: number, samples: number): number {
  if (samples === 0) return 1
  const ratio = positive / samples
  // Around 0.5 hit rate → 1.0; 0.0 → 0.6; 1.0 → 1.4
  return Math.max(MULTIPLIER_MIN, Math.min(MULTIPLIER_MAX, 0.6 + ratio * 0.8))
}

export interface CalibratedMultiplier {
  value: number
  source: 'project' | 'industry' | 'global' | 'default'
  samples: number
  positive: number
}

/**
 * Returns a calibration multiplier chosen from the most specific scope that
 * has enough samples. Falls back cleanly up the chain (project → industry →
 * global → default 1.0).
 */
export async function calibratedMultiplierFor(input: {
  projectId: string
  recommendationType: string
  industry?: string | null
}): Promise<CalibratedMultiplier> {
  const projectStats = await collectStats(input.projectId, null, input.recommendationType)
  if (projectStats.samples >= MIN_SAMPLES_PROJECT) {
    return {
      value: ratioToMultiplier(projectStats.positive, projectStats.samples),
      source: 'project',
      samples: projectStats.samples,
      positive: projectStats.positive,
    }
  }

  if (input.industry) {
    const industryStats = await collectStats(null, input.industry, input.recommendationType)
    if (industryStats.samples >= MIN_SAMPLES_INDUSTRY) {
      return {
        value: ratioToMultiplier(industryStats.positive, industryStats.samples),
        source: 'industry',
        samples: industryStats.samples,
        positive: industryStats.positive,
      }
    }
  }

  const globalStats = await collectStats(null, null, input.recommendationType)
  if (globalStats.samples >= MIN_SAMPLES_GLOBAL) {
    return {
      value: ratioToMultiplier(globalStats.positive, globalStats.samples),
      source: 'global',
      samples: globalStats.samples,
      positive: globalStats.positive,
    }
  }

  return { value: 1, source: 'default', samples: 0, positive: 0 }
}

export interface CalibrationSummary {
  recommendationType: string
  scope: 'project' | 'industry' | 'global'
  samples: number
  positiveRate: number
  averageTrafficDelta: number
  averageCtrDelta: number
  averageConversionDelta: number
  multiplier: number
}

export async function calibrationSummary(input: {
  projectId: string
  industry?: string | null
}): Promise<CalibrationSummary[]> {
  const prisma = getPrismaClient()
  const raw = await prisma.operatorOutcome.findMany({
    where: { projectId: input.projectId },
    select: { memoryId: true },
    take: 250,
  })
  const memoryIds = Array.from(new Set(raw.map((r) => r.memoryId)))
  const memories = await prisma.operatorMemory.findMany({
    where: { id: { in: memoryIds } },
    select: { id: true, recommendationType: true },
  })
  const seenTypes = new Set(memories.map((m) => m.recommendationType))
  const out: CalibrationSummary[] = []
  for (const type of seenTypes) {
    const projectStats = await collectStats(input.projectId, null, type)
    if (projectStats.samples === 0) continue
    out.push({
      recommendationType: type,
      scope: 'project',
      samples: projectStats.samples,
      positiveRate: projectStats.positive / projectStats.samples,
      averageTrafficDelta: projectStats.totalTraffic / projectStats.samples,
      averageCtrDelta: projectStats.totalCtr / projectStats.samples,
      averageConversionDelta: projectStats.totalConversion / projectStats.samples,
      multiplier: ratioToMultiplier(projectStats.positive, projectStats.samples),
    })
  }
  return out
}
