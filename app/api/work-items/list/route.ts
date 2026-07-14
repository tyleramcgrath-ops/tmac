// List work items for a project

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const status = url.searchParams.get('status') // filter by status
  const priority = url.searchParams.get('priority') // filter by priority
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)

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

    // Build filter
    const where: Record<string, unknown> = { projectId }
    if (status) where.status = status
    if (priority) where.priority = priority

    // Fetch work items
    const [items, total] = await Promise.all([
      prisma.workItem.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.workItem.count({ where }),
    ])

    // Group by status
    const byStatus = {
      detected: 0,
      explained: 0,
      generated: 0,
      previewed: 0,
      approved: 0,
      deployed: 0,
      verified: 0,
      completed: 0,
    }

    for (const item of items) {
      if (item.status in byStatus) {
        byStatus[item.status as keyof typeof byStatus]++
      }
    }

    return Response.json({
      projectId,
      total,
      count: items.length,
      offset,
      limit,
      byStatus,
      items: items.map((item) => ({
        id: item.id,
        url: item.url,
        type: item.type,
        title: item.title,
        status: item.status,
        priority: item.priority,
        confidence: item.confidence,
        estimatedTraffic: item.estimatedTraffic,
        estimatedRevenue: item.estimatedRevenue,
        createdAt: item.createdAt,
        approvedAt: item.approvedAt,
        deployedAt: item.deployedAt,
        verifiedAt: item.verifiedAt,
      })),
    })
  } catch (err) {
    console.error('[work-items/list] Error', err)
    return Response.json(
      { error: `Failed to list work items: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
