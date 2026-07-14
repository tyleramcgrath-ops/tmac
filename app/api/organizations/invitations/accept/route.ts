import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return Response.json({ error: 'Invitation token is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Find and validate invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return Response.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    if (invitation.expiresAt < new Date()) {
      return Response.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    if (invitation.acceptedAt) {
      return Response.json({ error: 'Invitation has already been accepted' }, { status: 400 })
    }

    // Get user to verify email matches
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user || user.email !== invitation.email) {
      return Response.json({ error: 'Invitation email does not match your account' }, { status: 403 })
    }

    // Check if already a member
    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: session.userId,
        },
      },
    })

    if (existing) {
      return Response.json({ error: 'You are already a member of this organization' }, { status: 409 })
    }

    // Accept invitation
    await prisma.$transaction([
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          userId: session.userId,
        },
      }),
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: session.userId,
          role: invitation.role,
          joinedAt: new Date(),
        },
      }),
    ])

    const org = await prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    return Response.json({
      success: true,
      organization: org,
    })
  } catch (err) {
    console.error('[organizations/invitations/accept] Error', err)
    return Response.json(
      { error: `Failed to accept invitation: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
