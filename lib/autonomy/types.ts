/**
 * Phase 10.1: Autonomous Operations Types
 *
 * Core type definitions for autonomy modes, policies, and decisions.
 */

export type AutonomyMode = 'disabled' | 'simulation_only' | 'approval_required' | 'low_risk_autonomy'

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'critical'

export type ExecutionType =
  | 'missing_schema'
  | 'broken_links'
  | 'minor_metadata'
  | 'missing_alt_text'
  | 'heading_improvements'
  | 'canonical_repair'
  | 'robots_correction'

export type DecisionResult = 'approved' | 'blocked' | 'deferred' | 'requires_approval'

export type PageType =
  | 'legal'
  | 'privacy'
  | 'terms'
  | 'pricing'
  | 'checkout'
  | 'cart'
  | 'login'
  | 'registration'
  | 'account'
  | 'billing'
  | 'medical_claim'
  | 'financial_claim'
  | 'contact_form'
  | 'lead_form'
  | 'thank_you'
  | 'confirmation'
  | 'ugc'

export type OutcomeStatus =
  | 'awaiting_data'
  | 'no_change'
  | 'positive'
  | 'negative'
  | 'inconclusive'
  | 'reversed'
  | 'rolled_back'

export interface PolicyContext {
  organizationId: string
  projectId: string
  executionType: ExecutionType
  pageType?: PageType
  riskLevel: RiskLevel
  confidence: number
  dataFreshnessHours: number
}

export interface PolicyEvaluationResult {
  decision: DecisionResult
  reason: string
  decisionMaker: 'policy_engine'
  blockedBy?: 'global_policy' | 'organization_policy' | 'project_policy' | 'recommendation_policy' | 'emergency_stop' | 'user_role' | 'daily_limit' | 'data_freshness'
  appliedPolicies: {
    global?: any
    organization?: any
    project?: any
    recommendation?: any
  }
}

export interface RiskAssessment {
  riskLevel: RiskLevel
  riskScore: number // 0.0-1.0
  factors: {
    executionType: number
    pageType?: number
    dataFreshness?: number
    wordPressHealth?: number
    pluginCompatibility?: number
  }
}

export interface ConfidenceAssessment {
  confidence: number // 0.0-1.0
  factors: {
    detectionConfidence: number
    changeQuality: number
    verificationAvailability: number
    rollbackAvailability: number
  }
}

export interface AutonomyDecision {
  candidateId: string
  executionType: ExecutionType
  organizationId: string
  projectId: string

  decision: DecisionResult
  reason: string

  policyEvaluation: PolicyEvaluationResult
  riskAssessment: RiskAssessment
  confidenceAssessment: ConfidenceAssessment

  executionPlan?: any
  verificationPlan?: any
  rollbackPlan?: any

  timestamp: Date
  decisionMaker: 'policy_engine' | 'operator' | 'user'
  decidedByUserId?: string
}

export interface ExecutionContractTerms {
  executionType: ExecutionType
  maxRiskLevel: RiskLevel
  minConfidence: number
  dataFreshnessHours: number

  requiresRollbackSupport: boolean
  requiresVerification: boolean
  requiresWordPressConnection: boolean

  forbiddenPageTypes: PageType[]
  forbiddenPlugins: string[]
  maxBatchSize: number

  rollbackMethod: string
  verificationMethod: string
  autoRetryCount: number

  allowedMutations: string[]
  maxMutationScope: string

  escalateOnFailure: boolean
  escalateOnHighRisk: boolean
}

export interface SafetyCheckResult {
  passed: boolean
  checks: {
    rollbackAvailable: boolean
    verificationAvailable: boolean
    wordPressHealthy: boolean
    pluginCompatible: boolean
    emergencyStopActive: boolean
    withinDailyLimit: boolean
    withinDataFreshness: boolean
    pageTypeAllowed: boolean
  }
  failedChecks: string[]
  recommendedAction: string
}
