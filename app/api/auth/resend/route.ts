// Resend the email-verification link (RC2 P4). Authenticated; issues a fresh
// 24h token and re-sends. Rate-limited to prevent mail-bombing. No-op (still 200)
// if already verified, so it never leaks state or errors noisily.

import { randomUUID } from 'crypto'
import { assertSameOrigin, enforceRateLimit, handled, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { sendVerificationEmail } from '@/lib/foundation/mailer'

export const runtime = 'nodejs'

export const POST = handled(async (request) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'verify-resend', 5, 10 * 60 * 1000)
  const user = await requireUser(request)
  if (user.emailVerified) return Response.json({ ok: true, alreadyVerified: true })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const store = await getStore()
  await store.updateUser({ ...user, verifyToken: token, verifyTokenExpiresAt: expiresAt })
  const link = `${new URL(request.url).origin}/api/auth/verify?token=${token}`
  const mail = await sendVerificationEmail(user.email, link)
  // When no email provider is configured (logged-only), return the link so the
  // authenticated account owner can verify directly — they only ever receive
  // their OWN link, and only while signed in as that account. When a real email
  // was delivered, we do NOT return the link (the user checks their inbox).
  return Response.json({ ok: true, emailDelivery: mail.via, verifyUrl: mail.delivered ? null : link })
})
