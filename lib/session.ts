import { getPrismaClient } from './db'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'tmac_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

interface SessionData {
  userId: string
  organizationId?: string
  role?: string
}

export async function createSession(userId: string, organizationId?: string): Promise<string> {
  const prisma = getPrismaClient()
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await prisma.session.create({
    data: {
      id: sessionToken,
      userId,
      expiresAt,
    },
  })

  return sessionToken
}

export async function getSession(sessionToken: string): Promise<SessionData | null> {
  const prisma = getPrismaClient()

  const session = await prisma.session.findUnique({
    where: { id: sessionToken },
    include: {
      user: {
        include: {
          organizationMemberships: {
            where: { removedAt: null },
            take: 1,
          },
        },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionToken } })
    return null
  }

  const orgMember = session.user.organizationMemberships[0]

  return {
    userId: session.userId,
    organizationId: orgMember?.organizationId,
    role: orgMember?.role,
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  const prisma = getPrismaClient()
  await prisma.session.delete({
    where: { id: sessionToken },
  }).catch(() => {})
}

export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentSession(): Promise<SessionData | null> {
  const token = await getSessionCookie()
  if (!token) return null
  return getSession(token)
}

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
