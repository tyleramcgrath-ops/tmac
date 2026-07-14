// Update work item status and data through workflow

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const workItemId = String(body.workItemId ?? '')
  const status = String(body.status ?? '') // detected, explained, generated, previewed, approved, deployed, verified, completed
  const data = body.data as Record<string, unknown> | undefined

  if (!workItemId || !status) {
    return Response.json(
      { error: 'workItemId and status are required.' },
      { status: 400 }
    )
  }

  const validStatuses = [
    'detected',
    'explained',
    'generated',
    'previewed',
    'approved',
    'deployed',
    'verified',
    'completed',
  ]
  if (!validStatuses.includes(status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const item = await prisma.workItem.findUnique({
      where: { id: workItemId },
    })

    if (!item) {
      return Response.json({ error: 'Work item not found.' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { status }

    // Handle status-specific data
    if (status === 'explained' && data?.why) {
      updateData.why = String(data.why)
    }

    if (status === 'generated' && data?.generatedFix) {
      updateData.generatedFix = JSON.stringify(data.generatedFix)
    }

    if (status === 'previewed' && data?.preview) {
      updateData.fixPreview = String(data.preview)
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = String(data?.approvedBy ?? 'system')
    }

    if (status === 'deployed' && data?.deploymentId) {
      updateData.deployedAt = new Date()
      updateData.deploymentId = String(data.deploymentId)
      updateData.deploymentStatus = 'success'
      updateData.beforeMetrics = data.beforeMetrics ? JSON.stringify(data.beforeMetrics) : null
    }

    if (status === 'verified' && data?.afterMetrics) {
      updateData.verifiedAt = new Date()
      updateData.afterMetrics = JSON.stringify(data.afterMetrics)
      updateData.verificationStatus = String(data.verificationStatus ?? 'improved') // improved, no_change, regressed
    }

    if (status === 'completed') {
      updateData.updatedAt = new Date()
    }

    // Update the work item
    const updated = await prisma.workItem.update({
      where: { id: workItemId },
      data: updateData,
    })

    return Response.json({
      success: true,
      workItem: {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        approvedAt: updated.approvedAt,
        deployedAt: updated.deployedAt,
        verifiedAt: updated.verifiedAt,
      },
    })
  } catch (err) {
    console.error('[work-items/update] Error', err)
    return Response.json(
      { error: `Failed to update work item: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
