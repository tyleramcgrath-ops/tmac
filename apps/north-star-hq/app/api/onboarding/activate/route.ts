import { randomUUID, randomBytes } from 'crypto'
import { hashPassword } from '@/lib/foundation/crypto'
import { assertSameOrigin, audit, handled, sessionCookieFor } from '@/lib/foundation/auth'
import { clientKey, rateLimit } from '@/lib/foundation/rate-limit'
import { newTrialBilling } from '@/lib/foundation/billing'
import { getStore } from '@/lib/foundation/store'
import { seedSampleProject } from '@/lib/foundation/seed'

export const runtime = 'nodejs'

// There is no login/signup form anywhere in this app — see app/page.tsx's
// onboarding wizard. This route is the only way an account gets created: it
// silently provisions a synthetic user + org + seeded project from the
// wizard's answers, and sets the same session cookie a normal login would.
// Capped the same way signup used to be (abuse/cost control, not a real
// account-creation gate — there is no email/password for a human to reuse).
const ACTIVATE_LIMIT = 5
const ACTIVATE_WINDOW_MS = 60 * 60 * 1000

export const POST = handled(async (request) => {
  assertSameOrigin(request)
  const gate = rateLimit(`onboarding:${clientKey(request)}`, ACTIVATE_LIMIT, ACTIVATE_WINDOW_MS, Date.now())
  if (!gate.ok) {
    return Response.json(
      { error: 'Too many attempts. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const hqName = String(body.hqName ?? '').trim().slice(0, 80)
  const website = String(body.website ?? '').trim().slice(0, 200)
  const industry = String(body.industry ?? '').trim().slice(0, 80)
  if (!hqName) {
    return Response.json({ error: 'Give your Headquarters a name.' }, { status: 400 })
  }

  const store = await getStore()
  const now = new Date().toISOString()

  // Synthetic credentials — never shown to or entered by the user. They
  // exist only because the underlying auth/session machinery (shared with
  // the RankForge app this was forked from) is user-row-shaped; nothing
  // here is meant to be a real, reusable login.
  const email = `hq-${randomUUID()}@northstar.local`
  const password = randomBytes(24).toString('base64url')
  const user = {
    id: randomUUID(),
    email,
    name: hqName,
    passwordHash: await hashPassword(password),
    tokenVersion: 0,
    emailVerified: true,
    createdAt: now,
  }
  await store.createUser(user)

  const org = { id: randomUUID(), name: hqName, createdAt: now, billing: newTrialBilling(now) }
  await store.createOrg(org, user.id)
  await audit(org.id, user.id, 'onboarding.activated', user.id, hqName)
  await seedSampleProject(store, org.id, user.id, { name: hqName, domain: website, industry })

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': await sessionCookieFor(user.id, 0) },
  })
})
