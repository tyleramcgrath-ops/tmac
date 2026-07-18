import { getStore } from '@/lib/engine/db'
import { applyProposal } from '@/lib/engine/monitoring/proposals'
import { getProposal } from '@/lib/engine/monitoring/store'
import { WpError, type WpConnection } from '@/lib/engine/wordpress'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/automation/apply { proposalId, connection, includeFaq }
// Publishes the approved, auto-appliable changes to WordPress. The connection
// (site + username + application password) is supplied per-request and never
// stored server-side.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const proposalId = String(body.proposalId ?? '')
  if (!proposalId) return Response.json({ error: 'Missing proposalId.' }, { status: 400 })

  const c = (body.connection ?? {}) as Record<string, unknown>
  const conn: WpConnection = {
    site: String(c.site ?? ''),
    username: String(c.username ?? ''),
    appPassword: String(c.appPassword ?? ''),
  }
  if (!conn.site || !conn.username || !conn.appPassword) {
    return Response.json({ error: 'A WordPress connection (site, username, application password) is required to publish.' }, { status: 400 })
  }

  const proposal = await getProposal(proposalId)
  if (!proposal) return Response.json({ error: 'Proposal not found.' }, { status: 404 })

  const report = await (await getStore()).getReport(proposal.reportId)
  if (!report) return Response.json({ error: 'The report behind this proposal is no longer available.' }, { status: 404 })

  try {
    const updated = await applyProposal(proposalId, conn, report, { includeFaq: body.includeFaq === true })
    return Response.json({ proposal: updated })
  } catch (err) {
    if (err instanceof WpError) return Response.json({ error: err.userMessage }, { status: 502 })
    const message = err instanceof Error ? err.message : 'Publish failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
