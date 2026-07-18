import { deliverBrief } from '@/lib/delivery/deliver'
import { buildBrief } from '@/lib/monitoring/brief'
import { getLatestRun, getPreviousRun, getSite } from '@/lib/monitoring/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/deliver { siteId } — send the latest "while you were away" brief to
// every channel the site has connected (Slack, email).
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const siteId = String(body.siteId ?? '')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  const site = await getSite(siteId)
  if (!site) return Response.json({ error: 'Site not found.' }, { status: 404 })

  const latest = await getLatestRun(siteId)
  if (!latest) return Response.json({ error: 'No monitor run yet — nothing to deliver.' }, { status: 400 })

  const brief = buildBrief(latest, (await getPreviousRun(siteId))?.ranAt ?? null)
  const results = await deliverBrief(site, brief)
  if (results.length === 0) {
    return Response.json({ delivered: [], message: 'No delivery channels connected. Connect Slack or email first.' })
  }
  return Response.json({ delivered: results })
}
