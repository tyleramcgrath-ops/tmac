/**
 * Phase 10.1: Autonomous Decision Logger
 *
 * Records every autonomous evaluation with complete immutability.
 * Used for compliance, audit trail, learning, and outcome tracking.
 */

import type {
  AutonomyDecision,
  ConfidenceAssessment,
  ExecutionType,
  OutcomeStatus,
  PolicyEvaluationResult,
  RiskAssessment,
} from './types'

export interface DecisionLogEntry {
  id: string
  organizationId: string
  projectId: string

  // Candidate details
  candidateId: string
  executionType: ExecutionType
  recommendationId?: string

  // Evaluations
  policyEvaluation: PolicyEvaluationResult
  riskAssessment: RiskAssessment
  confidenceAssessment: ConfidenceAssessment

  // Business context
  businessContext: {
    timeOfDay: string // "business_hours" | "after_hours" | "weekend"
    isMoneyPage: boolean
    pageClassification?: string
    dailyChangeCount: number
    dailyPageCount: number
  }

  // Safety conditions
  safetyConditions: {
    rollbackAvailable: boolean
    verificationAvailable: boolean
    wordPressHealthy: boolean
    pluginCompatible: boolean
    emergencyStopActive: boolean
  }

  // Data freshness
  dataFreshness: {
    lastUpdate: Date
    freshnessHours: number
  }

  // Decision
  decision: 'approved' | 'blocked' | 'deferred' | 'requires_approval'
  reason: string
  decisionMaker: 'policy_engine' | 'operator' | 'user'
  decidedByUserId?: string

  // Execution plan
  executionPlan?: {
    expectedChanges: Record<string, any>
    affectedPages: string[]
    verificationStrategy: string
    rollbackStrategy: string
  }

  // Lifecycle
  createdAt: Date
  executedAt?: Date
  executionResult?: 'success' | 'verification_failed' | 'rollback_failed' | 'error'
  executionError?: string

  // Outcome tracking
  outcomeStatus: OutcomeStatus
  outcomeMetrics?: {
    ctr?: number
    impressions?: number
    rankings?: number[]
    traffic?: number
  }

  // Immutability
  version: number // For appended updates only
  lastUpdatedAt: Date
}

/**
 * Create a new decision log entry
 */
export function createDecisionLog(
  candidateId: string,
  decision: AutonomyDecision,
  businessContext: {
    timeOfDay: 'business_hours' | 'after_hours' | 'weekend'
    isMoneyPage: boolean
    dailyChangeCount: number
    dailyPageCount: number
  }
): DecisionLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    organizationId: decision.organizationId,
    projectId: decision.projectId,

    candidateId,
    executionType: decision.executionType,

    policyEvaluation: decision.policyEvaluation,
    riskAssessment: decision.riskAssessment,
    confidenceAssessment: decision.confidenceAssessment,

    businessContext: {
      timeOfDay: businessContext.timeOfDay,
      isMoneyPage: businessContext.isMoneyPage,
      dailyChangeCount: businessContext.dailyChangeCount,
      dailyPageCount: businessContext.dailyPageCount,
    },

    safetyConditions: {
      rollbackAvailable: true, // Would be determined by execution contract
      verificationAvailable: true,
      wordPressHealthy: true,
      pluginCompatible: true,
      emergencyStopActive: false,
    },

    dataFreshness: {
      lastUpdate: new Date(Date.now() - decision.timestamp.getTime()),
      freshnessHours: Math.floor((Date.now() - decision.timestamp.getTime()) / (1000 * 60 * 60)),
    },

    decision: decision.decision,
    reason: decision.reason,
    decisionMaker: decision.decisionMaker,
    decidedByUserId: decision.decidedByUserId,

    executionPlan: decision.executionPlan,

    createdAt: new Date(),
    outcomeStatus: 'awaiting_data',

    version: 1,
    lastUpdatedAt: new Date(),
  }
}

/**
 * Record execution result (append-only update)
 */
export function recordExecutionResult(
  log: DecisionLogEntry,
  result: {
    success: boolean
    error?: string
    verificationResult?: any
    rollbackResult?: string
  }
): DecisionLogEntry {
  const updated = { ...log }

  updated.executedAt = new Date()
  updated.executionResult = result.success ? 'success' : result.error ? 'error' : 'verification_failed'
  updated.executionError = result.error

  if (!result.success && result.rollbackResult === 'failed') {
    updated.executionResult = 'rollback_failed'
  }

  updated.version += 1
  updated.lastUpdatedAt = new Date()

  return updated
}

/**
 * Record outcome (append-only update)
 */
export function recordOutcome(
  log: DecisionLogEntry,
  outcome: {
    status: OutcomeStatus
    metrics?: {
      ctr?: number
      impressions?: number
      rankings?: number[]
      traffic?: number
    }
  }
): DecisionLogEntry {
  const updated = { ...log }

  updated.outcomeStatus = outcome.status
  updated.outcomeMetrics = outcome.metrics

  updated.version += 1
  updated.lastUpdatedAt = new Date()

  return updated
}

/**
 * Format decision log for audit trail
 */
export function formatDecisionLogForAudit(log: DecisionLogEntry): string {
  const lines: string[] = []

  lines.push(`Decision Log: ${log.id}`)
  lines.push(`Created: ${log.createdAt.toISOString()}`)
  lines.push(`Candidate: ${log.candidateId}`)
  lines.push(`Execution Type: ${log.executionType}`)
  lines.push(`Decision: ${log.decision}`)
  lines.push(`Reason: ${log.reason}`)
  lines.push(`Decision Maker: ${log.decisionMaker}`)
  lines.push(`Risk Level: ${log.riskAssessment.riskLevel} (${log.riskAssessment.riskScore})`)
  lines.push(`Confidence: ${log.confidenceAssessment.confidence}`)

  if (log.executedAt) {
    lines.push(`Executed: ${log.executedAt.toISOString()}`)
    lines.push(`Execution Result: ${log.executionResult}`)
  }

  lines.push(`Outcome Status: ${log.outcomeStatus}`)

  if (log.outcomeMetrics) {
    lines.push(`Outcome Metrics:`)
    if (log.outcomeMetrics.ctr) lines.push(`  CTR: ${log.outcomeMetrics.ctr}`)
    if (log.outcomeMetrics.impressions) lines.push(`  Impressions: ${log.outcomeMetrics.impressions}`)
    if (log.outcomeMetrics.traffic) lines.push(`  Traffic: ${log.outcomeMetrics.traffic}`)
  }

  return lines.join('\n')
}

/**
 * Extract learning signals from decision log
 */
export function extractLearningSignals(log: DecisionLogEntry): {
  decisionAccuracy: 'correct' | 'incorrect' | 'unknown'
  confidenceCalibration: 'good' | 'overconfident' | 'underconfident'
  riskAssessmentAccuracy: 'good' | 'overestimated' | 'underestimated'
} {
  const result = {
    decisionAccuracy: 'unknown' as 'correct' | 'incorrect' | 'unknown',
    confidenceCalibration: 'good' as 'good' | 'overconfident' | 'underconfident',
    riskAssessmentAccuracy: 'good' as 'good' | 'overestimated' | 'underestimated',
  }

  // Check decision accuracy
  if (log.executionResult === 'success' && log.outcomeStatus === 'positive') {
    result.decisionAccuracy = 'correct'
  } else if (log.executionResult === 'rollback_failed' || log.executionResult === 'error') {
    result.decisionAccuracy = 'incorrect'
  }

  // Check confidence calibration
  if (log.confidenceAssessment.confidence > 0.9 && log.outcomeStatus !== 'positive') {
    result.confidenceCalibration = 'overconfident'
  } else if (log.confidenceAssessment.confidence < 0.5 && log.outcomeStatus === 'positive') {
    result.confidenceCalibration = 'underconfident'
  }

  // Check risk assessment
  if (log.riskAssessment.riskScore > 0.7 && log.executionResult === 'success') {
    result.riskAssessmentAccuracy = 'overestimated'
  } else if (log.riskAssessment.riskScore < 0.2 && log.executionResult === 'rollback_failed') {
    result.riskAssessmentAccuracy = 'underestimated'
  }

  return result
}
