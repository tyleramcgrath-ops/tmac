import type { Candidate, FocusWindow } from './types'
import { FOCUS_MINUTES, MIN_MINUTES_FOR_ACTION } from './types'
import { canonicalizeActionType } from './consolidate'

/**
 * Suppression + judgment overlay applied after the raw score + basic
 * judgment. Encodes:
 *
 *  - "good enough" detection so we don't endlessly optimise
 *  - dependency gating (a prerequisite must ship first)
 *  - stale-evidence gating (data older than the freshness horizon)
 *  - time-fit (do NOT assign a rewrite as a 15-minute mission)
 *  - conflict blocking (surface conflicts, don't auto-execute)
 *  - authorization / deployment capability blocking
 */

export interface Suppression {
  kind:
    | 'good_enough'
    | 'dependency'
    | 'stale_data'
    | 'time_fit'
    | 'conflict'
    | 'not_indexable'
    | 'not_authorized'
    | 'no_deployment'
    | 'insufficient_data'
    | 'expired'
  reason: string
}

export interface SuppressionContext {
  /// Raw signals that the caller already knows about the candidate + page.
  isMoneyPage: boolean
  isIndexable: boolean
  pageRanksInTop3: boolean
  pageConvertsWell: boolean
  clusterCoverageSufficient: boolean
  metadataAcceptable: boolean
  candidateHasConflict: boolean
  dependencyStillOpen: boolean
  evidenceAgeDays: number | null
  dataSufficient: boolean
  userCanApprove: boolean
  userCanDeploy: boolean
  deploymentAvailable: boolean
  focusWindow?: FocusWindow
}

/**
 * Returns `null` when the candidate should be shown, or a `Suppression` when
 * the Operator has judged this one should be hidden (or deferred).
 */
export function suppressionFor(
  candidate: Candidate,
  ctx: SuppressionContext,
): Suppression | null {
  const canonicalType = canonicalizeActionType(candidate.recommendationType)

  // Good enough: page already performing, cosmetic action, better use of time
  if (
    ctx.pageRanksInTop3 &&
    ctx.pageConvertsWell &&
    (canonicalType === 'refresh_content' ||
      canonicalType === 'add_faq_schema' ||
      canonicalType === 'add_missing_entities') &&
    !ctx.isMoneyPage
  ) {
    return {
      kind: 'good_enough',
      reason: 'Page already ranks and converts well; further optimization is unlikely to move the needle',
    }
  }
  if (ctx.metadataAcceptable && canonicalType === 'rewrite_metadata') {
    return { kind: 'good_enough', reason: 'Metadata is acceptable — further rewriting adds risk' }
  }
  if (ctx.clusterCoverageSufficient && canonicalType === 'repair_topic_cluster') {
    return { kind: 'good_enough', reason: 'Topic cluster already has sufficient coverage' }
  }

  // Not indexable — no point recommending SEO work on an unindexable page
  if (!ctx.isIndexable && !canonicalType.startsWith('index_')) {
    return { kind: 'not_indexable', reason: 'Page is not indexable — SEO work will not surface' }
  }

  // Dependency unblocked?
  if (ctx.dependencyStillOpen) {
    return {
      kind: 'dependency',
      reason: 'A prerequisite action is still open — resolve that first',
    }
  }

  // Stale evidence — surface as suppressed rather than delete
  if (ctx.evidenceAgeDays !== null && ctx.evidenceAgeDays > 30) {
    return {
      kind: 'stale_data',
      reason: `Underlying evidence is ${Math.round(ctx.evidenceAgeDays)} days old — re-verify before acting`,
    }
  }

  // Insufficient data
  if (!ctx.dataSufficient) {
    return {
      kind: 'insufficient_data',
      reason: 'Not enough Search Console / analytics data to trust this recommendation yet',
    }
  }

  // Conflict — don't auto-execute either side
  if (ctx.candidateHasConflict) {
    return {
      kind: 'conflict',
      reason:
        'Conflicts with another approved or high-priority action on the same page — resolve manually',
    }
  }

  // Time fit
  if (ctx.focusWindow) {
    const budget = FOCUS_MINUTES[ctx.focusWindow]
    const min = MIN_MINUTES_FOR_ACTION[canonicalType] ?? 15
    if (min > budget) {
      return {
        kind: 'time_fit',
        reason: `Needs at least ${min}m — doesn't fit a ${ctx.focusWindow} session`,
      }
    }
  }

  // Authorization / deployment
  if (
    (canonicalType === 'redirect_and_merge' ||
      canonicalType === 'page_migration' ||
      canonicalType === 'full_content_rewrite') &&
    !ctx.userCanApprove
  ) {
    return { kind: 'not_authorized', reason: 'Only admins can approve destructive changes' }
  }
  if (canonicalType === 'deploy_and_verify' && !ctx.deploymentAvailable) {
    return { kind: 'no_deployment', reason: 'No deployment integration is connected for this project' }
  }

  return null
}

/**
 * Bucketing decision: given a candidate + suppression verdict + judged score,
 * decide which shortlist section it belongs in.
 */
export function bucketFor(
  candidate: Candidate,
  finalScore: number,
  suppression: Suppression | null,
): 'primary' | 'next_best' | 'watch' | 'deferred' | 'critical' | 'suppressed' {
  if (suppression) {
    if (suppression.kind === 'stale_data' || suppression.kind === 'insufficient_data')
      return 'deferred'
    return 'suppressed'
  }
  if (finalScore >= 85) return 'critical'
  if (finalScore >= 70) return 'primary'
  if (finalScore >= 45) return 'next_best'
  if (finalScore >= 25) return 'watch'
  return 'deferred'
}
