import { getPrismaClient } from '@/lib/db'

/**
 * Consultant Review Engine (Phase 8.2).
 *
 * Generates three alternative strategies (fastest_roi, long_term_authority, lowest_risk)
 * each with its own step-by-step action plan and expected outcomes.
 */

export interface Strategy {
  strategyType: 'fastest_roi' | 'long_term_authority' | 'lowest_risk'
  headline: string
  steps: string[]
  expectedROI?: number
  timelineWeeks?: number
  riskLevel: 'low' | 'medium' | 'high'
  rationale: string
  isRecommended: boolean
}

export interface ConsultantReview {
  projectId: string
  strategies: Strategy[]
  recommendation: 'fastest_roi' | 'long_term_authority' | 'lowest_risk'
}

export async function executeConsultantReview(input: {
  projectId: string
  shortlist: Array<{
    id: string
    score: number
  }>
  businessContext?: {
    industry?: string
    goals?: string[]
    constraints?: string[]
    budget?: number
    timeline?: string
  }
}): Promise<ConsultantReview> {
  const prisma = getPrismaClient()

  // Generate three distinct strategies
  const strategies: Strategy[] = [
    generateFastestROIStrategy(input),
    generateLongTermAuthorityStrategy(input),
    generateLowestRiskStrategy(input),
  ]

  // Determine recommendation based on context
  const recommendation = selectRecommendedStrategy(input.businessContext, strategies)

  // Mark recommended strategy
  for (const strategy of strategies) {
    strategy.isRecommended = strategy.strategyType === recommendation
  }

  // Get organization ID from project
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  })
  if (!project) {
    throw new Error(`Project ${input.projectId} not found`)
  }

  // Persist strategies to database
  for (const strategy of strategies) {
    await prisma.operatorStrategy.create({
      data: {
        organizationId: project.organizationId,
        projectId: input.projectId,
        candidateId: input.shortlist[0]?.id ?? 'unknown',
        strategyType: strategy.strategyType,
        headline: strategy.headline,
        steps: strategy.steps,
        expectedROI: strategy.expectedROI ?? 0,
        timelineWeeks: strategy.timelineWeeks ?? 0,
        riskLevel: strategy.riskLevel,
        rationale: strategy.rationale,
        isRecommended: strategy.isRecommended,
      },
    })
  }

  return {
    projectId: input.projectId,
    strategies,
    recommendation,
  }
}

function generateFastestROIStrategy(input: {
  shortlist: Array<{ id: string; score: number }>
  businessContext?: { goals?: string[]; timeline?: string }
}): Strategy {
  return {
    strategyType: 'fastest_roi',
    headline: 'Maximum ROI in 4 Weeks',
    steps: [
      'Focus on top 3 highest-scoring candidates',
      'Accelerate content production for quick launch',
      'Monitor CTR and conversion metrics daily',
      'Rapidly scale what works, pause underperformers',
      'Plan iteration cycles at weekly intervals',
    ],
    expectedROI: 35,
    timelineWeeks: 4,
    riskLevel: 'high',
    rationale:
      'Prioritizes immediate results by concentrating resources on proven high-performers. Best when quick wins are critical.',
    isRecommended: false,
  }
}

function generateLongTermAuthorityStrategy(input: {
  shortlist: Array<{ id: string; score: number }>
  businessContext?: { goals?: string[]; timeline?: string }
}): Strategy {
  return {
    strategyType: 'long_term_authority',
    headline: 'Establish Authority Over 12 Weeks',
    steps: [
      'Build systematic coverage across all shortlist items',
      'Invest in deep, authoritative content pieces',
      'Develop thematic connections between topics',
      'Cultivate organic backlinks and references',
      'Create evergreen content assets for long-term traffic',
    ],
    expectedROI: 125,
    timelineWeeks: 12,
    riskLevel: 'low',
    rationale:
      'Focuses on sustainable authority and brand positioning. Best when brand strength and long-term value matter more than immediate revenue.',
    isRecommended: false,
  }
}

function generateLowestRiskStrategy(input: {
  shortlist: Array<{ id: string; score: number }>
  businessContext?: { goals?: string[]; timeline?: string }
}): Strategy {
  return {
    strategyType: 'lowest_risk',
    headline: 'Tested Playbook with Proven Steps',
    steps: [
      'Start with 5 lowest-risk, highest-confidence candidates',
      'Use proven content frameworks from past successes',
      'Maintain strict quality gates before publishing',
      'Test with small traffic segments first',
      'Expand only after performance validation',
    ],
    expectedROI: 65,
    timelineWeeks: 8,
    riskLevel: 'low',
    rationale:
      'Emphasizes proven methodologies and incremental scaling. Best when portfolio risk is constrained or recovery time is limited.',
    isRecommended: false,
  }
}

function selectRecommendedStrategy(
  businessContext: { goals?: string[]; timeline?: string; budget?: number } | undefined,
  strategies: Strategy[]
): 'fastest_roi' | 'long_term_authority' | 'lowest_risk' {
  // Default recommendation: lowest risk
  if (!businessContext) return 'lowest_risk'

  const timeline = businessContext.timeline?.toLowerCase()
  const goals = businessContext.goals ?? []

  // If immediate results are needed, recommend fastest ROI
  if (timeline && (timeline.includes('urgent') || timeline.includes('week'))) {
    return 'fastest_roi'
  }

  // If long-term growth is emphasized, recommend authority strategy
  if (
    goals.some((g) => g.toLowerCase().includes('authority')) ||
    goals.some((g) => g.toLowerCase().includes('brand'))
  ) {
    return 'long_term_authority'
  }

  // Default to lowest risk
  return 'lowest_risk'
}
