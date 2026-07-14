import { clearSessionCookie, getSessionCookie, deleteSession, getCurrentSession } from '@/lib/session'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    const token = await getSessionCookie()

    if (token) {
      await deleteSession(token)
    }

    await clearSessionCookie()

    // Audit log
    if (session) {
      const prisma = getPrismaClient()
      await prisma.auditLog.create({
        data: {
          organizationId: session.organizationId || '',
          userId: session.userId,
          action: 'user.logout',
          resource: 'user',
          resourceId: session.userId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent') || undefined,
        },
      }).catch(() => {})
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[auth/logout] Error', err)
    return Response.json(
      { error: 'Failed to log out.' },
      { status: 500 }
    )
  }
}
