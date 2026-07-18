import { DEFAULT_ENGINES, computeCitationDeltas, runCitationCheck } from '@/lib/citations/check'
import { latestCitationSnapshot, listCitationSnapshots, previousCitationSnapshot } from '@/lib/citations/store'
import type { AiEngine } from '@/lib/citations/types'
import { getSite } from '@/lib/monitoring/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

// GET /api/citations?siteId=... — latest citation snapshot + history + deltas.
export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get('siteId')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  const latest = await latestCitationSnapshot(siteId)
  const history = await listCitationSnapshots(siteId)
  const deltas = latest ? computeCitationDeltas(await previousCitationSnapshot(siteId), latest) : []
  return Response.json({ latest, history, deltas })
}

// POST /api/citations { siteId, brandDomain?, queries?, engines? }
// Runs a fresh citation check. For a monitored site, brandDomain and queries
// default from the site's domain and its tracked keywords.
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

  const brandDomain = String(body.brandDomain ?? site.domain)
  const queries =
    Array.isArray(body.queries) && body.queries.length > 0
      ? body.queries.map((q) => String(q)).filter(Boolean)
      : Array.from(new Set(site.pages.map((p) => p.keyword))).filter(Boolean)
  if (queries.length === 0) {
    return Response.json({ error: 'No queries to check. Provide queries or add tracked keywords to the site.' }, { status: 400 })
  }
  const engines: AiEngine[] = Array.isArray(body.engines) && body.engines.length > 0 ? (body.engines as AiEngine[]) : DEFAULT_ENGINES

  const { snapshot, deltas } = await runCitationCheck(siteId, brandDomain, queries, engines)
  return Response.json({ snapshot, deltas })
}
