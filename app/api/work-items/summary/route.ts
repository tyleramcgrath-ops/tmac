// Get work item summary for a project (dashboard stats)

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

    // Get stats by status
    const itemsByStatus = await prisma.workItem.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
      _sum: {
        estimatedTraffic: true,
        estimatedRevenue: true,
      },
    })

    // Get stats by priority
    const itemsByPriority = await prisma.workItem.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true,
      _sum: {
        estimatedTraffic: true,
      },
    })

    // Get recent completed
    const recentCompleted = await prisma.workItem.findMany({
      where: {
        projectId,
        status: 'completed',
      },
      orderBy: { verifiedAt: 'desc' },
      take: 5,
    })

    // Get pending approval
    const pendingApproval = await prisma.workItem.findMany({
      where: {
        projectId,
        status: 'previewed',
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    })

    // Calculate totals
    const allItems = await prisma.workItem.findMany({
      where: { projectId },
    })

    const totalTraffic = allItems.reduce((sum, item) => sum + item.estimatedTraffic, 0)
    const totalRevenue = allItems.reduce((sum, item) => sum + item.estimatedRevenue, 0)

    return Response.json({
      projectId,
      total: allItems.length,
      totalEstimatedTraffic: totalTraffic,
      totalEstimatedRevenue: Math.round(totalRevenue * 100) / 100,
      byStatus: Object.fromEntries(
        itemsByStatus.map((s) => [
          s.status,
          {
            count: s._count,
            estimatedTraffic: s._sum.estimatedTraffic || 0,
            estimatedRevenue: Math.round((s._sum.estimatedRevenue || 0) * 100) / 100,
          },
        ])
      ),
      byPriority: Object.fromEntries(
        itemsByPriority.map((p) => [
          p.priority,
          {
            count: p._count,
            estimatedTraffic: p._sum.estimatedTraffic || 0,
          },
        ])
      ),
      recentCompleted: recentCompleted.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        verificationStatus: item.verificationStatus,
        verifiedAt: item.verifiedAt,
      })),
      pendingApproval: pendingApproval.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        url: item.url,
        priority: item.priority,
      })),
    })
  } catch (err) {
    console.error('[work-items/summary] Error', err)
    return Response.json(
      { error: `Failed to get summary: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
