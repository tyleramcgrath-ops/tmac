import { getPrismaClient } from '@/lib/db'

/**
 * Execution Plan Generator (Phase 9.0).
 *
 * Converts recommendations into executable step-by-step workflows with
 * estimated time, risk, ROI, and rollback strategies.
 */

export interface ExecutionStep {
  order: number
  title: string
  description: string
  action: string // e.g., 'update_title', 'add_schema', 'deploy_change'
  expectedInputs?: Record<string, unknown>
  expectedOutputs?: Record<string, unknown>
}

export interface ExecutionPlanInput {
  projectId: string
  pageUrl: string
  title: string
  description?: string
  executionType:
    | 'update_title'
    | 'add_schema'
    | 'improve_links'
    | 'create_section'
    | 'refresh_content'
    | 'repair_canonical'
    | 'repair_redirect'
    | 'merge_content'
    | 'add_images'
    | 'improve_headings'
    | 'custom'
  recommendationId?: string
  businessContext?: {
    expectedROI?: number
    timeline?: string
    priority?: 'low' | 'medium' | 'high'
  }
}

export interface ExecutionPlanResult {
  planId: string
  projectId: string
  pageUrl: string
  title: string
  executionType: string
  steps: ExecutionStep[]
  estimatedTimeMinutes: number
  estimatedRiskLevel: 'low' | 'medium' | 'high'
  expectedROI: number
  expectedConfidence: number
  rollbackStrategy: string
  approvalPolicy: string
}

export async function generateExecutionPlan(input: ExecutionPlanInput): Promise<ExecutionPlanResult> {
  const prisma = getPrismaClient()

  // Get project organization
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  })
  if (!project) {
    throw new Error(`Project ${input.projectId} not found`)
  }

  // Generate steps based on execution type
  const steps = generateSteps(input.executionType, input.pageUrl)

  // Estimate time, risk, and ROI
  const timeEstimate = estimateTime(input.executionType, steps.length)
  const riskLevel = estimateRisk(input.executionType)
  const roi = input.businessContext?.expectedROI ?? estimateROI(input.executionType)
  const confidence = estimateConfidence(input.executionType, riskLevel)

  // Determine rollback strategy
  const rollbackStrategy = determineRollbackStrategy(input.executionType)

  // Determine approval policy based on risk
  const approvalPolicy = determineApprovalPolicy(riskLevel, input.businessContext?.priority)

  // Create execution plan in database
  const plan = await prisma.executionPlan.create({
    data: {
      organizationId: project.organizationId,
      projectId: input.projectId,
      recommendationId: input.recommendationId,
      title: input.title,
      description: input.description,
      executionType: input.executionType,
      pageUrl: input.pageUrl,
      steps: JSON.parse(JSON.stringify(steps)),
      expectedInputs: {},
      expectedOutputs: {},
      dependencies: [],
      rollbackStrategy,
      estimatedTimeMinutes: timeEstimate,
      estimatedRiskLevel: riskLevel,
      expectedROI: roi,
      expectedConfidence: confidence,
      approvalPolicy,
      status: 'draft',
    },
  })

  return {
    planId: plan.id,
    projectId: input.projectId,
    pageUrl: input.pageUrl,
    title: input.title,
    executionType: input.executionType,
    steps,
    estimatedTimeMinutes: timeEstimate,
    estimatedRiskLevel: riskLevel,
    expectedROI: roi,
    expectedConfidence: confidence,
    rollbackStrategy,
    approvalPolicy,
  }
}

function generateSteps(executionType: string, pageUrl: string): ExecutionStep[] {
  const baseSteps: Record<string, ExecutionStep[]> = {
    update_title: [
      { order: 1, title: 'Review current title', description: 'Fetch and display current page title', action: 'fetch_page' },
      { order: 2, title: 'Generate replacement', description: 'Create optimized title', action: 'generate_title' },
      { order: 3, title: 'Preview change', description: 'Show before/after comparison', action: 'preview_change' },
      { order: 4, title: 'Apply update', description: 'Update title in CMS/WordPress', action: 'update_title' },
      { order: 5, title: 'Verify change', description: 'Confirm update was applied', action: 'verify_change' },
    ],
    add_schema: [
      { order: 1, title: 'Analyze content', description: 'Extract entities and structure', action: 'analyze_content' },
      { order: 2, title: 'Generate schema', description: 'Create appropriate schema.org markup', action: 'generate_schema' },
      { order: 3, title: 'Validate schema', description: 'Check schema validity', action: 'validate_schema' },
      { order: 4, title: 'Apply schema', description: 'Inject schema into page', action: 'apply_schema' },
      { order: 5, title: 'Verify in GSC', description: 'Confirm schema appears in Search Console', action: 'verify_schema' },
    ],
    improve_links: [
      { order: 1, title: 'Analyze internal linking', description: 'Find opportunities for internal links', action: 'analyze_links' },
      { order: 2, title: 'Generate recommendations', description: 'Suggest relevant internal links', action: 'generate_link_recs' },
      { order: 3, title: 'Preview links', description: 'Show proposed additions', action: 'preview_links' },
      { order: 4, title: 'Add links', description: 'Insert internal links into content', action: 'add_links' },
      { order: 5, title: 'Verify links', description: 'Check links are functional and contextual', action: 'verify_links' },
    ],
    refresh_content: [
      { order: 1, title: 'Analyze current content', description: 'Assess outdated sections', action: 'analyze_content' },
      { order: 2, title: 'Generate updates', description: 'Create refreshed content blocks', action: 'generate_updates' },
      { order: 3, title: 'Preview changes', description: 'Show content refresh preview', action: 'preview_content' },
      { order: 4, title: 'Apply refresh', description: 'Update outdated sections', action: 'update_content' },
      { order: 5, title: 'Verify update', description: 'Confirm content freshness improved', action: 'verify_freshness' },
    ],
    repair_canonical: [
      { order: 1, title: 'Check current canonical', description: 'Verify existing canonical tag', action: 'check_canonical' },
      { order: 2, title: 'Identify issues', description: 'Detect broken or incorrect canonicals', action: 'identify_issues' },
      { order: 3, title: 'Propose fix', description: 'Suggest canonical correction', action: 'propose_canonical' },
      { order: 4, title: 'Apply fix', description: 'Update canonical tag', action: 'update_canonical' },
      { order: 5, title: 'Verify in GSC', description: 'Confirm fix in Search Console', action: 'verify_canonical' },
    ],
    custom: [
      { order: 1, title: 'Review requirements', description: 'Understand execution requirements', action: 'review_requirements' },
      { order: 2, title: 'Plan execution', description: 'Create execution plan', action: 'plan_execution' },
      { order: 3, title: 'Preview changes', description: 'Show proposed changes', action: 'preview_changes' },
      { order: 4, title: 'Execute changes', description: 'Apply planned changes', action: 'execute_changes' },
      { order: 5, title: 'Verify success', description: 'Confirm changes were applied correctly', action: 'verify_success' },
    ],
  }

  return baseSteps[executionType] || baseSteps.custom
}

function estimateTime(executionType: string, stepCount: number): number {
  const baseTime: Record<string, number> = {
    update_title: 15,
    add_schema: 30,
    improve_links: 45,
    create_section: 120,
    refresh_content: 90,
    repair_canonical: 20,
    repair_redirect: 25,
    merge_content: 60,
    add_images: 40,
    improve_headings: 30,
    custom: 60,
  }

  return (baseTime[executionType] ?? 60) + stepCount * 5
}

function estimateRisk(executionType: string): 'low' | 'medium' | 'high' {
  const riskMap: Record<string, 'low' | 'medium' | 'high'> = {
    update_title: 'low',
    add_schema: 'low',
    improve_links: 'low',
    create_section: 'medium',
    refresh_content: 'medium',
    repair_canonical: 'low',
    repair_redirect: 'medium',
    merge_content: 'high',
    add_images: 'low',
    improve_headings: 'low',
    custom: 'medium',
  }

  return riskMap[executionType] ?? 'medium'
}

function estimateROI(executionType: string): number {
  const roiMap: Record<string, number> = {
    update_title: 15,
    add_schema: 20,
    improve_links: 25,
    create_section: 40,
    refresh_content: 30,
    repair_canonical: 10,
    repair_redirect: 15,
    merge_content: 35,
    add_images: 20,
    improve_headings: 15,
    custom: 20,
  }

  return roiMap[executionType] ?? 20
}

function estimateConfidence(executionType: string, riskLevel: string): number {
  const baseConfidence: Record<string, number> = {
    low: 0.95,
    medium: 0.75,
    high: 0.55,
  }

  const riskMultiplier: Record<string, number> = {
    update_title: 0.98,
    add_schema: 0.92,
    improve_links: 0.90,
    create_section: 0.80,
    refresh_content: 0.85,
    repair_canonical: 0.95,
    repair_redirect: 0.88,
    merge_content: 0.70,
    add_images: 0.93,
    improve_headings: 0.91,
    custom: 0.75,
  }

  const base = baseConfidence[riskLevel] ?? 0.75
  const multiplier = riskMultiplier[executionType] ?? 0.85

  return base * multiplier
}

function determineRollbackStrategy(executionType: string): string {
  const strategies: Record<string, string> = {
    update_title: 'reverse_steps',
    add_schema: 'reverse_steps',
    improve_links: 'reverse_steps',
    create_section: 'restore_backup',
    refresh_content: 'restore_backup',
    repair_canonical: 'reverse_steps',
    repair_redirect: 'reverse_steps',
    merge_content: 'restore_backup',
    add_images: 'reverse_steps',
    improve_headings: 'reverse_steps',
    custom: 'manual',
  }

  return strategies[executionType] ?? 'manual'
}

function determineApprovalPolicy(riskLevel: string, priority?: string): string {
  // High-risk deployments require manual or admin approval
  if (riskLevel === 'high') {
    return priority === 'high' ? 'admin' : 'two_person'
  }

  // Medium-risk default to manual
  if (riskLevel === 'medium') {
    return 'manual'
  }

  // Low-risk can be automatic for low-priority items
  if (priority === 'low') {
    return 'automatic'
  }

  return 'manual'
}
