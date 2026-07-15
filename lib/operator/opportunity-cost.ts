import { getPrismaClient } from '@/lib/db'

/**
 * Opportunity Cost Analysis Engine (Phase 8.2).
 *
 * For each selected candidate, calculates what gets delayed and what the
 * business impact is when other candidates cannot be worked on.
 */

export interface OpportunityCost {
  selectedCandidateId: string
  delayedCandidateId: string
  description: string
  costMagnitude: 'low' | 'medium' | 'high'
  estimatedDelay: number // days
  businessImpact: string
}

export interface OpportunityCostAnalysis {
  selectedCandidateId: string
  costs: OpportunityCost[]
  totalImpact: number // aggregate impact score
}

export async function analyzeOpportunityCost(input: {
  projectId: string
  selectedCandidateId: string
  allCandidates: Array<{
    id: string
    score: number
    trafficPotential?: number
    urgencyLevel?: 'low' | 'medium' | 'high'
  }>
  estimatedCapacity?: number // hours per week available
}): Promise<OpportunityCostAnalysis> {
  const prisma = getPrismaClient()
  const selected = input.allCandidates.find((c) => c.id === input.selectedCandidateId)

  if (!selected) {
    return {
      selectedCandidateId: input.selectedCandidateId,
      costs: [],
      totalImpact: 0,
    }
  }

  // Get organization ID from project
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  })
  if (!project) {
    throw new Error(`Project ${input.projectId} not found`)
  }

  const costs: OpportunityCost[] = []
  const capacityPerCandidate = (input.estimatedCapacity ?? 10) / 2 // work on 2 things in parallel
  let totalImpact = 0

  // Calculate costs for each delayed candidate
  for (const candidate of input.allCandidates) {
    if (candidate.id === input.selectedCandidateId) continue

    // Only analyze candidates that would realistically be worked on next
    const priorityGap = selected.score - candidate.score
    if (priorityGap > 0.4) continue // Too far behind to be relevant

    const delay = calculateDelay(input.estimatedCapacity, candidate)
    const magnitude = calculateCostMagnitude(candidate, delay)
    const impact = generateImpactStatement(candidate, delay, magnitude)

    const cost: OpportunityCost = {
      selectedCandidateId: input.selectedCandidateId,
      delayedCandidateId: candidate.id,
      description: `Delayed by ${delay} days due to resource allocation to higher-priority item`,
      costMagnitude: magnitude,
      estimatedDelay: delay,
      businessImpact: impact,
    }

    costs.push(cost)

    // Track to aggregate impact
    totalImpact += costToScore(magnitude)

    // Persist to database
    await prisma.operatorOpportunityCost.create({
      data: {
        organizationId: project.organizationId,
        projectId: input.projectId,
        selectedCandidateId: input.selectedCandidateId,
        delayedCandidateId: candidate.id,
        description: cost.description,
        costMagnitude: cost.costMagnitude,
        estimatedDelay: cost.estimatedDelay,
        businessImpact: cost.businessImpact,
      },
    })
  }

  return {
    selectedCandidateId: input.selectedCandidateId,
    costs: costs.sort((a, b) => costToScore(b.costMagnitude) - costToScore(a.costMagnitude)),
    totalImpact,
  }
}

function calculateDelay(estimatedCapacity: number | undefined, candidate: { trafficPotential?: number }): number {
  const capacity = estimatedCapacity ?? 10
  const baseDelay = Math.ceil(40 / (capacity / 2)) // hours / capacity per week

  // Adjust based on traffic potential
  const traffic = candidate.trafficPotential ?? 0.5
  if (traffic > 0.7) return Math.ceil(baseDelay * 1.5)
  if (traffic < 0.3) return Math.ceil(baseDelay * 0.75)

  return baseDelay
}

function calculateCostMagnitude(
  candidate: { trafficPotential?: number; urgencyLevel?: 'low' | 'medium' | 'high' },
  delay: number
): 'low' | 'medium' | 'high' {
  const traffic = candidate.trafficPotential ?? 0.5
  const urgency = candidate.urgencyLevel ?? 'medium'

  // High impact: high traffic + urgent + long delay
  if (traffic > 0.7 && urgency === 'high' && delay > 14) return 'high'
  if (urgency === 'high') return 'medium'

  // Medium impact: moderate traffic or time sensitivity
  if (traffic > 0.6 && delay > 7) return 'medium'
  if (traffic > 0.5) return 'medium'

  return 'low'
}

function costToScore(magnitude: 'low' | 'medium' | 'high'): number {
  const scores = { low: 1, medium: 5, high: 10 }
  return scores[magnitude]
}

function generateImpactStatement(
  candidate: { id?: string; trafficPotential?: number; urgencyLevel?: 'low' | 'medium' | 'high' },
  delay: number,
  magnitude: 'low' | 'medium' | 'high'
): string {
  const traffic = candidate.trafficPotential ?? 0.5
  const urgency = candidate.urgencyLevel ?? 'medium'

  if (magnitude === 'high') {
    return `High-impact candidate delayed ${delay} days. Expected traffic loss: ${(traffic * 100 * Math.ceil(delay / 7)).toFixed(0)}+ visits. ${urgency === 'high' ? 'Time-critical for business goals.' : ''}`
  }

  if (magnitude === 'medium') {
    return `Moderate-priority candidate pushed back ${delay} days. Potential traffic impact: ${(traffic * 100 * Math.ceil(delay / 7)).toFixed(0)} visits.`
  }

  return `Lower-priority candidate delayed ${delay} days with minimal business impact.`
}
