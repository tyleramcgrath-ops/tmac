import { handled, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { stripeConfig } from '@/lib/foundation/env'
import { trialDaysRemaining } from '@/lib/foundation/billing'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Any member can view billing status (owners/admins act on it via
// checkout/portal below). Returns `configured: false` and nothing else when
// this deployment has no Stripe keys set — the UI hides all billing UI in
// that case rather than showing a broken paywall.
export const GET = handled(async (request) => {
  const user = await requireUser(request)
  const orgId = new URL(request.url).searchParams.get('orgId') ?? ''
  await requireOrgRole(user, orgId, 'member')

  const config = stripeConfig()
  if (!config) return Response.json({ configured: false })

  const store = await getStore()
  const org = await store.getOrg(orgId)
  const billing = org?.billing
  const now = Date.now()

  return Response.json({
    configured: true,
    priceLabel: config.priceLabel,
    priceCents: config.priceCents,
    status: billing?.status ?? null,
    trialEndsAt: billing?.trialEndsAt ?? null,
    trialDaysRemaining: trialDaysRemaining(billing, now),
    hasStripeCustomer: !!billing?.stripeCustomerId,
  })
})
