import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return Response.json(
        { error: 'Verification token is required.' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // Find verification token
    const verifyToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verifyToken) {
      return Response.json(
        { error: 'Invalid or expired verification token.' },
        { status: 400 }
      )
    }

    if (verifyToken.expiresAt < new Date()) {
      return Response.json(
        { error: 'Verification token has expired.' },
        { status: 400 }
      )
    }

    if (verifyToken.usedAt) {
      return Response.json(
        { error: 'Email already verified.' },
        { status: 400 }
      )
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: verifyToken.userId },
      data: { emailVerified: new Date() },
    })

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: verifyToken.id },
      data: { usedAt: new Date() },
    })

    // Audit log - need to get org from membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: verifyToken.userId, removedAt: null },
      select: { organizationId: true },
    })

    if (membership) {
      await prisma.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: verifyToken.userId,
          action: 'user.email_verified',
          resource: 'user',
          resourceId: verifyToken.userId,
        },
      })
    }

    return Response.json({
      success: true,
      message: 'Email verified successfully.',
    })
  } catch (err) {
    console.error('[auth/verify-email] Error', err)
    return Response.json(
      { error: 'Failed to verify email.' },
      { status: 500 }
    )
  }
}
