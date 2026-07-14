// Get single work item with full details

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const workItemId = url.searchParams.get('workItemId')

  if (!workItemId) {
    return Response.json({ error: 'workItemId is required.' }, { status: 400 })
  }

  try {
    const prisma = getPrismaClient()

    const item = await prisma.workItem.findUnique({
      where: { id: workItemId },
    })

    if (!item) {
      return Response.json({ error: 'Work item not found.' }, { status: 404 })
    }

    return Response.json({
      id: item.id,
      projectId: item.projectId,
      url: item.url,
      type: item.type,
      title: item.title,
      description: item.description,
      why: item.why,
      status: item.status,
      priority: item.priority,
      confidence: item.confidence,
      estimatedTraffic: item.estimatedTraffic,
      estimatedRevenue: item.estimatedRevenue,
      generatedFix: item.generatedFix ? JSON.parse(item.generatedFix) : null,
      fixPreview: item.fixPreview,
      approvedAt: item.approvedAt,
      approvedBy: item.approvedBy,
      deployedAt: item.deployedAt,
      deploymentId: item.deploymentId,
      deploymentStatus: item.deploymentStatus,
      verifiedAt: item.verifiedAt,
      beforeMetrics: item.beforeMetrics ? JSON.parse(item.beforeMetrics) : null,
      afterMetrics: item.afterMetrics ? JSON.parse(item.afterMetrics) : null,
      verificationStatus: item.verificationStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })
  } catch (err) {
    console.error('[work-items/get] Error', err)
    return Response.json(
      { error: `Failed to get work item: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
