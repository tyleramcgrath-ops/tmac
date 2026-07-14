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

    if (invitation.acceptedAt) {
      return Response.json({ error: 'Invitation has already been accepted' }, { status: 400 })
    }

    // Verify email matches current user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user || user.email !== invitation.email) {
      return Response.json({ error: 'Invitation does not match your account' }, { status: 403 })
    }

    // Decline by deleting the invitation
    await prisma.teamInvitation.delete({
      where: { id: invitation.id },
    })

    return Response.json({
      success: true,
    })
  } catch (err) {
    console.error('[organizations/invitations/decline] Error', err)
    return Response.json(
      { error: `Failed to decline invitation: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
