import { sanitizeKeyOverrides } from '@/lib/config'
import { deliverBrief } from '@/lib/delivery/deliver'
import { buildBrief } from '@/lib/monitoring/brief'
import { runMonitorCycle } from '@/lib/monitoring/monitor'
import { getPreviousRun, getSite } from '@/lib/monitoring/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// A cycle re-runs the full pipeline for each tracked page.
export const maxDuration = 300

// POST /api/monitor/run { siteId } — run one monitor cycle and return the
// resulting run plus the "while you were away" brief built from real deltas.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const siteId = String(body.siteId ?? '')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  if (!(await getSite(siteId))) return Response.json({ error: 'Site not found.' }, { status: 404 })

  const keyOverrides = sanitizeKeyOverrides(body.keyOverrides)
  const previous = await getPreviousRun(siteId)

  try {
    const site = await getSite(siteId)
    const run = await runMonitorCycle(siteId, keyOverrides)
    const brief = buildBrief(run, previous?.ranAt ?? null)
    // Optionally reach out over connected channels the moment the cycle finishes.
    const delivered = body.deliver === true && site ? await deliverBrief(site, brief) : []
    return Response.json({ run, brief, delivered })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monitor cycle failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
