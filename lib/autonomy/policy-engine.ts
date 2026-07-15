/**
 * Phase 10.1: Fail-Closed Policy Engine
 *
 * Evaluates autonomy decisions against hierarchical policies.
 * Most restrictive policy always wins.
 * If anything is ambiguous, blocks execution.
 */

import type {
  AutonomyMode,
  DecisionResult,
  ExecutionType,
  PageType,
  PolicyContext,
  PolicyEvaluationResult,
  RiskLevel,
} from './types'

export interface PolicyRules {
  global?: {
    allowAutonomous: boolean
    executionTypePermissions: Record<ExecutionType, boolean>
    maxRiskThreshold: RiskLevel
    minConfidence: number
  }
  organization?: {
    allowAutonomous: boolean
    executionTypePermissions?: Record<ExecutionType, boolean>
    maxRiskThreshold?: RiskLevel
    minConfidence?: number
    forbiddenPageTypes?: PageType[]
  }
  project?: {
    autonomyMode: AutonomyMode
    allowAutonomous: boolean
    executionTypePermissions?: Record<ExecutionType, boolean>
    maxRiskThreshold?: RiskLevel
    minConfidence?: number
    maxChangesPerDay?: number
    maxPagesPerDay?: number
    forbiddenPageTypes?: PageType[]
  }
  recommendation?: {
    allowAutonomous: boolean
    maxRiskThreshold?: RiskLevel
    minConfidence?: number
  }
}

const RISK_HIERARCHY: Record<RiskLevel, number> = {
  very_low: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

/**
 * Compare two risk levels (higher number = more restrictive)
 * Returns the more restrictive (higher) level
 */
function mostRestrictiveRisk(r1: RiskLevel, r2: RiskLevel): RiskLevel {
  const risks: RiskLevel[] = ['very_low', 'low', 'medium', 'high', 'critical']
  const idx1 = RISK_HIERARCHY[r1]
  const idx2 = RISK_HIERARCHY[r2]
  return idx1 >= idx2 ? r1 : r2
}

/**
 * Evaluate autonomy decision against hierarchical policies
 * Fail-closed: any missing or ambiguous condition blocks execution
 */
export async function evaluatePolicy(
  context: PolicyContext,
  rules: PolicyRules,
  additionalContext: {
    emergencyStopActive: boolean
    dailyChangesRemaining: number
    dataIsStale: boolean
    pageType?: PageType
    userRole?: 'viewer' | 'editor' | 'owner' | 'admin'
  }
): Promise<PolicyEvaluationResult> {
  const blockedReasons: string[] = []
  const appliedPolicies: Record<string, any> = {}

  // Check emergency stop first (highest priority)
  if (additionalContext.emergencyStopActive) {
    return {
      decision: 'blocked',
      reason: 'Emergency stop is active at global, organization, or project level',
      decisionMaker: 'policy_engine',
      blockedBy: 'emergency_stop',
      appliedPolicies,
    }
  }

  // Evaluate global policy
  if (!rules.global) {
    blockedReasons.push('Global policy not available')
  } else {
    appliedPolicies.global = rules.global

    // Check global autonomy enablement
    if (!rules.global.allowAutonomous) {
      blockedReasons.push('Global policy disallows autonomy')
    }

    // Check execution type permission
    if (rules.global.executionTypePermissions && !rules.global.executionTypePermissions[context.executionType]) {
      blockedReasons.push(`Global policy disallows ${context.executionType} autonomy`)
    }

    // Check risk threshold
    const globalRiskThreshold = rules.global.maxRiskThreshold || 'critical'
    if (RISK_HIERARCHY[context.riskLevel] > RISK_HIERARCHY[globalRiskThreshold]) {
      blockedReasons.push(
        `Execution risk (${context.riskLevel}) exceeds global threshold (${globalRiskThreshold})`
      )
    }

    // Check confidence
    if (context.confidence < (rules.global.minConfidence || 0.85)) {
      blockedReasons.push(`Confidence (${context.confidence}) below global minimum (${rules.global.minConfidence || 0.85})`)
    }
  }

  // Evaluate organization policy (can only restrict further)
  if (rules.organization) {
    appliedPolicies.organization = rules.organization

    if (rules.organization.allowAutonomous === false) {
      blockedReasons.push('Organization policy disallows autonomy')
    }

    if (rules.organization.executionTypePermissions && !rules.organization.executionTypePermissions[context.executionType]) {
      blockedReasons.push(`Organization policy disallows ${context.executionType}`)
    }

    if (rules.organization.maxRiskThreshold) {
      const orgRiskThreshold = rules.organization.maxRiskThreshold
      if (RISK_HIERARCHY[context.riskLevel] > RISK_HIERARCHY[orgRiskThreshold]) {
        blockedReasons.push(
          `Execution risk (${context.riskLevel}) exceeds organization threshold (${orgRiskThreshold})`
        )
      }
    }

    if (rules.organization.minConfidence && context.confidence < rules.organization.minConfidence) {
      blockedReasons.push(`Confidence below organization minimum (${rules.organization.minConfidence})`)
    }

    if (rules.organization.forbiddenPageTypes && additionalContext.pageType && rules.organization.forbiddenPageTypes.includes(additionalContext.pageType)) {
      blockedReasons.push(`Organization policy forbids ${context.executionType} on ${additionalContext.pageType} pages`)
    }
  }

  // Evaluate project policy (can only restrict further)
  if (!rules.project) {
    blockedReasons.push('Project policy not available')
  } else {
    appliedPolicies.project = rules.project

    // Check autonomy mode
    if (rules.project.autonomyMode === 'disabled') {
      return {
        decision: 'blocked',
        reason: 'Project autonomy is disabled',
        decisionMaker: 'policy_engine',
        blockedBy: 'project_policy',
        appliedPolicies,
      }
    }

    if (rules.project.autonomyMode === 'approval_required' && context.riskLevel !== 'very_low') {
      return {
        decision: 'requires_approval',
        reason: `Project requires approval for ${context.riskLevel} risk actions`,
        decisionMaker: 'policy_engine',
        appliedPolicies,
      }
    }

    if (rules.project.autonomyMode === 'simulation_only') {
      return {
        decision: 'deferred',
        reason: 'Project is in simulation-only mode',
        decisionMaker: 'policy_engine',
        appliedPolicies,
      }
    }

    // If mode is low_risk_autonomy, check risk level
    if (rules.project.autonomyMode === 'low_risk_autonomy' && context.riskLevel !== 'very_low' && context.riskLevel !== 'low') {
      return {
        decision: 'blocked',
        reason: `Project low-risk-autonomy mode does not permit ${context.riskLevel} risk`,
        decisionMaker: 'policy_engine',
        blockedBy: 'project_policy',
        appliedPolicies,
      }
    }

    if (rules.project.executionTypePermissions && !rules.project.executionTypePermissions[context.executionType]) {
      blockedReasons.push(`Project policy disallows ${context.executionType}`)
    }

    if (rules.project.maxRiskThreshold) {
      const projectRiskThreshold = rules.project.maxRiskThreshold
      if (RISK_HIERARCHY[context.riskLevel] > RISK_HIERARCHY[projectRiskThreshold]) {
        blockedReasons.push(
          `Execution risk (${context.riskLevel}) exceeds project threshold (${projectRiskThreshold})`
        )
      }
    }

    if (rules.project.minConfidence && context.confidence < rules.project.minConfidence) {
      blockedReasons.push(`Confidence below project minimum (${rules.project.minConfidence})`)
    }

    if (rules.project.forbiddenPageTypes && additionalContext.pageType && rules.project.forbiddenPageTypes.includes(additionalContext.pageType)) {
      blockedReasons.push(`Project policy forbids modifications on ${additionalContext.pageType} pages`)
    }

    // Check daily limits
    if (rules.project.maxChangesPerDay && additionalContext.dailyChangesRemaining <= 0) {
      blockedReasons.push('Project daily change limit reached')
    }
  }

  // Check data freshness
  if (additionalContext.dataIsStale) {
    blockedReasons.push(`Data is stale (${context.dataFreshnessHours}+ hours old)`)
  }

  // Check user role (Viewers cannot approve or enable autonomy)
  if (additionalContext.userRole === 'viewer') {
    blockedReasons.push('Viewer role cannot enable or approve autonomy')
  }

  // If any blocking reasons, return blocked
  if (blockedReasons.length > 0) {
    return {
      decision: 'blocked',
      reason: blockedReasons.join('; '),
      decisionMaker: 'policy_engine',
      blockedBy: 'project_policy',
      appliedPolicies,
    }
  }

  // All policies permit autonomy
  return {
    decision: 'approved',
    reason: 'All policies permit autonomy',
    decisionMaker: 'policy_engine',
    appliedPolicies,
  }
}

/**
 * Get most restrictive policy requirement across all levels
 */
export function getMostRestrictiveRequirement(rules: PolicyRules): {
  maxRiskThreshold: RiskLevel
  minConfidence: number
  forbiddenPageTypes: PageType[]
} {
  let maxRisk: RiskLevel = 'critical'
  let minConfidence = 0
  const forbiddenPageTypes: Set<PageType> = new Set()

  // Start with global
  if (rules.global) {
    maxRisk = mostRestrictiveRisk(maxRisk, rules.global.maxRiskThreshold || 'critical')
    minConfidence = Math.max(minConfidence, rules.global.minConfidence || 0)
  }

  // Apply organization restrictions
  if (rules.organization) {
    if (rules.organization.maxRiskThreshold) {
      maxRisk = mostRestrictiveRisk(maxRisk, rules.organization.maxRiskThreshold)
    }
    if (rules.organization.minConfidence) {
      minConfidence = Math.max(minConfidence, rules.organization.minConfidence)
    }
    if (rules.organization.forbiddenPageTypes) {
      rules.organization.forbiddenPageTypes.forEach((pt) => forbiddenPageTypes.add(pt))
    }
  }

  // Apply project restrictions
  if (rules.project) {
    if (rules.project.maxRiskThreshold) {
      maxRisk = mostRestrictiveRisk(maxRisk, rules.project.maxRiskThreshold)
    }
    if (rules.project.minConfidence) {
      minConfidence = Math.max(minConfidence, rules.project.minConfidence)
    }
    if (rules.project.forbiddenPageTypes) {
      rules.project.forbiddenPageTypes.forEach((pt) => forbiddenPageTypes.add(pt))
    }
  }

  return {
    maxRiskThreshold: maxRisk,
    minConfidence,
    forbiddenPageTypes: Array.from(forbiddenPageTypes),
  }
}
