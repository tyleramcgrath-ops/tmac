import { getPrismaClient } from '@/lib/db'

/**
 * Why-Not Analysis Engine (Phase 8.2).
 *
 * For each selected candidate, explains why competing options were not chosen.
 * Tracks the magnitude of the decision gap to show how close alternatives were.
 */

export type WhyNotReason =
  | 'lower_content_quality'
  | 'less_relevant'
  | 'weaker_evidence'
  | 'poor_timing'
  | 'higher_volatility'
  | 'audience_mismatch'
  | 'low_traffic_potential'
  | 'recent_coverage'
  | 'contextual_misfit'

export interface WhyNotEntry {
  selectedCandidateId: string
  rejectedCandidateId: string
  reason: WhyNotReason
  explanation: string
  magnitude: number // score difference (0-1)
}

export interface WhyNotAnalysis {
  selectedCandidateId: string
  alternatives: WhyNotEntry[]
}

export async function generateWhyNotAnalysis(input: {
  projectId: string
  selectedCandidateId: string
  allCandidates: Array<{
    id: string
    score: number
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: Date
  }>
}): Promise<WhyNotAnalysis> {
  const prisma = getPrismaClient()
  const selected = input.allCandidates.find((c) => c.id === input.selectedCandidateId)

  if (!selected) {
    return {
      selectedCandidateId: input.selectedCandidateId,
      alternatives: [],
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

  const alternatives: WhyNotEntry[] = []

  for (const candidate of input.allCandidates) {
    if (candidate.id === input.selectedCandidateId) continue

    const magnitude = Math.max(0, selected.score - candidate.score)
    if (magnitude < 0.05) continue // Only explain meaningful gaps

    const reason = determineReason(selected, candidate)
    const explanation = explainReason(selected, candidate, reason)

    const whyNotEntry: WhyNotEntry = {
      selectedCandidateId: input.selectedCandidateId,
      rejectedCandidateId: candidate.id,
      reason,
      explanation,
      magnitude,
    }

    alternatives.push(whyNotEntry)

    // Persist to database
    await prisma.operatorWhyNot.create({
      data: {
        organizationId: project.organizationId,
        projectId: input.projectId,
        selectedCandidateId: input.selectedCandidateId,
        rejectedCandidateId: candidate.id,
        reason,
        explanation,
        magnitude,
      },
    })
  }

  return {
    selectedCandidateId: input.selectedCandidateId,
    alternatives: alternatives.sort((a, b) => b.magnitude - a.magnitude),
  }
}

function determineReason(
  selected: {
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: Date
  },
  rejected: {
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: Date
  }
): WhyNotReason {
  // Determine the primary reason by comparing key dimensions
  const qualityDiff = (selected.contentQuality ?? 0.5) - (rejected.contentQuality ?? 0.5)
  const relevanceDiff = (selected.relevanceScore ?? 0.5) - (rejected.relevanceScore ?? 0.5)
  const evidenceDiff = (selected.evidenceStrength ?? 0.5) - (rejected.evidenceStrength ?? 0.5)
  const trafficDiff = (selected.trafficPotential ?? 0.5) - (rejected.trafficPotential ?? 0.5)

  if (qualityDiff > 0.2) return 'lower_content_quality'
  if (relevanceDiff > 0.25) return 'less_relevant'
  if (evidenceDiff > 0.2) return 'weaker_evidence'
  if (trafficDiff > 0.25) return 'low_traffic_potential'

  // Check recency
  const selectedRecency = selected.lastCovered ? Date.now() - selected.lastCovered.getTime() : Infinity
  const rejectedRecency = rejected.lastCovered ? Date.now() - rejected.lastCovered.getTime() : Infinity
  if (selectedRecency > rejectedRecency * 1.5) return 'recent_coverage'

  return 'contextual_misfit'
}

function explainReason(
  selected: {
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: Date
    id?: string
  },
  rejected: {
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: Date
    id?: string
  },
  reason: WhyNotReason
): string {
  const explanations: Record<WhyNotReason, string> = {
    lower_content_quality: `Selected candidate has higher content quality (${((selected.contentQuality ?? 0.5) * 100).toFixed(0)}% vs ${((rejected.contentQuality ?? 0.5) * 100).toFixed(0)}%)`,
    less_relevant: `Selected candidate is more contextually relevant (${((selected.relevanceScore ?? 0.5) * 100).toFixed(0)}% vs ${((rejected.relevanceScore ?? 0.5) * 100).toFixed(0)}%)`,
    weaker_evidence: `Selected candidate has stronger backing evidence (${((selected.evidenceStrength ?? 0.5) * 100).toFixed(0)}% vs ${((rejected.evidenceStrength ?? 0.5) * 100).toFixed(0)}%)`,
    poor_timing: 'Selected candidate has better timing alignment for current goals',
    higher_volatility: 'Rejected candidate shows higher volatility in recent performance',
    audience_mismatch: 'Selected candidate better aligns with target audience characteristics',
    low_traffic_potential: `Selected candidate has higher traffic potential (${((selected.trafficPotential ?? 0.5) * 100).toFixed(0)}% vs ${((rejected.trafficPotential ?? 0.5) * 100).toFixed(0)}%)`,
    recent_coverage: `Selected candidate has not been covered as recently, maximizing freshness impact`,
    contextual_misfit: 'Selected candidate provides better contextual fit for current business objectives',
  }

  return explanations[reason]
}
