// The signed-in user for server components and server actions.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, readSessionToken } from './auth'
import { getStore, type User } from './store'

export async function currentUser(): Promise<User | null> {
  const jar = await cookies()
  const uid = readSessionToken(jar.get(SESSION_COOKIE)?.value)
  return uid ? getStore().userById(uid) : null
}

export async function requireUser(): Promise<User> {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}

export async function startSession(userId: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}
