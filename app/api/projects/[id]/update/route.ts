import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, monthlyVisits, valuePerVisit, wpSiteUrl, wpUser, wpAppPassword } = body

    const prisma = getPrismaClient()

    // Get project and verify access
    const project = await prisma.project.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify user has access
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: project.organizationId,
          userId: session.userId,
        },
      },
    })

    if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update project
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (monthlyVisits !== undefined) updateData.monthlyVisits = monthlyVisits
    if (valuePerVisit !== undefined) updateData.valuePerVisit = valuePerVisit
    if (wpSiteUrl !== undefined) updateData.wpSiteUrl = wpSiteUrl
    if (wpUser !== undefined) updateData.wpUser = wpUser
    if (wpAppPassword !== undefined) updateData.wpAppPassword = wpAppPassword

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        isFavorite: true,
        monthlyVisits: true,
        valuePerVisit: true,
        updatedAt: true,
      },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId: project.organizationId,
        projectId: id,
        type: 'project',
        action: 'updated',
      },
    })

    return Response.json({
      success: true,
      project: updated,
    })
  } catch (err) {
    console.error('[projects/update] Error', err)
    return Response.json(
      { error: `Failed to update project: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
