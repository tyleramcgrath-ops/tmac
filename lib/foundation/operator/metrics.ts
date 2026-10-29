// Executive / Operator metrics (Phase D §10). Execution-focused — not vanity
// charts. Everything is computed from durable deployment + recommendation
// records; nothing is invented.

import type { Recommendation, WpDeployment } from '../types'

export interface OperatorMetrics {
  recommendationsTotal: number
  openRecommendations: number
  // A later scan re-detected an issue that was previously confirmed fixed —
  // something reverted it on the live site outside RankForge. Surfaced
  // separately from openRecommendations so a regression is never mistaken
  // for a fix that was simply never attempted.
  regressedRecommendations: number
  pendingApprovals: number // accepted but not yet deployed
  fixedToday: number // deployed or verified with today's date
  verifiedImprovements: number
  deploymentsTotal: number
  // Rates + trust are null (rendered "—") until there is at least one applied
  // deployment. With zero evidence we do NOT show a fabricated baseline (RC1
  // honesty fix — a fresh project previously displayed "Trust score 40" / "0%"
  // implying data that did not exist). null means "no data yet", not "0".
  deploymentSuccessRate: number | null // verified / (verified+verify_failed+failed)
  verificationFailureRate: number | null
  rollbackRate: number | null
  automationSuccessRate: number | null // verified / applied
  avgTimeToResolutionHours: number | null
  // Trust score 0-100: blends verification success, low rollback, low
  // verify-failure. Deterministic; null until ≥1 applied deployment.
  trustScore: number | null
  operatorAccuracy: number | null // applied fixes that verified, as a %
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
  // Rates are null with no evidence (never a fabricated 0/100 baseline).
  const deploymentSuccessRate = deploySuccessDenom ? verified / deploySuccessDenom : null
  const verificationFailureRate = applied ? verifyFailed / applied : null
  const rollbackRate = applied ? rolledBack / applied : null
  const automationSuccessRate = applied ? verified / applied : null

  // Trust score: reward verification success, penalize verify-failure + rollback.
  // Only computed once there is at least one applied deployment to trust.
  const trustScore =
    applied === 0
      ? null
      : Math.round(
          100 * Math.max(0, (deploymentSuccessRate ?? 0) * 0.6 + (1 - (verificationFailureRate ?? 0)) * 0.25 + (1 - (rollbackRate ?? 0)) * 0.15)
        )

  const r3 = (n: number | null) => (n === null ? null : Number(n.toFixed(3)))

  return {
    recommendationsTotal: recs.length,
    openRecommendations: recs.filter((r) => r.status === 'open').length,
    regressedRecommendations: recs.filter((r) => r.status === 'regressed').length,
    pendingApprovals: recs.filter((r) => r.status === 'accepted').length,
    fixedToday: deployments.filter((d) => (isToday(d.verification?.checkedAt, today) || isToday(d.approvedAt, today)) && d.status === 'verified').length,
    verifiedImprovements: verified,
    deploymentsTotal,
    deploymentSuccessRate: r3(deploymentSuccessRate),
    verificationFailureRate: r3(verificationFailureRate),
    rollbackRate: r3(rollbackRate),
    automationSuccessRate: r3(automationSuccessRate),
    avgTimeToResolutionHours: avgTtr === null ? null : Number(avgTtr.toFixed(2)),
    trustScore,
    operatorAccuracy: applied ? Math.round((verified / applied) * 100) : null,
  }
}
