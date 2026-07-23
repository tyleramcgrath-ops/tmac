// Single-recommendation deploy — the one thing operator/execute's bulk loop
// and the email "Approve & deploy" one-click link both need to do, extracted
// so there is exactly ONE place that runs the safety/policy gate before a
// real WordPress write. Neither caller may bypass it: the dangerous-rule
// block, the policy decision, and the read-back verification all live here.

import type { FoundationStore } from '../store'
import type { Project, Recommendation, WpConnection } from '../types'
import { buildOperatorPreview, outcomeForDeployment, signalsForRecommendation } from './pipeline'
import type { AutomationPolicy } from './policy'
import { executeWpDeployment, resolveWpTarget } from '../wp-execution'

export interface DeployOneResult {
  recommendationId: string
  ok: boolean
  dryRun?: boolean
  stage?: 'lookup' | 'signals' | 'safety' | 'fixgen' | 'approval' | 'connection' | 'resolve' | 'deploy'
  error?: string
  blocked?: boolean
  requiresApproval?: boolean
  reason?: string
  deploymentId?: string
  status?: string
  verified?: boolean
  reopened?: boolean
  note?: string
}

// Advance/reopen the recommendation's status per the deployment's real
// outcome (never assumed) and record who/when in its history.
export async function applyDeploymentOutcome(store: FoundationStore, rec: Recommendation, userId: string, depStatus: string, note: string): Promise<string> {
  const outcome = outcomeForDeployment({ status: depStatus } as never)
  if (outcome.recommendationStatus && outcome.recommendationStatus !== rec.status) {
    rec.history.push({ at: new Date().toISOString(), by: userId, from: rec.status, to: outcome.recommendationStatus })
    rec.status = outcome.recommendationStatus
    await store.updateRecommendation(rec)
  }
  return outcome.note || note
}

export async function deployOneRecommendation(input: {
  store: FoundationStore
  project: Project
  rec: Recommendation
  scanPages: Record<string, unknown>[]
  sitePages: { url: string; title: string }[]
  conn: WpConnection | null
  policy: AutomationPolicy
  approvedBy: string
  // Explicit human approval for this specific deploy (bulk UI checkbox, or a
  // signed one-click email link that itself only exists because a human
  // already moved the recommendation to 'accepted').
  approve: boolean
  editedValue?: string
  dryRun?: boolean
  reasonSuffix?: string
}): Promise<DeployOneResult> {
  const { store, project, rec, scanPages, sitePages, conn, policy, approvedBy, approve, editedValue, dryRun, reasonSuffix } = input
  const signals = signalsForRecommendation(rec, scanPages)
  if (!signals) return { recommendationId: rec.id, ok: false, stage: 'signals', error: 'no page signals; re-run scan' }

  const { fix, safety, decision, preview } = buildOperatorPreview(rec, signals, policy, { sitePages })

  if (safety.blocked) return { recommendationId: rec.id, ok: false, stage: 'safety', blocked: true, error: safety.blockReason }
  if (!preview.deployable) return { recommendationId: rec.id, ok: false, stage: 'fixgen', error: `Fix kind "${fix.kind}" is advisory, not an automated WordPress write.` }

  const approved = decision.decision === 'auto-approved' || approve
  if (!approved) return { recommendationId: rec.id, ok: false, stage: 'approval', requiresApproval: true, reason: decision.reason }

  const value = typeof editedValue === 'string' ? editedValue : fix.proposedValue
  const changes = fix.contentTransform ? { contentTransform: fix.contentTransform } : fix.kind === 'title' ? { title: value } : { metaDescription: value }

  if (dryRun) return { recommendationId: rec.id, ok: true, dryRun: true }
  if (!conn) return { recommendationId: rec.id, ok: false, stage: 'connection', error: 'WordPress not connected' }

  const target = await resolveWpTarget(conn, rec.evidence.affectedUrls[0])
  if (!target) return { recommendationId: rec.id, ok: false, stage: 'resolve', error: 'could not resolve a WordPress post for the affected URL' }

  try {
    const dep = await executeWpDeployment({
      projectId: project.id,
      orgId: project.orgId,
      connection: conn,
      postId: target.postId,
      postType: target.postType,
      changes,
      approvedBy,
      reason: `Operator: ${rec.title}${decision.decision === 'auto-approved' ? ' (auto-approved)' : ''}${reasonSuffix ?? ''}`,
      recommendationId: rec.id,
    })
    const note = await applyDeploymentOutcome(store, rec, approvedBy, dep.status, dep.result)
    return {
      recommendationId: rec.id,
      ok: dep.status === 'verified',
      deploymentId: dep.id,
      status: dep.status,
      verified: dep.status === 'verified',
      reopened: dep.status === 'verify_failed' || dep.status === 'failed',
      note,
    }
  } catch (err) {
    return { recommendationId: rec.id, ok: false, stage: 'deploy', error: err instanceof Error ? err.message : 'deploy failed' }
  }
}
