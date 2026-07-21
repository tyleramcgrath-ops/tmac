// Operator preview (Phase D §1,§3). For one or more recommendations, generate
// the concrete fix + safe diff + safety assessment + policy decision. No writes.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { buildOperatorPreview, signalsForRecommendation } from '@/lib/foundation/operator/pipeline'
import { latestScanPages, policyOf } from '@/lib/foundation/operator/context'
import { isAutomationAllowed } from '@/lib/foundation/billing'
import { stripeConfig } from '@/lib/foundation/env'

export const runtime = 'nodejs'

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const ids = Array.isArray(body.recommendationIds) ? body.recommendationIds.map(String) : []

  const store = await getStore()
  const pages = await latestScanPages(store, projectId)
  const sitePages = pages.map((p) => ({ url: String(p.url ?? ''), title: String((p.title as string) ?? '') })).filter((p) => p.url)
  const policy = policyOf(project)
  const all = await store.listRecommendations(projectId)
  const selected = ids.length ? all.filter((r) => ids.includes(r.id)) : all

  const previews = selected.map((rec) => {
    const signals = signalsForRecommendation(rec, pages)
    if (!signals) {
      return { recommendationId: rec.id, actionable: false, note: 'No page signals found for this recommendation (re-run the scan).' }
    }
    const p = buildOperatorPreview(rec, signals, policy, { sitePages })
    return {
      recommendationId: rec.id,
      title: rec.title,
      pageType: rec.pageType,
      actionable: p.fix.actionable,
      deployable: p.preview.deployable,
      fixKind: p.fix.kind,
      currentValue: p.preview.currentValue,
      proposedValue: p.preview.proposedValue,
      diff: p.preview.diff,
      reason: p.preview.reason,
      evidenceUrls: p.preview.evidenceUrls,
      confidence: p.preview.confidence,
      expectedImpact: p.preview.expectedImpact,
      safety: p.safety,
      decision: p.decision,
      note: p.fix.note,
    }
  })

  // Surfaced so the UI can show the upgrade prompt before the user attempts a
  // deploy, not just after it's rejected — a preview never blocks itself.
  const org = await store.getOrg(project.orgId)
  const gate = isAutomationAllowed(org?.billing, !!stripeConfig(), Date.now())

  return Response.json({ previews, billing: gate })
})
