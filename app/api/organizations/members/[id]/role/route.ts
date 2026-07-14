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
    const { role } = body

    if (!role || !['owner', 'admin', 'manager', 'analyst', 'viewer'].includes(role)) {
      return Response.json({ error: 'Valid role is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Get member to update
    const memberToUpdate = await prisma.organizationMember.findUnique({
      where: { id },
      select: { organizationId: true, userId: true, role: true },
    })

    if (!memberToUpdate) {
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify requester is owner
    const requester = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: memberToUpdate.organizationId,
          userId: session.userId,
        },
      },
    })

    if (!requester || requester.role !== 'owner') {
      return Response.json({ error: 'Only organization owners can change member roles' }, { status: 403 })
    }

    // Prevent demoting the last owner
    if (memberToUpdate.role === 'owner' && role !== 'owner') {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: memberToUpdate.organizationId,
          role: 'owner',
        },
      })

      if (ownerCount === 1) {
        return Response.json({ error: 'Cannot demote the last owner of the organization' }, { status: 400 })
      }
    }

    // Update role
    const updated = await prisma.organizationMember.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId: memberToUpdate.organizationId,
        type: 'member',
        action: 'role_changed',
      },
    })

    return Response.json({
      success: true,
      member: updated,
    })
  } catch (err) {
    console.error('[organizations/members/role] Error', err)
    return Response.json(
      { error: `Failed to update member role: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
