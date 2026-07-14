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

    // Get member to remove
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id },
      select: { organizationId: true, userId: true, role: true },
    })

    if (!memberToRemove) {
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify requester has permission
    const requester = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: memberToRemove.organizationId,
          userId: session.userId,
        },
      },
    })

    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return Response.json({ error: 'Only owners and admins can remove members' }, { status: 403 })
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'owner') {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: memberToRemove.organizationId,
          role: 'owner',
        },
      })

      if (ownerCount === 1) {
        return Response.json({ error: 'Cannot remove the last owner from the organization' }, { status: 400 })
      }
    }

    // Remove member
    await prisma.organizationMember.update({
      where: { id },
      data: { removedAt: new Date() },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId: memberToRemove.organizationId,
        type: 'member',
        action: 'removed',
      },
    })

    return Response.json({
      success: true,
    })
  } catch (err) {
    console.error('[organizations/members/remove] Error', err)
    return Response.json(
      { error: `Failed to remove member: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
