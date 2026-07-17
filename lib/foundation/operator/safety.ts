// Safety Engine (Phase D §7). Every proposed deployment is scored and
// dangerous actions are blocked automatically. Blocking is conservative: when
// in doubt, require explicit human approval rather than proceed.

import type { GeneratedFix } from './fixgen'
import type { Recommendation } from '../types'

export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked'

export interface SafetyAssessment {
  risk: RiskLevel
  score: number // 0-100, higher = riskier
  affectedPages: number
  seoImpact: string
  businessImpact: string
  warnings: string[]
  rollbackPlan: string
  // Actions that are never auto-executed regardless of policy.
  blocked: boolean
  blockReason?: string
}

// Categorically dangerous change types — blocked from any automated path; they
// require an explicit, single, human-approved action (never bulk/auto).
const DANGEROUS_RULES = new Set([
  'robots-directive',
  'noindex',
  'canonical', // changing canonicals can deindex; needs human eyes
  'redirect',
  'sitemap',
])

export function assessSafety(rec: Recommendation, fix: GeneratedFix): SafetyAssessment {
  const affectedPages = rec.evidence.affectedUrls.length
  const warnings: string[] = []

  // Base risk from the recommendation's own risk + how much it touches.
  let score = { low: 15, medium: 45, high: 75 }[rec.risk.level] ?? 45
  if (affectedPages > 10) {
    score += 15
    warnings.push(`Affects ${affectedPages} pages — review the full list before bulk deploy.`)
  }

  // Content-changing fixes (title/meta) are visible to users — moderate risk.
  if (fix.kind === 'metaDescription' || fix.kind === 'title') {
    warnings.push('Changes visible SERP-facing copy; verify wording matches brand voice.')
  }

  // Categorically dangerous → block automated execution.
  const dangerous = DANGEROUS_RULES.has(fix.kind) || /robots|noindex|canonical|redirect|sitemap/i.test(rec.title)
  if (dangerous) {
    return {
      risk: 'blocked',
      score: 100,
      affectedPages,
      seoImpact: 'Potentially high and hard to reverse (indexation/canonicalization).',
      businessImpact: 'Could remove pages from search if wrong.',
      warnings: [...warnings, 'This change class can deindex pages and is blocked from automated/bulk deployment.'],
      rollbackPlan: 'Captured before-values allow restore, but indexation recovery can lag days.',
      blocked: true,
      blockReason: 'Indexation/canonical/robots changes require an explicit single human approval.',
    }
  }

  const risk: RiskLevel = score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low'
  return {
    risk,
    score: Math.min(99, score),
    affectedPages,
    seoImpact: rec.expectedImpact?.note ?? 'Incremental on-page improvement.',
    businessImpact: affectedPages > 5 ? 'Site-wide consistency improvement.' : 'Page-level improvement.',
    warnings,
    rollbackPlan: 'Before-values are captured server-side; one-click rollback restores them and re-verifies.',
    blocked: false,
  }
}
