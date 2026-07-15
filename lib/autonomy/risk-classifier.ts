/**
 * Phase 10.1: Risk Classification Engine
 *
 * Assigns risk levels and scores to execution candidates.
 * Feeds into policy engine and decision logging.
 */

import type { ExecutionType, PageType, RiskAssessment, RiskLevel } from './types'

const EXECUTION_TYPE_RISK: Record<ExecutionType, RiskLevel> = {
  missing_schema: 'very_low',
  broken_links: 'low',
  minor_metadata: 'very_low',
  missing_alt_text: 'very_low',
  heading_improvements: 'low',
  canonical_repair: 'low',
  robots_correction: 'low',
}

const PAGE_TYPE_RISK: Record<PageType, number> = {
  legal: 0.9,
  privacy: 0.9,
  terms: 0.9,
  pricing: 0.8,
  checkout: 0.9,
  cart: 0.9,
  login: 0.8,
  registration: 0.8,
  account: 0.7,
  billing: 0.9,
  medical_claim: 0.95,
  financial_claim: 0.95,
  contact_form: 0.6,
  lead_form: 0.5,
  thank_you: 0.6,
  confirmation: 0.7,
  ugc: 0.4,
}

interface RiskFactors {
  executionType: ExecutionType
  pageType?: PageType
  dataFreshnessHours: number
  wordPressHealth: 0.0 | 0.5 | 1.0 // 0=unhealthy, 0.5=degraded, 1=healthy
  pluginCompatibility: 0.0 | 0.5 | 1.0 // 0=incompatible, 0.5=partial, 1=compatible
  rollbackAvailable: boolean
  verificationAvailable: boolean
  concurrentChanges?: boolean
  hasRecentManualEdit?: boolean
}

/**
 * Classify risk level and score for an execution
 */
export function classifyRisk(factors: RiskFactors): RiskAssessment {
  const baseRisk = EXECUTION_TYPE_RISK[factors.executionType]
  let riskScore = riskLevelToScore(baseRisk)

  // Page type multiplier (increases risk)
  if (factors.pageType) {
    const pageRiskMultiplier = PAGE_TYPE_RISK[factors.pageType] ?? 0.2
    riskScore = Math.min(1.0, riskScore + pageRiskMultiplier * 0.3)
  }

  // Data freshness penalty
  if (factors.dataFreshnessHours > 48) {
    riskScore = Math.min(1.0, riskScore + 0.15) // Add 15% if data is > 2 days old
  } else if (factors.dataFreshnessHours > 24) {
    riskScore = Math.min(1.0, riskScore + 0.05) // Add 5% if data is > 1 day old
  }

  // WordPress health penalty
  if (factors.wordPressHealth === 0) {
    riskScore = Math.min(1.0, riskScore + 0.3) // Add 30% if WordPress is unhealthy
  } else if (factors.wordPressHealth === 0.5) {
    riskScore = Math.min(1.0, riskScore + 0.15) // Add 15% if degraded
  }

  // Plugin compatibility penalty
  if (factors.pluginCompatibility === 0) {
    riskScore = Math.min(1.0, riskScore + 0.25) // Add 25% if plugin incompatible
  } else if (factors.pluginCompatibility === 0.5) {
    riskScore = Math.min(1.0, riskScore + 0.1) // Add 10% if partial support
  }

  // Missing rollback bonus (increases risk significantly)
  if (!factors.rollbackAvailable) {
    riskScore = Math.min(1.0, riskScore + 0.35) // Add 35% if no rollback
  }

  // Missing verification bonus (increases risk)
  if (!factors.verificationAvailable) {
    riskScore = Math.min(1.0, riskScore + 0.2) // Add 20% if no verification
  }

  // Concurrent changes risk
  if (factors.concurrentChanges) {
    riskScore = Math.min(1.0, riskScore + 0.1) // Add 10% for concurrent changes
  }

  // Recent manual edit risk
  if (factors.hasRecentManualEdit) {
    riskScore = Math.min(1.0, riskScore + 0.15) // Add 15% if recently edited
  }

  // Convert score back to level
  const riskLevel = scoreToRiskLevel(riskScore)

  return {
    riskLevel,
    riskScore: Math.round(riskScore * 100) / 100,
    factors: {
      executionType: riskLevelToScore(baseRisk),
      pageType: factors.pageType ? PAGE_TYPE_RISK[factors.pageType] || 0.2 : 0,
      dataFreshness: factors.dataFreshnessHours > 24 ? 0.1 : 0,
      wordPressHealth: 1.0 - factors.wordPressHealth,
      pluginCompatibility: 1.0 - factors.pluginCompatibility,
    },
  }
}

/**
 * Convert risk level to numeric score (0.0-1.0)
 */
function riskLevelToScore(level: RiskLevel): number {
  const scores: Record<RiskLevel, number> = {
    very_low: 0.1,
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 0.95,
  }
  return scores[level]
}

/**
 * Convert numeric score to risk level
 */
function scoreToRiskLevel(score: number): RiskLevel {
  if (score < 0.15) return 'very_low'
  if (score < 0.35) return 'low'
  if (score < 0.65) return 'medium'
  if (score < 0.85) return 'high'
  return 'critical'
}

/**
 * Explain risk factors in human-readable format
 */
export function explainRisk(factors: RiskFactors, assessment: RiskAssessment): string[] {
  const explanations: string[] = []

  explanations.push(`Base risk: ${EXECUTION_TYPE_RISK[factors.executionType]} (${factors.executionType})`)

  if (factors.pageType) {
    explanations.push(`Page type: ${factors.pageType} (risk multiplier +${PAGE_TYPE_RISK[factors.pageType] || 0.2})`)
  }

  if (factors.dataFreshnessHours > 48) {
    explanations.push(`Data is stale: ${factors.dataFreshnessHours} hours old (penalty: +15%)`)
  }

  if (factors.wordPressHealth !== 1.0) {
    explanations.push(`WordPress health: ${factors.wordPressHealth === 0 ? 'unhealthy' : 'degraded'} (penalty: +${factors.wordPressHealth === 0 ? 30 : 15}%)`)
  }

  if (factors.pluginCompatibility !== 1.0) {
    explanations.push(`Plugin compatibility: ${factors.pluginCompatibility === 0 ? 'incompatible' : 'partial'} (penalty: +${factors.pluginCompatibility === 0 ? 25 : 10}%)`)
  }

  if (!factors.rollbackAvailable) {
    explanations.push(`No rollback available (penalty: +35%)`)
  }

  if (!factors.verificationAvailable) {
    explanations.push(`No verification available (penalty: +20%)`)
  }

  if (factors.concurrentChanges) {
    explanations.push(`Concurrent changes detected (penalty: +10%)`)
  }

  if (factors.hasRecentManualEdit) {
    explanations.push(`Recent manual edit detected (penalty: +15%)`)
  }

  explanations.push(`Final risk: ${assessment.riskLevel} (score: ${assessment.riskScore})`)

  return explanations
}
