import { randomUUID } from 'crypto'
import { hashPassword } from '@/lib/foundation/crypto'
import { audit, handled, sessionCookieFor } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const POST = handled(async (request) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email ?? '').trim().toLowerCase()
  const name = String(body.name ?? '').trim().slice(0, 80)
  const password = String(body.password ?? '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 10) {
    return Response.json({ error: 'Password must be at least 10 characters.' }, { status: 400 })
  }

  const store = await getStore()
  if (await store.getUserByEmail(email)) {
    return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const user = { id: randomUUID(), email, name: name || email.split('@')[0], passwordHash: await hashPassword(password), createdAt: now }
  await store.createUser(user)

  // Every user gets a personal organization; teams invite into shared orgs.
  const org = { id: randomUUID(), name: `${user.name}'s workspace`, createdAt: now }
  await store.createOrg(org, user.id)
  await audit(org.id, user.id, 'user.signup', user.id, email)

  return new Response(JSON.stringify({ user: { id: user.id, email, name: user.name }, org }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': await sessionCookieFor(user.id) },
  })
})
