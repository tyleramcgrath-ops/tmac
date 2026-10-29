import { randomUUID } from 'crypto'
import { hashPassword } from '@/lib/foundation/crypto'
import { assertSameOrigin, audit, handled, sessionCookieFor } from '@/lib/foundation/auth'
import { clientKey, rateLimit } from '@/lib/foundation/rate-limit'
import { signupAllowed } from '@/lib/foundation/env'
import { newTrialBilling } from '@/lib/foundation/billing'
import { sendVerificationEmail } from '@/lib/foundation/mailer'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Signup abuse cap (Phase D.6 P6): 5 new accounts / hour per client IP.
const SIGNUP_LIMIT = 5
const SIGNUP_WINDOW_MS = 60 * 60 * 1000

export const POST = handled(async (request) => {
  assertSameOrigin(request)
  const gate = rateLimit(`signup:${clientKey(request)}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS, Date.now())
  if (!gate.ok) {
    return Response.json(
      { error: 'Too many sign-up attempts. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    )
  }
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
  // Pilot allow-list gate (RC2 P6): when RF_SIGNUP_ALLOWLIST is set, only listed
  // emails/domains may register. Unset ⇒ open (dev/self-serve).
  if (!signupAllowed(email)) {
    return Response.json({ error: 'Sign-ups are limited during the pilot. Contact us for access.' }, { status: 403 })
  }

  const store = await getStore()
  if (await store.getUserByEmail(email)) {
    return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const now = new Date().toISOString()
  // Email verification (RC2 P4): the account is created unverified with a
  // 24h token, and a verification email is "sent" (logged-only unless a mail
  // webhook is configured — see mailer.ts). Non-blocking during the pilot.
  const verifyToken = randomUUID()
  const verifyTokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const user = { id: randomUUID(), email, name: name || email.split('@')[0], passwordHash: await hashPassword(password), tokenVersion: 0, emailVerified: false, verifyToken, verifyTokenExpiresAt, createdAt: now }
  await store.createUser(user)

  // Every user gets a personal organization; teams invite into shared orgs.
  // Billing starts a real 14-day trial regardless of whether Stripe is
  // configured on this deployment — isAutomationAllowed() only enforces it
  // when Stripe actually is configured, so this is harmless otherwise.
  const org = { id: randomUUID(), name: `${user.name}'s workspace`, createdAt: now, billing: newTrialBilling(now) }
  await store.createOrg(org, user.id)
  await audit(org.id, user.id, 'user.signup', user.id, email)

  const link = `${new URL(request.url).origin}/api/auth/verify?token=${verifyToken}`
  const mail = await sendVerificationEmail(email, link)

  return new Response(JSON.stringify({ user: { id: user.id, email, name: user.name, emailVerified: false }, org, emailDelivery: mail.via }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': await sessionCookieFor(user.id, 0) },
  })
})
