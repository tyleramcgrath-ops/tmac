import { verifyPassword } from '@/lib/foundation/crypto'
import { assertSameOrigin, handled, sessionCookieFor } from '@/lib/foundation/auth'
import { clientKey, rateLimit } from '@/lib/foundation/rate-limit'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Brute-force / credential-stuffing cap (Phase D.6 P6): 10 attempts / 5 min,
// keyed by client IP + target email so one attacker can't grind an account.
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 5 * 60 * 1000

export const POST = handled(async (request) => {
  assertSameOrigin(request)
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  const gate = rateLimit(`login:${clientKey(request)}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS, Date.now())
  if (!gate.ok) {
    return Response.json(
      { error: 'Too many sign-in attempts. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    )
  }

  const store = await getStore()
  const user = await store.getUserByEmail(email)
  // Identical error for unknown email vs wrong password.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  return new Response(
    JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': await sessionCookieFor(user.id, user.tokenVersion ?? 0),
      },
    }
  )
})
