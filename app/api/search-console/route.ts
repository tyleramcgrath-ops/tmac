// GSC workspace data. Honest about connection state: reports not_configured /
// disconnected / connected / healthy and only returns metrics that were really
// synced. Never fabricates clicks, impressions, CTR, or position.

import { getCurrentSession } from '@/lib/session'
import { getGoogleReadiness } from '@/lib/google/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const readiness = getGoogleReadiness()
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  if (!projectId) return Response.json({ error: 'Missing projectId.' }, { status: 400 })

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, domain: true, organizationId: true } })
  if (!project || project.organizationId !== session.organizationId) return Response.json({ error: 'Project not found.' }, { status: 404 })

  const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' }, select: { gscPropertyUrl: true } })
  const rows = cred?.gscPropertyUrl ? await prisma.googleSearchConsoleMetric.findMany({ where: { projectId }, orderBy: { impressions: 'desc' }, take: 200 }) : []

  // Data presence wins: real synced rows always display as healthy, regardless
  // of current env config. Config/connection states only matter before data.
  const state = rows.length > 0 ? 'healthy' : !readiness.configured ? 'not_configured' : !cred?.gscPropertyUrl ? 'disconnected' : 'connected'

  if (rows.length === 0) {
    return Response.json({ ok: true, state, project: { name: project.name, domain: project.domain }, connected: !!cred?.gscPropertyUrl, totals: null, topPages: [], ctrOpportunities: [], lastSync: null })
  }

  const totals = rows.reduce((acc: any, r: any) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }), { clicks: 0, impressions: 0 })
  const avgPosition = rows.length ? Math.round((rows.reduce((a: number, r: any) => a + r.position, 0) / rows.length) * 10) / 10 : null
  const ctr = totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 1000) / 10 : 0
  const lastSync = rows.reduce((max: Date | null, r: any) => (!max || r.syncedAt > max ? r.syncedAt : max), null as Date | null)

  // CTR opportunities: high impressions, low CTR — a title/meta rewrite target.
  const ctrOpportunities = rows
    .filter((r: any) => r.impressions >= 100 && r.ctr < 0.02)
    .sort((a: any, b: any) => b.impressions - a.impressions)
    .slice(0, 20)
    .map((r: any) => ({ url: r.url, impressions: r.impressions, clicks: r.clicks, ctr: r.ctr, position: r.position }))

  return Response.json({
    ok: true, state, connected: true,
    project: { name: project.name, domain: project.domain },
    totals: { clicks: totals.clicks, impressions: totals.impressions, ctr, avgPosition },
    topPages: rows.slice(0, 20).map((r: any) => ({ url: r.url, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    ctrOpportunities,
    lastSync,
  })
}
