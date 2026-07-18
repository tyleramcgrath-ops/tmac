import { getStore } from '@/lib/engine/db'
import { buildProposalFromReport } from '@/lib/engine/monitoring/proposals'
import { getSite, listProposals, saveProposal } from '@/lib/engine/monitoring/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/automation/proposals?siteId=... — the Compass's pending fix queue.
export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get('siteId')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  return Response.json({ proposals: await listProposals(siteId) })
}

// POST /api/automation/proposals { siteId, reportId } — turn a report's
// recommendations into an approvable change set.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const siteId = String(body.siteId ?? '')
  const reportId = String(body.reportId ?? '')
  if (!siteId || !reportId) return Response.json({ error: 'siteId and reportId are required.' }, { status: 400 })
  if (!(await getSite(siteId))) return Response.json({ error: 'Site not found.' }, { status: 404 })

  const report = await (await getStore()).getReport(reportId)
  if (!report) return Response.json({ error: 'Report not found.' }, { status: 404 })

  const proposal = buildProposalFromReport(siteId, report)
  if (proposal.changes.length === 0) {
    return Response.json({ proposal: null, message: 'No changes to propose — the page already covers the essentials.' })
  }
  await saveProposal(proposal)
  return Response.json({ proposal }, { status: 201 })
}
