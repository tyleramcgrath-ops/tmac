// Learning-Loop Substrate (Phase D §6). NO machine learning — just the honest
// feedback substrate: aggregate what actually happened to recommendations and
// deployments so future recommendations CAN improve. Computes per-rule
// acceptance / rejection / edit / rollback / verification-failure rates from
// the durable history already stored on recommendations and deployments.

import type { Recommendation, WpDeployment } from '../types'
import { ruleIdFromRecommendation } from './fixgen'

export interface RuleStats {
  ruleId: string
  total: number
  accepted: number
  rejected: number
  edited: number // modified before approval
  deployed: number
  verified: number
  rolledBack: number
  verifyFailed: number
  // Derived signals a future engine can read to adjust confidence/priority.
  acceptanceRate: number // accepted+deployed+verified / total
  rejectionRate: number
  rollbackRate: number // rolledBack / deployed
  // Suggested confidence nudge in [-0.15, +0.15]; substrate only, not auto-applied.
  suggestedConfidenceNudge: number
}

function recStatusRule(rec: Recommendation): string {
  return ruleIdFromRecommendation(rec)
}

export function aggregateLearning(recs: Recommendation[], deployments: WpDeployment[]): RuleStats[] {
  const byRule = new Map<string, RuleStats>()
  const get = (ruleId: string): RuleStats =>
    byRule.get(ruleId) ??
    (byRule
      .set(ruleId, {
        ruleId, total: 0, accepted: 0, rejected: 0, edited: 0, deployed: 0, verified: 0,
        rolledBack: 0, verifyFailed: 0, acceptanceRate: 0, rejectionRate: 0, rollbackRate: 0,
        suggestedConfidenceNudge: 0,
      })
      .get(ruleId)!)

  for (const rec of recs) {
    const s = get(recStatusRule(rec))
    s.total++
    // Terminal / current status.
    if (['accepted', 'deployed', 'verified'].includes(rec.status)) s.accepted++
    if (['rejected', 'dismissed'].includes(rec.status)) s.rejected++
    if (rec.status === 'modified' || rec.history.some((h) => h.to === 'modified')) s.edited++
    if (rec.status === 'deployed') s.deployed++
    if (rec.status === 'verified') s.verified++
    if (rec.status === 'rolled_back') s.rolledBack++
  }

  // Deployment-derived signals (verification failures, rollbacks).
  for (const dep of deployments) {
    const ruleId = dep.recommendationId
      ? recStatusRule(recs.find((r) => r.id === dep.recommendationId) ?? ({ title: '', evidence: { facts: [] } } as unknown as Recommendation))
      : 'unknown'
    const s = get(ruleId)
    if (dep.status === 'verify_failed') s.verifyFailed++
    if (dep.status === 'verified') s.deployed++ // count actually-applied
    if (dep.status === 'rolled_back') s.rolledBack++
  }

  for (const s of byRule.values()) {
    s.acceptanceRate = s.total ? (s.accepted) / s.total : 0
    s.rejectionRate = s.total ? s.rejected / s.total : 0
    s.rollbackRate = s.deployed ? s.rolledBack / s.deployed : 0
    // Substrate signal only: high acceptance nudges confidence up, high
    // rejection/rollback nudges it down. Deterministic, bounded, NOT auto-applied.
    const nudge = 0.15 * (s.acceptanceRate - s.rejectionRate - s.rollbackRate)
    s.suggestedConfidenceNudge = Math.max(-0.15, Math.min(0.15, Number(nudge.toFixed(3))))
  }

  return [...byRule.values()].sort((a, b) => b.total - a.total)
}
