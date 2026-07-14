import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      select: { organizationId: true, status: true },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status === 'archived') {
      return Response.json({ error: 'Project is already archived' }, { status: 400 })
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

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return Response.json({ error: 'Only owners and admins can archive projects' }, { status: 403 })
    }

    // Archive project
    const updated = await prisma.project.update({
      where: { id },
      data: { status: 'archived' },
      select: {
        id: true,
        status: true,
      },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId: project.organizationId,
        projectId: id,
        type: 'project',
        action: 'archived',
      },
    })

    return Response.json({
      success: true,
      project: updated,
    })
  } catch (err) {
    console.error('[projects/archive] Error', err)
    return Response.json(
      { error: `Failed to archive project: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
