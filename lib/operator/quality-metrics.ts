import { getPrismaClient } from '@/lib/db'

/**
 * Quality Metrics Engine (Phase 8.2).
 *
 * Tracks operator performance across 8 key dimensions:
 *  - recommendation_accuracy: CTR/conversion lift from selected candidates
 *  - coverage_breadth: % of available candidates included in output
 *  - decision_confidence: average confidence score of recommendations
 *  - evidence_quality: avg quality of supporting evidence
 *  - tier_distribution: balance across primary/next-best/watch/deferred
 *  - conflict_resolution: how well competing recommendations are handled
 *  - learning_velocity: how quickly model adapts to feedback
 *  - business_impact: weighted revenue impact
 */

export type MetricType =
  | 'recommendation_accuracy'
  | 'coverage_breadth'
  | 'decision_confidence'
  | 'evidence_quality'
  | 'tier_distribution'
  | 'conflict_resolution'
  | 'learning_velocity'
  | 'business_impact'

export type TimePeriod = 'week' | 'month' | 'quarter' | 'all_time'

export interface QualityMetric {
  metricType: MetricType
  value: number // typically 0-1 or 0-100 depending on metric
  samples: number
  period: TimePeriod
}

export interface QualityMetricsReport {
  organizationId: string
  metrics: QualityMetric[]
  summary: {
    overallScore: number
    improvingMetrics: MetricType[]
    declineMetrics: MetricType[]
  }
}

export async function trackQualityMetric(input: {
  organizationId: string
  projectId?: string
  metricType: MetricType
  value: number
  samples: number
  period: TimePeriod
}): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.operatorQualityMetric.create({
    data: {
      organizationId: input.organizationId,
      metricType: input.metricType,
      value: input.value,
      samples: input.samples,
      period: input.period,
    },
  })
}

export async function calculateRecommendationAccuracy(input: {
  projectId: string
  recommendations: string[]
  outcomes: Array<{
    candidateId: string
    trafficLift?: number
    conversionLift?: number
  }>
  period: TimePeriod
}): Promise<number> {
  if (input.recommendations.length === 0) return 0

  let successCount = 0

  for (const rec of input.recommendations) {
    const outcome = input.outcomes.find((o) => o.candidateId === rec)
    if (outcome) {
      const totalLift = (outcome.trafficLift ?? 0) + (outcome.conversionLift ?? 0) * 2
      if (totalLift > 0) successCount += 1
    }
  }

  return successCount / input.recommendations.length
}

export async function calculateCoverageBreadth(input: {
  projectId: string
  shortlistSize: number
  totalCandidates: number
}): Promise<number> {
  if (input.totalCandidates === 0) return 0
  return input.shortlistSize / input.totalCandidates
}

export async function calculateDecisionConfidence(input: {
  projectId: string
  recommendations: Array<{
    candidateId: string
    confidenceScore: number
  }>
}): Promise<number> {
  if (input.recommendations.length === 0) return 0.5

  const avg = input.recommendations.reduce((sum, r) => sum + r.confidenceScore, 0) / input.recommendations.length

  return Math.min(1, avg)
}

export async function calculateEvidenceQuality(input: {
  projectId: string
  recommendations: Array<{
    candidateId: string
    evidenceQuality: number
  }>
}): Promise<number> {
  if (input.recommendations.length === 0) return 0.5

  const avg = input.recommendations.reduce((sum, r) => sum + r.evidenceQuality, 0) / input.recommendations.length

  return Math.min(1, avg)
}

export async function calculateTierDistribution(input: {
  projectId: string
  primaryMission?: number
  nextBest?: number
  watch?: number
  deferred?: number
}): Promise<number> {
  const total = (input.primaryMission ?? 0) + (input.nextBest ?? 0) + (input.watch ?? 0) + (input.deferred ?? 0)

  if (total === 0) return 0.5

  // Ideal distribution: 1 primary, 2-3 next-best, 2-3 watch, 2-3 deferred
  const ideal = {
    primaryMission: 1 / total,
    nextBest: 2.5 / total,
    watch: 2.5 / total,
    deferred: 2.5 / total,
  }

  const actual = {
    primaryMission: (input.primaryMission ?? 0) / total,
    nextBest: (input.nextBest ?? 0) / total,
    watch: (input.watch ?? 0) / total,
    deferred: (input.deferred ?? 0) / total,
  }

  // Calculate distribution alignment (inverse of variance from ideal)
  let variance = 0
  variance += Math.abs(actual.primaryMission - ideal.primaryMission)
  variance += Math.abs(actual.nextBest - ideal.nextBest)
  variance += Math.abs(actual.watch - ideal.watch)
  variance += Math.abs(actual.deferred - ideal.deferred)

  return Math.max(0, 1 - variance / 2)
}

export async function calculateConflictResolution(input: {
  projectId: string
  conflictsCaught?: number
  conflictsTotal?: number
}): Promise<number> {
  const total = input.conflictsTotal ?? input.conflictsCaught ?? 0

  if (total === 0) return 1 // No conflicts = perfect resolution

  return Math.min(1, (input.conflictsCaught ?? 0) / total)
}

export async function calculateLearningVelocity(input: {
  projectId: string
  previousMetric?: number
  currentMetric: number
  weeksObserved: number
}): Promise<number> {
  if (!input.previousMetric || input.weeksObserved === 0) return 0.5

  // Measure improvement rate per week
  const improvement = input.currentMetric - input.previousMetric
  const weeklyChange = improvement / input.weeksObserved

  // Normalize: 0.05 points per week = 1.0 velocity
  return Math.max(0, Math.min(1, 0.5 + weeklyChange * 10))
}

export async function calculateBusinessImpact(input: {
  projectId: string
  trafficGain?: number
  conversionGain?: number
  revenueGain?: number
  estimatedValue?: number
}): Promise<number> {
  const traffic = input.trafficGain ?? 0
  const conversion = input.conversionGain ?? 0
  const revenue = input.revenueGain ?? input.estimatedValue ?? 0

  // Normalize to 0-1 scale (assuming ~1000 visits and $0.50-2 per conversion is target)
  const trafficScore = Math.min(1, traffic / 1000)
  const conversionScore = Math.min(1, conversion / 50)
  const revenueScore = Math.min(1, revenue / 500)

  return (trafficScore + conversionScore + revenueScore) / 3
}

export async function getQualityMetricsReport(input: {
  organizationId: string
  period: TimePeriod
}): Promise<QualityMetricsReport> {
  const prisma = getPrismaClient()

  const metrics = await prisma.operatorQualityMetric.findMany({
    where: {
      organizationId: input.organizationId,
      period: input.period,
    },
  })

  // Calculate summary scores
  const metricValues = new Map<string, number[]>()

  for (const metric of metrics) {
    if (!metricValues.has(metric.metricType)) {
      metricValues.set(metric.metricType, [])
    }
    metricValues.get(metric.metricType)!.push(metric.value)
  }

  const averageValues = new Map<string, number>()
  for (const [type, values] of metricValues.entries()) {
    averageValues.set(type, values.reduce((a, b) => a + b, 0) / values.length)
  }

  const overallScore =
    Array.from(averageValues.values()).reduce((a, b) => a + b, 0) / Math.max(1, averageValues.size)

  // Placeholder improvement tracking (would compare to previous period in real implementation)
  const improvingMetrics: MetricType[] = []
  const declineMetrics: MetricType[] = []

  return {
    organizationId: input.organizationId,
    metrics: metrics as QualityMetric[],
    summary: {
      overallScore,
      improvingMetrics,
      declineMetrics,
    },
  }
}
