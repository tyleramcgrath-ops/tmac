import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    if (!member || member.role !== 'owner') {
      return Response.json({ error: 'Only organization owners can delete projects' }, { status: 403 })
    }

    // Delete project (cascades to audits, pages, issues, etc.)
    await prisma.project.delete({
      where: { id },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId: project.organizationId,
        projectId: id,
        type: 'project',
        action: 'deleted',
      },
    })

    return Response.json({
      success: true,
    })
  } catch (err) {
    console.error('[projects/delete] Error', err)
    return Response.json(
      { error: `Failed to delete project: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
