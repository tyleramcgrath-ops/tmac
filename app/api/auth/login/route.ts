import { verifyPassword } from '@/lib/foundation/crypto'
import { handled, sessionCookieFor } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const POST = handled(async (request) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  const store = await getStore()
  const user = await store.getUserByEmail(email)
  // Identical error for unknown email vs wrong password.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  return new Response(
    JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': await sessionCookieFor(user.id) } }
  )
})
