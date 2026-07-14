import { getPrismaClient } from '@/lib/db'
import { generateResetToken, getTokenExpiry } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return Response.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal whether email exists
      return Response.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new reset token (expires in 1 hour)
    const token = generateResetToken()
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: getTokenExpiry(1),
      },
    })

    // TODO: Send email with reset link
    // Email should contain: https://tmac.example.com/auth/reset-password?token=<token>

    console.log(`[auth/password-reset-request] Reset token for ${email}: ${token}`)

    return Response.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (err) {
    console.error('[auth/password-reset-request] Error', err)
    return Response.json(
      { error: 'Failed to process password reset request.' },
      { status: 500 }
    )
  }
}
