// GA4 workspace data. Honest about connection state and never invents
// conversions or revenue — only real synced GA4 metrics are returned.

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

  const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' }, select: { ga4PropertyId: true } })
  const rows = cred?.ga4PropertyId ? await prisma.googleAnalytics4Metric.findMany({ where: { projectId }, orderBy: { sessions: 'desc' }, take: 200 }) : []

  // Data presence wins: real synced rows always display as healthy, regardless
  // of current env config. Config/connection states only matter before data.
  const state = rows.length > 0 ? 'healthy' : !readiness.configured ? 'not_configured' : !cred?.ga4PropertyId ? 'disconnected' : 'connected'

  if (rows.length === 0) {
    return Response.json({ ok: true, state, connected: !!cred?.ga4PropertyId, project: { name: project.name, domain: project.domain }, totals: null, landingPages: [], highTrafficLowConversion: [], lastSync: null })
  }

  const totals = rows.reduce((acc: any, r: any) => ({
    sessions: acc.sessions + r.sessions, users: acc.users + r.users,
    conversions: acc.conversions + r.conversions, revenue: acc.revenue + r.revenue,
  }), { sessions: 0, users: 0, conversions: 0, revenue: 0 })
  const lastSync = rows.reduce((max: Date | null, r: any) => (!max || r.syncedAt > max ? r.syncedAt : max), null as Date | null)
  const hasRevenue = rows.some((r: any) => r.revenue > 0)

  // High traffic, low/no conversions — a CRO/intent target.
  const highTrafficLowConversion = rows
    .filter((r: any) => r.sessions >= 50 && r.conversions === 0)
    .sort((a: any, b: any) => b.sessions - a.sessions)
    .slice(0, 20)
    .map((r: any) => ({ url: r.url, sessions: r.sessions, conversions: r.conversions }))

  return Response.json({
    ok: true, state, connected: true,
    project: { name: project.name, domain: project.domain },
    totals: {
      sessions: totals.sessions, users: totals.users, conversions: totals.conversions,
      // Revenue is null (not zero) when GA4 reports no revenue — never invented.
      revenue: hasRevenue ? Math.round(totals.revenue * 100) / 100 : null,
      conversionRate: totals.sessions > 0 ? Math.round((totals.conversions / totals.sessions) * 1000) / 10 : 0,
    },
    landingPages: rows.slice(0, 20).map((r: any) => ({ url: r.url, sessions: r.sessions, conversions: r.conversions, engagementRate: r.engagementRate, revenue: r.revenue > 0 ? r.revenue : null })),
    highTrafficLowConversion,
    lastSync,
  })
}
