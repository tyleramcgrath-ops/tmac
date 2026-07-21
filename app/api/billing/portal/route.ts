import { assertSameOrigin, enforceRateLimit, handled, HttpError, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { stripeConfig } from '@/lib/foundation/env'
import { createPortalSession } from '@/lib/foundation/billing/stripe-client'

export const runtime = 'nodejs'

// Owner-only: opens Stripe's hosted billing portal (update card, view
// invoices, cancel). Requires a real Stripe customer to already exist, i.e.
// the org has been through checkout at least once.
export const POST = handled(async (request) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'billing-portal', 10)
  const user = await requireUser(request)
  if (!stripeConfig()) throw new HttpError(400, 'Billing is not configured on this deployment.')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const orgId = String(body.orgId ?? '')
  const { org } = await requireOrgRole(user, orgId, 'owner')

  const customerId = org.billing?.stripeCustomerId
  if (!customerId) throw new HttpError(400, 'No billing account yet — start a subscription first.')

  const origin = new URL(request.url).origin
  const { url } = await createPortalSession(customerId, `${origin}/billing`)
  return Response.json({ url })
})
