import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

  
    const prisma = getPrismaClient()

    // Verify user has access to this organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: session.userId,
        },
      },
    })

    if (!member) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get organization with members and pending invitations
    const org = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            invitedBy: true,
          },
        },
        teamInvitations: {
          where: { acceptedAt: null },
          select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    })

    if (!org) {
      return Response.json({ error: 'Organization not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      organization: org,
    })
  } catch (err) {
    console.error('[organizations/get] Error', err)
    return Response.json(
      { error: `Failed to fetch organization: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
