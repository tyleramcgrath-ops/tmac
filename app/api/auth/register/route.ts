import { getPrismaClient } from '@/lib/db'
import { hashPassword, generateVerifyToken, getTokenExpiry } from '@/lib/auth'
import { setSessionCookie, createSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required.' },
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

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return Response.json(
        { error: 'Email already registered.' },
        { status: 409 }
      )
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
      },
    })

    // Create email verification token
    const verifyToken = generateVerifyToken()
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verifyToken,
        expiresAt: getTokenExpiry(24),
      },
    })

    // Create default organization for user
    const org = await prisma.organization.create({
      data: {
        name: name || email.split('@')[0],
        slug: `${email.split('@')[0]}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      },
    })

    // Add user as owner of organization
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
      },
    })

    // Create session and set cookie
    const sessionToken = await createSession(user.id, org.id)
    await setSessionCookie(sessionToken)

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: 'user.registered',
        resource: 'user',
        resourceId: user.id,
      },
    })

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      requiresEmailVerification: true,
    })
  } catch (err) {
    console.error('[auth/register] Error', err)
    return Response.json(
      { error: 'Failed to register user.' },
      { status: 500 }
    )
  }
}
