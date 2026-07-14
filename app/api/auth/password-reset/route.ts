import { getPrismaClient } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return Response.json(
        { error: 'Token and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return Response.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return Response.json(
        { error: 'Reset token has expired.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return Response.json(
        { error: 'Reset token has already been used.' },
        { status: 400 }
      )
    }

    // Update password
    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    // Delete all other sessions for this user
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: resetToken.user.id, // Placeholder - no org context here
        userId: resetToken.userId,
        action: 'user.password_reset',
        resource: 'user',
        resourceId: resetToken.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return Response.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    })
  } catch (err) {
    console.error('[auth/password-reset] Error', err)
    return Response.json(
      { error: 'Failed to reset password.' },
      { status: 500 }
    )
  }
}
