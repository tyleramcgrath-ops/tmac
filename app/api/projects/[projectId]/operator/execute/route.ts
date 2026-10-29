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
import { rollbackWpDeployment } from '@/lib/foundation/wp-execution'
import { applyDeploymentOutcome, deployOneRecommendation, type DeployOneResult } from '@/lib/foundation/operator/deploy-one'
import { latestScanPages, policyOf } from '@/lib/foundation/operator/context'
import { isAutomationAllowed } from '@/lib/foundation/billing'
import { stripeConfig } from '@/lib/foundation/env'

export const runtime = 'nodejs'
export const maxDuration = 120

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
    const results: ({ ok: boolean } & Record<string, unknown>)[] = []
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
          if (rec) await applyDeploymentOutcome(store, rec, user.id, 'rolled_back', '')
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

  // Billing gate: auto-deploying a fix (never dry-run previews) requires an
  // active trial or subscription. Blocked uniformly per item so the response
  // shape matches every other early-exit reason the UI already handles.
  const org = await store.getOrg(project.orgId)
  const gate = dryRun ? { allowed: true } : isAutomationAllowed(org?.billing, !!stripeConfig(), Date.now())
  if (!gate.allowed) {
    const results = items.map((item) => ({
      recommendationId: String(item.recommendationId ?? ''),
      ok: false,
      stage: 'billing',
      blocked: true,
      error: gate.reason,
    }))
    return Response.json({ action, dryRun, results, summary: { total: items.length, verified: 0, failed: items.length } })
  }

  const results: DeployOneResult[] = []
  for (const item of items) {
    const recId = String(item.recommendationId ?? '')
    const rec = all.find((r) => r.id === recId)
    if (!rec) {
      results.push({ recommendationId: recId, ok: false, stage: 'lookup', error: 'recommendation not found' })
      continue
    }
    const result = await deployOneRecommendation({
      store, project, rec, scanPages: pages, sitePages, conn, policy,
      approvedBy: user.id, approve: item.approve === true,
      editedValue: typeof item.editedValue === 'string' ? item.editedValue : undefined,
      dryRun,
    })
    results.push(result)
  }

  const applied = results.filter((r) => r.ok && !r.dryRun).length
  if (!dryRun) await audit(project.orgId, user.id, 'operator.deploy.batch', projectId, `${applied}/${items.length} verified`)
  return Response.json({ action, dryRun, results, summary: { total: items.length, verified: applied, failed: results.filter((r) => !r.ok).length } })
})
