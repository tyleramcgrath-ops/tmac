import { getCurrentSession } from '@/lib/session'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      )
    }

    const prisma = getPrismaClient()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return Response.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId || '' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    return Response.json({
      user,
      organization: org,
      role: session.role,
    })
  } catch (err) {
    console.error('[auth/session] Error', err)
    return Response.json(
      { error: 'Failed to get session.' },
      { status: 500 }
    )
  }
}
