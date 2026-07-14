import { getPrismaClient } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { setSessionCookie, createSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organizationMemberships: {
          where: { removedAt: null },
          include: { organization: true },
          take: 1,
        },
      },
    })

    if (!user || !user.passwordHash) {
      return Response.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash)
    if (!passwordValid) {
      return Response.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Get first organization (or create default if none)
    let org = user.organizationMemberships[0]?.organization
    let orgId = user.organizationMemberships[0]?.organizationId

    if (!org) {
      const newOrg = await prisma.organization.create({
        data: {
          name: user.name || email.split('@')[0],
          slug: `${email.split('@')[0]}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        },
      })
      await prisma.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId: user.id,
          role: 'owner',
        },
      })
      org = newOrg
      orgId = newOrg.id
    }

    // Create session
    const sessionToken = await createSession(user.id, orgId)
    await setSessionCookie(sessionToken)

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId!,
        userId: user.id,
        action: 'user.login',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent') || undefined,
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
    })
  } catch (err) {
    console.error('[auth/login] Error', err)
    return Response.json(
      { error: 'Failed to log in.' },
      { status: 500 }
    )
  }
}
