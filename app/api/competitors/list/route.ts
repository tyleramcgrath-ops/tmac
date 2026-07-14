// List competitors for a project

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

    // Get all competitors with latest snapshot count
    const competitors = await prisma.competitor.findMany({
      where: { projectId },
      include: {
        snapshots: {
          orderBy: { crawledAt: 'desc' },
          take: 1,
        },
        changes: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { dateAdded: 'desc' },
    })

    const competitorSummary = competitors.map((c) => ({
      id: c.id,
      domain: c.domain,
      displayName: c.displayName,
      industry: c.industry,
      monitoringStatus: c.monitoringStatus,
      crawlFrequency: c.crawlFrequency,
      dateAdded: c.dateAdded,
      lastCrawl: c.lastCrawl,
      lastComparison: c.lastComparison,
      latestSnapshot: c.snapshots.length > 0 ? c.snapshots[0].crawledAt : null,
      recentChanges: c.changes.length,
      hasSnapshot: c.snapshots.length > 0,
    }))

    return Response.json({
      projectId,
      count: competitors.length,
      competitors: competitorSummary,
    })
  } catch (err) {
    console.error('[competitors/list] Error', err)
    return Response.json(
      { error: `Failed to list competitors: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
