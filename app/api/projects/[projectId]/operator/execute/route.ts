// Operator execute (Phase D §1,§5,§9). Bulk deploy or rollback with:
//  - policy + safety gating (blocked actions never run; requires-approval items
//    only run when the caller explicitly approves them)
//  - dry-run (preview the plan, write nothing)
//  - real WordPress write → read-back verification (wp-execution)
//  - verification failure REOPENS the recommendation (never assumes success)
//  - partial-success recovery (each item independent; failures don't abort)
//
// Deploy requires the admin role.

import { assertSameOrigin, audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { executeWpDeployment, resolveWpTarget, rollbackWpDeployment } from '@/lib/foundation/wp-execution'
import { buildOperatorPreview, outcomeForDeployment, signalsForRecommendation } from '@/lib/foundation/operator/pipeline'
import { latestScanPages, policyOf } from '@/lib/foundation/operator/context'
import type { Recommendation } from '@/lib/foundation/types'

export const runtime = 'nodejs'
export const maxDuration = 120

async function reopenOrAdvance(store: Awaited<ReturnType<typeof getStore>>, rec: Recommendation, userId: string, depStatus: string, note: string) {
  const outcome = outcomeForDeployment({ status: depStatus } as never)
  if (outcome.recommendationStatus && outcome.recommendationStatus !== rec.status) {
    rec.history.push({ at: new Date().toISOString(), by: userId, from: rec.status, to: outcome.recommendationStatus })
    rec.status = outcome.recommendationStatus
    await store.updateRecommendation(rec)
  }
  return outcome.note || note
}

export const POST = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'operator-execute', 30)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const store = await getStore()
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action ?? 'deploy')
  const dryRun = body.dryRun === true

  // ── Batch rollback ──
  if (action === 'rollback') {
    const conn = await store.getWpConnection(projectId)
    if (!conn) throw new HttpError(400, 'Connect WordPress first.')
    const ids = Array.isArray(body.deploymentIds) ? body.deploymentIds.map(String) : []
    const results: Record<string, unknown>[] = []
    for (const id of ids) {
      const dep = await store.getWpDeployment(id)
      if (!dep || dep.projectId !== projectId) {
        results.push({ deploymentId: id, ok: false, error: 'not found' })
        continue
      }
      if (dep.status === 'rolled_back' || dep.status === 'failed') {
        results.push({ deploymentId: id, ok: false, error: `cannot roll back a ${dep.status} deployment` })
        continue
      }
      try {
        const updated = await rollbackWpDeployment({ deployment: dep, connection: conn, actorId: user.id })
        if (dep.recommendationId) {
          const rec = await store.getRecommendation(dep.recommendationId)
          if (rec) await reopenOrAdvance(store, rec, user.id, 'rolled_back', '')
        }
        results.push({ deploymentId: id, ok: true, status: updated.status, result: updated.result })
      } catch (err) {
        results.push({ deploymentId: id, ok: false, error: err instanceof Error ? err.message : 'rollback failed' })
      }
    }
    await audit(project.orgId, user.id, 'operator.rollback.batch', projectId, `${results.filter((r) => r.ok).length}/${ids.length} rolled back`)
    return Response.json({ action, results })
  }

  // ── Bulk deploy ──
  const conn = await store.getWpConnection(projectId)
  const pages = await latestScanPages(store, projectId)
  // Other real crawled pages, so internal-linking fixes can only ever link to
  // pages that actually exist (never invented URLs).
  const sitePages = pages.map((p) => ({ url: String(p.url ?? ''), title: String((p.title as string) ?? '') })).filter((p) => p.url)
  const policy = policyOf(project)
  const all = await store.listRecommendations(projectId)
  const items = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : []

  const results: Record<string, unknown>[] = []
  for (const item of items) {
    const recId = String(item.recommendationId ?? '')
    const explicitApprove = item.approve === true
    const rec = all.find((r) => r.id === recId)
    if (!rec) {
      results.push({ recommendationId: recId, ok: false, stage: 'lookup', error: 'recommendation not found' })
      continue
    }
    const signals = signalsForRecommendation(rec, pages)
    if (!signals) {
      results.push({ recommendationId: recId, ok: false, stage: 'signals', error: 'no page signals; re-run scan' })
      continue
    }
    const { fix, safety, decision, preview } = buildOperatorPreview(rec, signals, policy, { sitePages })

    // Safety/policy gating.
    if (safety.blocked) {
      results.push({ recommendationId: recId, ok: false, stage: 'safety', blocked: true, error: safety.blockReason })
      continue
    }
    if (!preview.deployable) {
      results.push({ recommendationId: recId, ok: false, stage: 'fixgen', error: `Fix kind "${fix.kind}" is advisory, not an automated WordPress write.`, proposedValue: fix.proposedValue })
      continue
    }
    const approved = decision.decision === 'auto-approved' || explicitApprove
    if (!approved) {
      results.push({ recommendationId: recId, ok: false, stage: 'approval', requiresApproval: true, reason: decision.reason })
      continue
    }

    // Build the WordPress changes from the fix. A content transform (Phase H:
    // https-upgrade / missing-H1 / internal-links) writes the post body; a
    // title/meta fix writes that field and honours a human-edited value.
    const value = typeof item.editedValue === 'string' ? (item.editedValue as string) : fix.proposedValue
    const changes = fix.contentTransform
      ? { contentTransform: fix.contentTransform }
      : fix.kind === 'title'
        ? { title: value }
        : { metaDescription: value }

    if (dryRun) {
      results.push({ recommendationId: recId, ok: true, dryRun: true, decision: decision.decision, changes, diff: preview.diff, safety })
      continue
    }

    if (!conn) {
      results.push({ recommendationId: recId, ok: false, stage: 'connection', error: 'WordPress not connected' })
      continue
    }
    // Resolve the target post from the recommendation's evidence URL.
    const target = await resolveWpTarget(conn, rec.evidence.affectedUrls[0])
    if (!target) {
      results.push({ recommendationId: recId, ok: false, stage: 'resolve', error: 'could not resolve a WordPress post for the affected URL' })
      continue
    }
    try {
      const dep = await executeWpDeployment({
        projectId,
        orgId: project.orgId,
        connection: conn,
        postId: target.postId,
        postType: target.postType,
        changes,
        approvedBy: user.id,
        reason: `Operator: ${rec.title}${decision.decision === 'auto-approved' ? ' (auto-approved)' : ''}`,
        recommendationId: rec.id,
      })
      const note = await reopenOrAdvance(store, rec, user.id, dep.status, dep.result)
      results.push({ recommendationId: recId, ok: dep.status === 'verified', deploymentId: dep.id, status: dep.status, verified: dep.status === 'verified', reopened: dep.status === 'verify_failed' || dep.status === 'failed', note })
    } catch (err) {
      results.push({ recommendationId: recId, ok: false, stage: 'deploy', error: err instanceof Error ? err.message : 'deploy failed' })
    }
  }

  const applied = results.filter((r) => r.ok && !r.dryRun).length
  if (!dryRun) await audit(project.orgId, user.id, 'operator.deploy.batch', projectId, `${applied}/${items.length} verified`)
  return Response.json({ action, dryRun, results, summary: { total: items.length, verified: applied, failed: results.filter((r) => !r.ok).length } })
})
