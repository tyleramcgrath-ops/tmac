// One-click "Approve & deploy" from the weekly digest email (Phase H moat).
// No login required — the signed token itself is the authorization, but it
// only ever proves "an admin already accepted this specific fix"; every
// safety/policy gate still runs via the same deployOneRecommendation path
// bulk deploy and the per-recommendation UI use. A stale, reused, or
// tampered link can never trigger a live WordPress write: the token is
// re-checked against the recommendation's CURRENT status (only 'accepted'
// is eligible — after a successful deploy it no longer is, so a second click
// on the same link is a safe no-op, not a re-deploy) and the signer's project
// role is re-verified at click time, not just at digest-send time.
//
// Returns HTML (a human clicks this from their email client), never JSON.

import { getStore } from '@/lib/foundation/store'
import { verifyApproveToken } from '@/lib/foundation/scheduler/approve-link'
import { deployOneRecommendation } from '@/lib/foundation/operator/deploy-one'
import { latestScanPages, policyOf } from '@/lib/foundation/operator/context'
import { rateLimit, clientKey } from '@/lib/foundation/rate-limit'
import { audit } from '@/lib/foundation/auth'
import { escapeHtml } from '@/lib/foundation/scheduler/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function page(title: string, message: string, tone: 'ok' | 'error' = 'ok'): Response {
  const color = tone === 'ok' ? '#16a34a' : '#dc2626'
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b0f1a;color:#e5e7eb;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}
.card{max-width:440px;background:#151b2c;border:1px solid #232a3d;border-radius:12px;padding:32px;text-align:center}
h1{font-size:18px;margin:0 0 12px;color:${color}}p{font-size:14px;line-height:1.5;color:#9ca3af;margin:0}</style></head>
<body><div class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></body></html>`
  return new Response(html, { status: tone === 'ok' ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`approve-link:${clientKey(request)}`, 20, 60_000, Date.now())
  if (!rl.ok) return page('Too many attempts', `Retry in ${rl.retryAfterSec}s.`, 'error')

  const { token } = await params
  const payload = verifyApproveToken(token, Date.now())
  if (!payload) return page('Link expired or invalid', 'This approval link is no longer valid — it may have expired or already been used. Open RankForge to review and deploy this fix directly.', 'error')

  const store = await getStore()
  const [project, membership, rec] = await Promise.all([
    store.getProject(payload.projectId),
    (async () => {
      const p = await store.getProject(payload.projectId)
      return p ? store.getMembership(p.orgId, payload.userId) : null
    })(),
    store.getRecommendation(payload.recommendationId),
  ])
  if (!project) return page('Project not found', 'This project no longer exists.', 'error')
  // Re-verify the signer still has deploy authority NOW, not just when the
  // digest was sent — a demoted or removed admin's old link must not work.
  if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
    return page('Not authorized', 'The account this link was sent to no longer has permission to deploy fixes for this project.', 'error')
  }
  if (!rec || rec.projectId !== project.id) return page('Recommendation not found', 'This recommendation no longer exists — it may have been deleted.', 'error')
  if (rec.status !== 'accepted') {
    return page('Already handled', `This fix is no longer pending — its current status is "${rec.status}". Open RankForge to see the latest detail.`, rec.status === 'verified' ? 'ok' : 'error')
  }

  const conn = await store.getWpConnection(project.id)
  const pages = await latestScanPages(store, project.id)
  const sitePages = pages.map((p) => ({ url: String(p.url ?? ''), title: String((p.title as string) ?? '') })).filter((p) => p.url)
  const policy = policyOf(project)

  const result = await deployOneRecommendation({
    store, project, rec, scanPages: pages, sitePages, conn, policy,
    approvedBy: payload.userId, approve: true, dryRun: false,
    reasonSuffix: ' (approved via email link)',
  })

  await audit(project.orgId, payload.userId, 'operator.deploy.email-approve', project.id, `${rec.id}: ${result.ok ? 'verified' : result.error ?? result.stage ?? 'failed'}`)

  if (result.ok) return page('Fix deployed', `"${rec.title}" was deployed to WordPress and verified. Open RankForge for the full detail.`, 'ok')
  if (result.stage === 'connection') return page('WordPress not connected', 'Connect WordPress for this project before deploying fixes.', 'error')
  if (result.blocked) return page('Blocked for safety', result.error ?? 'This fix was blocked by a safety check and was not deployed.', 'error')
  return page('Deploy did not verify', result.note ?? result.error ?? 'The fix was applied but could not be verified — it has been reopened for review in RankForge.', 'error')
}
