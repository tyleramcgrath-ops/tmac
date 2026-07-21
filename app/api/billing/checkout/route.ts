import { assertSameOrigin, audit, enforceRateLimit, handled, HttpError, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { stripeConfig } from '@/lib/foundation/env'
import { createCheckoutSession } from '@/lib/foundation/billing/stripe-client'

export const runtime = 'nodejs'

// Owner-only: starts (or resumes) a subscription checkout for the org. Uses
// Stripe's ad-hoc price_data — no Product/Price needs to pre-exist in the
// Stripe dashboard, the amount is read from STRIPE_PRICE_CENTS.
export const POST = handled(async (request) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'billing-checkout', 10)
  const user = await requireUser(request)
  const config = stripeConfig()
  if (!config) throw new HttpError(400, 'Billing is not configured on this deployment.')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const orgId = String(body.orgId ?? '')
  const { org } = await requireOrgRole(user, orgId, 'owner')

  const origin = new URL(request.url).origin
  const { url } = await createCheckoutSession({
    orgId: org.id,
    orgName: org.name,
    customerEmail: user.email,
    existingCustomerId: org.billing?.stripeCustomerId ?? null,
    successUrl: `${origin}/billing?checkout=success`,
    cancelUrl: `${origin}/billing?checkout=canceled`,
  })
  if (!url) throw new HttpError(502, 'Stripe did not return a checkout URL.')

  // No store write here — the Stripe webhook is the single source of truth
  // for billing state once checkout completes (never optimistically mark
  // active before payment is confirmed).
  await audit(org.id, user.id, 'billing.checkout_started', org.id, '')
  return Response.json({ url })
})
