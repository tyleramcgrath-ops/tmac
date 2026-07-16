// Google Connection Center status — honest, never-crashing readiness + per
// integration connection state for a project. Reports "not configured" with the
// exact missing env-var names (no values) when OAuth isn't set up, rather than
// throwing a generic server error.

import { getCurrentSession } from '@/lib/session'
import { getGoogleReadiness, GSC_CALLBACK_PATH, GA4_CALLBACK_PATH } from '@/lib/google/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const readiness = getGoogleReadiness()

  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    // DB down is orthogonal to OAuth readiness — still report config state.
    return Response.json({ ok: true, readiness, project: null, gsc: null, ga4: null, dbAvailable: false })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  let gsc: any = null
  let ga4: any = null
  let projectMeta: any = null

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, domain: true, organizationId: true } })
    if (!project || project.organizationId !== session.organizationId) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }
    projectMeta = { id: project.id, name: project.name, domain: project.domain }

    const cred = await prisma.oAuthCredential.findFirst({
      where: { projectId, provider: 'google' },
      select: { gscPropertyUrl: true, ga4PropertyId: true, scope: true, expiresAt: true, lastUsedAt: true, createdAt: true },
    })

    const gscCount = cred ? await prisma.googleSearchConsoleMetric.count({ where: { projectId } }) : 0
    const gscLatest = gscCount > 0 ? await prisma.googleSearchConsoleMetric.findFirst({ where: { projectId }, orderBy: { syncedAt: 'desc' }, select: { syncedAt: true, dataDate: true } }) : null
    const ga4Count = cred ? await prisma.googleAnalytics4Metric.count({ where: { projectId } }) : 0
    const ga4Latest = ga4Count > 0 ? await prisma.googleAnalytics4Metric.findFirst({ where: { projectId }, orderBy: { syncedAt: 'desc' }, select: { syncedAt: true, dataDate: true } }) : null

    // Derive a human connection state per integration.
    const stateOf = (connected: boolean, hasData: boolean, expiresAt: Date | null) => {
      if (!readiness.configured) return 'not_configured'
      if (!connected) return 'disconnected'
      if (expiresAt && expiresAt < new Date()) return 'authorization_required'
      if (!hasData) return 'connected'
      return 'healthy'
    }

    gsc = {
      state: stateOf(!!cred?.gscPropertyUrl, gscCount > 0, cred?.expiresAt ?? null),
      propertySelected: !!cred?.gscPropertyUrl,
      dataPoints: gscCount,
      lastSync: gscLatest?.syncedAt ?? null,
      lastDataDate: gscLatest?.dataDate ?? null,
      scopes: cred?.scope ? cred.scope.split(' ') : [],
    }
    ga4 = {
      state: stateOf(!!cred?.ga4PropertyId, ga4Count > 0, cred?.expiresAt ?? null),
      propertySelected: !!cred?.ga4PropertyId,
      dataPoints: ga4Count,
      lastSync: ga4Latest?.syncedAt ?? null,
      lastDataDate: ga4Latest?.dataDate ?? null,
      scopes: cred?.scope ? cred.scope.split(' ') : [],
    }
  }

  return Response.json({
    ok: true,
    readiness,
    callbackPaths: { gsc: GSC_CALLBACK_PATH, ga4: GA4_CALLBACK_PATH },
    project: projectMeta,
    gsc,
    ga4,
    dbAvailable: true,
  })
}
