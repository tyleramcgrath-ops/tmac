/**
 * Phase 10.1: Execution Contracts
 *
 * Every execution type must have a registered safety contract.
 * No execution type may operate without an explicit contract.
 */

import type { ExecutionContractTerms, ExecutionType, PageType, RiskLevel } from './types'

/**
 * Registered execution contracts
 * These define the safety terms for each allowed autonomous execution type
 */
export const EXECUTION_CONTRACTS: Record<ExecutionType, ExecutionContractTerms> = {
  missing_schema: {
    executionType: 'missing_schema',
    maxRiskLevel: 'very_low',
    minConfidence: 0.85,
    dataFreshnessHours: 24,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: [
      'legal',
      'privacy',
      'terms',
      'pricing',
      'checkout',
      'cart',
      'login',
      'registration',
      'billing',
      'medical_claim',
      'financial_claim',
    ],
    forbiddenPlugins: [],
    maxBatchSize: 20,

    rollbackMethod: 'state_restore',
    verificationMethod: 'html_parse',
    autoRetryCount: 2,

    allowedMutations: ['schema', 'structured_data'],
    maxMutationScope: 'post_metadata',

    escalateOnFailure: true,
    escalateOnHighRisk: false,
  },

  broken_links: {
    executionType: 'broken_links',
    maxRiskLevel: 'low',
    minConfidence: 0.8,
    dataFreshnessHours: 48,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: ['legal', 'privacy', 'terms', 'checkout', 'billing'],
    forbiddenPlugins: [],
    maxBatchSize: 10,

    rollbackMethod: 'state_restore',
    verificationMethod: 'link_check',
    autoRetryCount: 3,

    allowedMutations: ['internal_links', 'href_targets'],
    maxMutationScope: 'post_content',

    escalateOnFailure: true,
    escalateOnHighRisk: true,
  },

  minor_metadata: {
    executionType: 'minor_metadata',
    maxRiskLevel: 'very_low',
    minConfidence: 0.85,
    dataFreshnessHours: 24,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: [
      'legal',
      'privacy',
      'terms',
      'pricing',
      'checkout',
      'billing',
      'medical_claim',
      'financial_claim',
    ],
    forbiddenPlugins: [],
    maxBatchSize: 50,

    rollbackMethod: 'state_restore',
    verificationMethod: 'api_read',
    autoRetryCount: 2,

    allowedMutations: ['meta_description', 'meta_keywords'],
    maxMutationScope: 'post_metadata',

    escalateOnFailure: false,
    escalateOnHighRisk: false,
  },

  missing_alt_text: {
    executionType: 'missing_alt_text',
    maxRiskLevel: 'very_low',
    minConfidence: 0.9,
    dataFreshnessHours: 24,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: [],
    forbiddenPlugins: [],
    maxBatchSize: 100,

    rollbackMethod: 'state_restore',
    verificationMethod: 'html_parse',
    autoRetryCount: 2,

    allowedMutations: ['img_alt_text'],
    maxMutationScope: 'post_content',

    escalateOnFailure: false,
    escalateOnHighRisk: false,
  },

  heading_improvements: {
    executionType: 'heading_improvements',
    maxRiskLevel: 'low',
    minConfidence: 0.8,
    dataFreshnessHours: 24,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: ['legal', 'privacy', 'terms', 'checkout', 'cart', 'billing'],
    forbiddenPlugins: [],
    maxBatchSize: 15,

    rollbackMethod: 'state_restore',
    verificationMethod: 'html_parse',
    autoRetryCount: 2,

    allowedMutations: ['heading_h1', 'heading_h2', 'heading_hierarchy'],
    maxMutationScope: 'post_content',

    escalateOnFailure: true,
    escalateOnHighRisk: true,
  },

  canonical_repair: {
    executionType: 'canonical_repair',
    maxRiskLevel: 'low',
    minConfidence: 0.95,
    dataFreshnessHours: 12,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: ['checkout', 'cart', 'login', 'registration', 'account'],
    forbiddenPlugins: [],
    maxBatchSize: 5,

    rollbackMethod: 'state_restore',
    verificationMethod: 'html_parse',
    autoRetryCount: 1,

    allowedMutations: ['canonical_link'],
    maxMutationScope: 'post_metadata',

    escalateOnFailure: true,
    escalateOnHighRisk: true,
  },

  robots_correction: {
    executionType: 'robots_correction',
    maxRiskLevel: 'low',
    minConfidence: 0.9,
    dataFreshnessHours: 24,

    requiresRollbackSupport: true,
    requiresVerification: true,
    requiresWordPressConnection: true,

    forbiddenPageTypes: ['login', 'registration', 'account'],
    forbiddenPlugins: [],
    maxBatchSize: 25,

    rollbackMethod: 'state_restore',
    verificationMethod: 'html_parse',
    autoRetryCount: 2,

    allowedMutations: ['robots_meta', 'noindex', 'nofollow'],
    maxMutationScope: 'post_metadata',

    escalateOnFailure: true,
    escalateOnHighRisk: true,
  },
}

/**
 * Validate that a candidate execution type has a registered contract
 */
export function validateContractExists(executionType: ExecutionType): { valid: boolean; contract?: ExecutionContractTerms; error?: string } {
  const contract = EXECUTION_CONTRACTS[executionType]

  if (!contract) {
    return {
      valid: false,
      error: `No execution contract registered for ${executionType}. Autonomous execution is forbidden.`,
    }
  }

  return {
    valid: true,
    contract,
  }
}

/**
 * Validate that an execution complies with its contract
 */
export function validateContractCompliance(
  executionType: ExecutionType,
  actualProperties: {
    riskLevel: RiskLevel
    confidence: number
    pageType?: PageType
    batchSize: number
    affectedFields: string[]
  }
): { compliant: boolean; violations: string[] } {
  const result = validateContractExists(executionType)
  if (!result.valid) {
    return {
      compliant: false,
      violations: [result.error || 'No contract'],
    }
  }

  const contract = result.contract!
  const violations: string[] = []

  // Check risk level
  const riskHierarchy: Record<RiskLevel, number> = {
    very_low: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  }

  if (riskHierarchy[actualProperties.riskLevel] > riskHierarchy[contract.maxRiskLevel]) {
    violations.push(`Risk level ${actualProperties.riskLevel} exceeds contract max ${contract.maxRiskLevel}`)
  }

  // Check confidence
  if (actualProperties.confidence < contract.minConfidence) {
    violations.push(`Confidence ${actualProperties.confidence} below contract minimum ${contract.minConfidence}`)
  }

  // Check page type
  if (actualProperties.pageType && contract.forbiddenPageTypes.includes(actualProperties.pageType)) {
    violations.push(`Page type ${actualProperties.pageType} is forbidden for ${executionType}`)
  }

  // Check batch size
  if (actualProperties.batchSize > contract.maxBatchSize) {
    violations.push(`Batch size ${actualProperties.batchSize} exceeds contract maximum ${contract.maxBatchSize}`)
  }

  // Check affected fields
  const forbiddenFields = actualProperties.affectedFields.filter(
    (field) => !contract.allowedMutations.includes(field)
  )
  if (forbiddenFields.length > 0) {
    violations.push(`Forbidden field mutations: ${forbiddenFields.join(', ')}`)
  }

  return {
    compliant: violations.length === 0,
    violations,
  }
}

/**
 * Get rollback method for an execution type
 */
export function getRollbackMethod(executionType: ExecutionType): string | null {
  const contract = EXECUTION_CONTRACTS[executionType]
  return contract?.rollbackMethod || null
}

/**
 * Get verification method for an execution type
 */
export function getVerificationMethod(executionType: ExecutionType): string | null {
  const contract = EXECUTION_CONTRACTS[executionType]
  return contract?.verificationMethod || null
}
