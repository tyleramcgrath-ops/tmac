// Executive / Operator metrics (Phase D §10). Execution-focused — not vanity
// charts. Everything is computed from durable deployment + recommendation
// records; nothing is invented.

import type { Recommendation, WpDeployment } from '../types'

export interface OperatorMetrics {
  recommendationsTotal: number
  openRecommendations: number
  pendingApprovals: number // accepted but not yet deployed
  fixedToday: number // deployed or verified with today's date
  verifiedImprovements: number
  deploymentsTotal: number
  deploymentSuccessRate: number // verified / (verified+verify_failed+failed)
  verificationFailureRate: number
  rollbackRate: number
  automationSuccessRate: number // verified / deployed
  avgTimeToResolutionHours: number | null
  // Trust score 0-100: blends verification success, low rollback, low
  // verify-failure. Deterministic and explained in the docs.
  trustScore: number
  operatorAccuracy: number // deployed fixes that verified, as a %
}

function isToday(iso: string | undefined, today: string): boolean {
  return !!iso && iso.slice(0, 10) === today
}

export function computeOperatorMetrics(
  recs: Recommendation[],
  deployments: WpDeployment[],
  today: string
): OperatorMetrics {
  const deploymentsTotal = deployments.length
  const verified = deployments.filter((d) => d.status === 'verified').length
  const verifyFailed = deployments.filter((d) => d.status === 'verify_failed').length
  const failed = deployments.filter((d) => d.status === 'failed').length
  const rolledBack = deployments.filter((d) => d.status === 'rolled_back').length
  const applied = deployments.filter((d) => ['verified', 'verify_failed', 'rolled_back'].includes(d.status)).length

  // Time-to-resolution: created → verified/rolled_back, in hours.
  const durations: number[] = []
  for (const d of deployments) {
    const end = d.rolledBackAt ?? d.verification?.checkedAt
    if (end) {
      const ms = Date.parse(end) - Date.parse(d.createdAt)
      if (ms >= 0) durations.push(ms / 3_600_000)
    }
  }
  const avgTtr = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null

  const deploySuccessDenom = verified + verifyFailed + failed
  const deploymentSuccessRate = deploySuccessDenom ? verified / deploySuccessDenom : 0
  const verificationFailureRate = applied ? verifyFailed / applied : 0
  const rollbackRate = applied ? rolledBack / applied : 0
  const automationSuccessRate = applied ? verified / applied : 0

  // Trust score: reward verification success, penalize verify-failure + rollback.
  const trustScore = Math.round(
    100 * Math.max(0, deploymentSuccessRate * 0.6 + (1 - verificationFailureRate) * 0.25 + (1 - rollbackRate) * 0.15)
  )

  return {
    recommendationsTotal: recs.length,
    openRecommendations: recs.filter((r) => r.status === 'open').length,
    pendingApprovals: recs.filter((r) => r.status === 'accepted').length,
    fixedToday: deployments.filter((d) => (isToday(d.verification?.checkedAt, today) || isToday(d.approvedAt, today)) && d.status === 'verified').length,
    verifiedImprovements: verified,
    deploymentsTotal,
    deploymentSuccessRate: Number(deploymentSuccessRate.toFixed(3)),
    verificationFailureRate: Number(verificationFailureRate.toFixed(3)),
    rollbackRate: Number(rollbackRate.toFixed(3)),
    automationSuccessRate: Number(automationSuccessRate.toFixed(3)),
    avgTimeToResolutionHours: avgTtr === null ? null : Number(avgTtr.toFixed(2)),
    trustScore,
    operatorAccuracy: applied ? Math.round((verified / applied) * 100) : 0,
  }
}
