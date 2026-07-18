import { buildBrief } from '@/lib/engine/monitoring/brief'
import { getLatestRun, getPreviousRun, getSite } from '@/lib/engine/monitoring/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/monitor/brief?siteId=... — the latest "while you were away" brief,
// built from the most recent stored run. No run yet → an honest empty state.
export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get('siteId')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  if (!(await getSite(siteId))) return Response.json({ error: 'Site not found.' }, { status: 404 })

  const latest = await getLatestRun(siteId)
  if (!latest) {
    return Response.json({
      brief: null,
      message: 'No monitor run yet. Run a cycle to establish the first baseline.',
    })
  }
  const previous = await getPreviousRun(siteId)
  return Response.json({ brief: buildBrief(latest, previous?.ranAt ?? null), run: latest })
}
