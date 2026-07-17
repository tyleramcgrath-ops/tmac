// Operator Pipeline (Phase D §1). Ties the pieces together:
//   discover (recommendation) → generate fix → build preview (diff + safety +
//   policy decision) → [approve] → deploy → verify → learn/reopen → archive.
// This module holds the PURE assembly (preview, decision, reopen logic). The
// actual WordPress write stays in wp-execution (already read-back-verified).

import type { Recommendation, WpDeployment } from '../types'
import type { PageSignals } from '../reco/signals'
import { toPageSignals } from '../reco/signals'
import { generateFix, ruleIdOf, type GeneratedFix } from './fixgen'
import { charDiff, type Preview } from './diff'
import { assessSafety, type SafetyAssessment } from './safety'
import { evaluatePolicy, type AutomationPolicy, type ApprovalDecision } from './policy'

export interface OperatorPreview {
  recommendation: Recommendation
  fix: GeneratedFix
  preview: Preview
  safety: SafetyAssessment
  decision: ApprovalDecision
}

// Find the page signals for a recommendation's primary affected URL from the
// scan pages (so fix generation uses the real crawled signals).
export function signalsForRecommendation(
  rec: Recommendation,
  scanPages: Record<string, unknown>[]
): PageSignals | null {
  const target = rec.evidence.affectedUrls[0]
  const raw = scanPages.find((p) => String(p.url) === target)
  return raw ? toPageSignals(raw) : null
}

// Build the full, transparent preview for one recommendation.
export function buildOperatorPreview(
  rec: Recommendation,
  signals: PageSignals,
  policy: AutomationPolicy
): OperatorPreview {
  const ruleId = ruleIdOf(rec)
  const fix = generateFix(ruleId, signals)
  const safety = assessSafety(rec, fix)
  const decision = evaluatePolicy(policy, fix, safety)

  const field: Preview['field'] =
    fix.kind === 'title' ? 'title' : fix.kind === 'metaDescription' ? 'metaDescription' : fix.kind === 'schema' ? 'schema' : 'other'
  const deployable = fix.actionable && (fix.kind === 'title' || fix.kind === 'metaDescription')

  const preview: Preview = {
    recommendationId: rec.id,
    ruleId,
    field,
    currentValue: fix.currentValue,
    proposedValue: fix.proposedValue,
    diff: charDiff(fix.currentValue, fix.proposedValue),
    reason: rec.reasoning,
    evidenceUrls: rec.evidence.affectedUrls,
    expectedImpact: rec.expectedImpact?.note ?? '',
    confidence: rec.confidence,
    risk: rec.risk,
    rollbackAvailable: deployable, // WP title/meta writes capture before-values
    deployable,
    warnings: safety.warnings,
  }

  return { recommendation: rec, fix, preview, safety, decision }
}

// After a deployment, decide the recommendation's terminal/next state and any
// reopen. Verification failure MUST reopen the recommendation (Phase D §5).
export function outcomeForDeployment(dep: WpDeployment): {
  recommendationStatus: Recommendation['status'] | null
  reopen: boolean
  note: string
} {
  switch (dep.status) {
    case 'verified':
      return { recommendationStatus: 'verified', reopen: false, note: 'Applied and verified by read-back.' }
    case 'rolled_back':
      return { recommendationStatus: 'rolled_back', reopen: false, note: 'Rolled back to before-values.' }
    case 'verify_failed':
      return { recommendationStatus: 'open', reopen: true, note: `Verification failed: ${dep.verification?.note ?? 'value did not persist'}. Reopened.` }
    case 'failed':
      return { recommendationStatus: 'open', reopen: true, note: `Deployment failed: ${dep.result}. Reopened.` }
    default:
      return { recommendationStatus: null, reopen: false, note: '' }
  }
}
