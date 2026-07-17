import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      select: { organizationId: true, isFavorite: true },
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

    if (!member) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Toggle favorite
    const updated = await prisma.project.update({
      where: { id },
      data: { isFavorite: !project.isFavorite },
      select: {
        id: true,
        isFavorite: true,
      },
    })

    return Response.json({
      success: true,
      isFavorite: updated.isFavorite,
    })
  } catch (err) {
    console.error('[projects/favorite] Error', err)
    return Response.json(
      { error: `Failed to update favorite: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
