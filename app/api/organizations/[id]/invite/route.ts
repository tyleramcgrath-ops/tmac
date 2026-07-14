import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { generateToken, getTokenExpiry } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email || !['owner', 'admin', 'manager', 'analyst', 'viewer'].includes(role)) {
      return Response.json(
        { error: 'email and valid role are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // Verify user has owner/admin role in this organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: session.userId,
        },
      },
    })

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return Response.json({ error: 'Only owners and admins can invite members' }, { status: 403 })
    }

    // Check if user is already a member
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        organizationMemberships: {
          where: { organizationId: id },
        },
      },
    })

    if (existing && existing.organizationMemberships.length > 0) {
      return Response.json({ error: 'User is already a member of this organization' }, { status: 409 })
    }

    // Check for pending invitation
    const pendingInvite = await prisma.teamInvitation.findFirst({
      where: {
        organizationId: id,
        email,
        acceptedAt: null,
      },
    })

    if (pendingInvite && pendingInvite.expiresAt > new Date()) {
      return Response.json({ error: 'Pending invitation already exists for this email' }, { status: 409 })
    }

    // Generate invitation token
    const token = generateToken(32)
    const expiresAt = getTokenExpiry(24 * 7) // 7 days

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        organizationId: id,
        email,
        role,
        token,
        expiresAt,
      },
    })

    // TODO: Send invitation email with link containing token

    return Response.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    })
  } catch (err) {
    console.error('[organizations/invite] Error', err)
    return Response.json(
      { error: `Failed to send invitation: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
