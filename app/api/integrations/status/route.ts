// Check integration status for a project

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
  }

  try {
    const prisma = getPrismaClient()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Check what integrations are connected
    const googleCred = await prisma.oAuthCredential.findUnique({
      where: {
        projectId_provider: {
          projectId,
          provider: 'google',
        },
      },
    })

    // Get latest GSC data sync info
    const latestGSC = await prisma.googleSearchConsoleMetric.findFirst({
      where: { projectId },
      orderBy: { syncedAt: 'desc' },
    })

    return Response.json({
      projectId,
      integrations: {
        google: {
          connected: !!googleCred,
          connectedAt: googleCred?.createdAt,
          expiresAt: googleCred?.expiresAt,
          lastSync: latestGSC?.syncedAt,
          lastDataDate: latestGSC?.dataDate,
          dataPoints: latestGSC ? await prisma.googleSearchConsoleMetric.count({ where: { projectId } }) : 0,
        },
      },
    })
  } catch (err) {
    console.error('[integrations/status] Error', err)
    return Response.json(
      { error: `Failed to check integration status: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
