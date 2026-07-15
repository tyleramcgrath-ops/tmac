import { getPrismaClient } from '@/lib/db'
import type { ExecutionPlan } from '@prisma/client'
import { EXECUTION_TYPES } from './types'

/**
 * Preview Engine (Phase 9.1)
 *
 * Generates complete previews of execution plans before execution.
 * Shows current vs proposed state with impact assessment.
 */

export interface PreviewRequest {
  projectId: string
  executionPlanId: string
}

export interface StateSnapshot {
  url: string
  currentTitle?: string
  currentDescription?: string
  currentCanonical?: string
  currentSchema?: Record<string, unknown>
  currentContent?: string
  currentLinks?: string[]
  currentRobots?: string
  currentHeadings?: string[]
  currentImages?: Array<{ src: string; alt: string }>
}

export interface ProposedChange {
  type: string
  field: string
  currentValue: unknown
  proposedValue: unknown
  rationale?: string
  changeType: 'add' | 'update' | 'remove'
}

export interface UnifiedDiff {
  before: string
  after: string
  lineChanges: Array<{
    line: number
    type: 'add' | 'remove' | 'context'
    content: string
  }>
}

export interface ImpactAssessment {
  expectedCTRLift?: number // Expected CTR change percentage
  expectedTrafficLift?: number // Expected traffic change
  expectedRankingChange?: number // Expected ranking position change
  expectedConversionLift?: number // Expected conversion change
  expectedIndexabilityImprovement?: number // Expected indexation score change
  expectedAIReadinessImprovement?: number // Expected AI readiness score change
  affectedPages: string[] // Pages that will be affected
  affectedTopics: string[] // Related topics that will benefit
  riskFactors: string[] // Risk factors to consider
  rollbackComplexity: 'simple' | 'moderate' | 'complex'
  confidenceScore: number // 0-1 confidence in success
  estimatedTimeToSeeResults: string // e.g., "3-7 days", "2-4 weeks"
}

export interface ExecutionPreview {
  previewId: string
  executionPlanId: string
  projectId: string
  executionType: string
  status: 'ready' | 'processing' | 'error'
  error?: string

  // State information
  currentState: StateSnapshot
  proposedChanges: ProposedChange[]
  unifiedDiff?: UnifiedDiff

  // Impact assessment
  impact: ImpactAssessment

  // Metadata
  createdAt: Date
  expiresAt: Date
}

export async function generatePreview(
  request: PreviewRequest
): Promise<ExecutionPreview> {
  const prisma = getPrismaClient()

  // Get execution plan
  const plan = await prisma.executionPlan.findUnique({
    where: { id: request.executionPlanId },
  })

  if (!plan) {
    throw new Error(`Execution plan ${request.executionPlanId} not found`)
  }

  if (plan.projectId !== request.projectId) {
    throw new Error('Project mismatch')
  }

  const typeDefn = EXECUTION_TYPES[plan.executionType as keyof typeof EXECUTION_TYPES]
  if (!typeDefn) {
    throw new Error(`Unknown execution type: ${plan.executionType}`)
  }

  // Parse plan steps to understand what will change
  const steps = Array.isArray(plan.steps) ? plan.steps : JSON.parse(JSON.stringify(plan.steps))

  // Get current state (would fetch from actual page in production)
  const currentState = await getCurrentPageState(plan.pageUrl)

  // Generate proposed changes based on execution type
  const proposedChanges = generateProposedChanges(typeDefn.type, plan, currentState)

  // Create unified diff
  const diff = generateUnifiedDiff(currentState, proposedChanges)

  // Assess impact
  const impact = assessExecutionImpact(typeDefn.type, proposedChanges, plan)

  const preview: ExecutionPreview = {
    previewId: `preview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    executionPlanId: request.executionPlanId,
    projectId: request.projectId,
    executionType: plan.executionType,
    status: 'ready',

    currentState,
    proposedChanges,
    unifiedDiff: diff,

    impact,

    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }

  return preview
}

async function getCurrentPageState(pageUrl: string): Promise<StateSnapshot> {
  // In production, this would fetch the actual page and parse its state
  // For now, return a skeleton
  return {
    url: pageUrl,
    currentTitle: undefined,
    currentDescription: undefined,
    currentCanonical: undefined,
    currentSchema: undefined,
    currentContent: undefined,
    currentLinks: [],
    currentRobots: undefined,
    currentHeadings: [],
    currentImages: [],
  }
}

function generateProposedChanges(
  executionType: string,
  plan: ExecutionPlan,
  currentState: StateSnapshot
): ProposedChange[] {
  const changes: ProposedChange[] = []

  const expectedOutputs = plan.expectedOutputs as Record<string, unknown> | null

  // Based on execution type, extract proposed changes from plan
  switch (executionType) {
    case 'update_seo_title':
      if (expectedOutputs?.['newTitle']) {
        changes.push({
          type: 'metadata',
          field: 'title',
          currentValue: currentState.currentTitle,
          proposedValue: expectedOutputs['newTitle'],
          rationale: plan.description || undefined,
          changeType: 'update',
        })
      }
      break

    case 'update_meta_description':
      if (expectedOutputs?.['newDescription']) {
        changes.push({
          type: 'metadata',
          field: 'meta_description',
          currentValue: currentState.currentDescription,
          proposedValue: expectedOutputs['newDescription'],
          rationale: plan.description || undefined,
          changeType: 'update',
        })
      }
      break

    case 'update_canonical':
      if (expectedOutputs?.['canonicalUrl']) {
        changes.push({
          type: 'technical',
          field: 'canonical',
          currentValue: currentState.currentCanonical,
          proposedValue: expectedOutputs['canonicalUrl'],
          rationale: plan.description || undefined,
          changeType: 'update',
        })
      }
      break

    case 'add_schema':
      if (expectedOutputs?.['schema']) {
        changes.push({
          type: 'schema',
          field: 'schema_markup',
          currentValue: currentState.currentSchema,
          proposedValue: expectedOutputs['schema'],
          rationale: plan.description || undefined,
          changeType: 'add',
        })
      }
      break

    case 'add_internal_links':
      if (expectedOutputs?.['links']) {
        changes.push({
          type: 'content',
          field: 'internal_links',
          currentValue: currentState.currentLinks,
          proposedValue: expectedOutputs['links'],
          rationale: plan.description || undefined,
          changeType: 'add',
        })
      }
      break
  }

  return changes
}

function generateUnifiedDiff(
  currentState: StateSnapshot,
  changes: ProposedChange[]
): UnifiedDiff {
  const beforeLines = [`--- Current State (${currentState.url})`]
  const afterLines = [`+++ Proposed Changes`]

  for (const change of changes) {
    beforeLines.push(`${change.field}: ${JSON.stringify(change.currentValue)}`)
    afterLines.push(`${change.field}: ${JSON.stringify(change.proposedValue)}`)
  }

  const before = beforeLines.join('\n')
  const after = afterLines.join('\n')

  // Simple line change detection
  const lineChanges: UnifiedDiff['lineChanges'] = []
  const beforeLinesArr = before.split('\n')
  const afterLinesArr = after.split('\n')

  // Add header lines
  lineChanges.push({ line: 1, type: 'context', content: beforeLinesArr[0] })
  lineChanges.push({ line: 2, type: 'context', content: afterLinesArr[0] })

  // Add changed lines
  for (let i = 1; i < beforeLinesArr.length; i++) {
    if (i < afterLinesArr.length && beforeLinesArr[i] !== afterLinesArr[i]) {
      lineChanges.push({ line: i + 1, type: 'remove', content: beforeLinesArr[i] })
      lineChanges.push({ line: i + 2, type: 'add', content: afterLinesArr[i] })
    }
  }

  return { before, after, lineChanges }
}

function assessExecutionImpact(
  executionType: string,
  changes: ProposedChange[],
  plan: ExecutionPlan
): ImpactAssessment {
  const typeDefn = EXECUTION_TYPES[executionType as keyof typeof EXECUTION_TYPES]

  // Base impact estimates by execution type
  const impactMap: Record<string, Partial<ImpactAssessment>> = {
    update_seo_title: {
      expectedCTRLift: 5, // 5% CTR lift from better title
      expectedRankingChange: 0.5, // Slight ranking improvement
      affectedPages: [plan.pageUrl],
      riskFactors: ['keyword_relevance', 'character_length'],
      rollbackComplexity: 'simple',
      confidenceScore: 0.85,
      estimatedTimeToSeeResults: '3-7 days',
    },
    update_meta_description: {
      expectedCTRLift: 3, // 3% CTR lift from better description
      affectedPages: [plan.pageUrl],
      riskFactors: ['description_clarity'],
      rollbackComplexity: 'simple',
      confidenceScore: 0.8,
      estimatedTimeToSeeResults: '3-7 days',
    },
    update_canonical: {
      expectedRankingChange: 1, // Consolidation benefit
      affectedPages: [plan.pageUrl],
      riskFactors: ['canonical_chain', 'content_similarity'],
      rollbackComplexity: 'moderate',
      confidenceScore: 0.75,
      estimatedTimeToSeeResults: '2-4 weeks',
    },
    add_schema: {
      expectedCTRLift: 8, // Rich results lift
      expectedRankingChange: 0.3,
      expectedAIReadinessImprovement: 0.2,
      affectedPages: [plan.pageUrl],
      affectedTopics: [], // Would determine from content analysis
      riskFactors: ['schema_validity', 'structured_data_correctness'],
      rollbackComplexity: 'simple',
      confidenceScore: 0.9,
      estimatedTimeToSeeResults: '1-2 weeks',
    },
    add_internal_links: {
      expectedTrafficLift: 3,
      expectedRankingChange: 0.5,
      affectedPages: [plan.pageUrl],
      affectedTopics: [],
      riskFactors: ['anchor_text_relevance', 'link_context'],
      rollbackComplexity: 'simple',
      confidenceScore: 0.8,
      estimatedTimeToSeeResults: '2-4 weeks',
    },
    update_content: {
      expectedRankingChange: 2,
      expectedTrafficLift: 10,
      affectedPages: [plan.pageUrl],
      affectedTopics: [],
      riskFactors: ['content_quality', 'keyword_fit', 'user_engagement'],
      rollbackComplexity: 'complex',
      confidenceScore: 0.7,
      estimatedTimeToSeeResults: '3-8 weeks',
    },
  }

  const baseImpact = impactMap[executionType as keyof typeof impactMap] || {}

  return {
    expectedCTRLift: baseImpact.expectedCTRLift || 0,
    expectedTrafficLift: baseImpact.expectedTrafficLift || 0,
    expectedRankingChange: baseImpact.expectedRankingChange || 0,
    expectedConversionLift: baseImpact.expectedConversionLift || 0,
    expectedIndexabilityImprovement: baseImpact.expectedIndexabilityImprovement || 0,
    expectedAIReadinessImprovement: baseImpact.expectedAIReadinessImprovement || 0,
    affectedPages: baseImpact.affectedPages || [plan.pageUrl],
    affectedTopics: baseImpact.affectedTopics || [],
    riskFactors: baseImpact.riskFactors || [],
    rollbackComplexity: baseImpact.rollbackComplexity || 'moderate',
    confidenceScore:
      baseImpact.confidenceScore ||
      (typeDefn.risk === 'low' ? 0.85 : typeDefn.risk === 'medium' ? 0.7 : 0.5),
    estimatedTimeToSeeResults: baseImpact.estimatedTimeToSeeResults || '1-4 weeks',
  }
}
