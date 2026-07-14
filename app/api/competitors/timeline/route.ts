// Get competitor timeline of changes

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const competitorId = url.searchParams.get('competitorId')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

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

    // Build query filters
    const whereClause: Record<string, unknown> = {
      competitor: { projectId },
    }

    if (competitorId) {
      whereClause.competitorId = competitorId
    }

    // Get total count
    const totalCount = await prisma.competitorChange.count({
      where: whereClause,
    })

    // Get changes with pagination
    const changes = await prisma.competitorChange.findMany({
      where: whereClause,
      include: {
        competitor: {
          select: {
            id: true,
            domain: true,
            displayName: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Group by day for timeline
    const timeline: Record<
      string,
      Array<{
        id: string
        competitorDomain: string
        competitorDisplayName: string
        type: string
        severity: string
        description: string
        count: number
        impact?: string
      }>
    > = {}

    for (const change of changes) {
      const dateKey = change.detectedAt.toISOString().split('T')[0]
      if (!timeline[dateKey]) {
        timeline[dateKey] = []
      }

      timeline[dateKey].push({
        id: change.id,
        competitorDomain: change.competitor.domain,
        competitorDisplayName: change.competitor.displayName,
        type: change.type,
        severity: change.severity,
        description: change.description,
        count: change.count,
        impact: change.impact || undefined,
      })
    }

    // Sort dates descending
    const sortedTimeline = Object.entries(timeline)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, items]) => ({
        date,
        items,
        count: items.length,
      }))

    return Response.json({
      projectId,
      total: totalCount,
      limit,
      offset,
      timeline: sortedTimeline,
    })
  } catch (err) {
    console.error('[competitors/timeline] Error', err)
    return Response.json(
      { error: `Failed to get timeline: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
