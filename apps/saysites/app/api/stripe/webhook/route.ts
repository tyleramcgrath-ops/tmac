// Stripe tells us when someone subscribes, renews, fails to pay or cancels.
// Only signed events are trusted (STRIPE_WEBHOOK_SECRET).

import { newBilling, type Billing, type BillingStatus } from '@/lib/billing'
import { getStore } from '@/lib/store'
import { verifySignature } from '@/lib/stripe'

interface StripeEvent {
  type: string
  data: { object: Record<string, unknown> }
}

const STATUS: Record<string, BillingStatus> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
}

export async function POST(req: Request) {
  const body = await req.text()
  if (!verifySignature(body, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET ?? '')) return new Response('Bad signature', { status: 400 })
  const event = JSON.parse(body) as StripeEvent
  const o = event.data.object
  const store = getStore()

  const update = async (userId: string | undefined, changes: Partial<Billing>) => {
    if (!userId || !(await store.userById(userId))) return
    const current = (await store.billing(userId)) ?? newBilling()
    await store.saveBilling(userId, { ...current, ...changes })
  }

  if (event.type === 'checkout.session.completed') {
    const meta = o.metadata as Record<string, string> | undefined
    await update((o.client_reference_id as string) ?? meta?.user_id, { status: 'active', customerId: o.customer as string, subscriptionId: o.subscription as string })
  } else if (event.type.startsWith('customer.subscription.')) {
    const meta = o.metadata as Record<string, string> | undefined
    const status = event.type === 'customer.subscription.deleted' ? 'canceled' : STATUS[o.status as string]
    const end = (o.current_period_end as number | undefined) ?? ((o.items as { data?: { current_period_end?: number }[] } | undefined)?.data?.[0]?.current_period_end)
    if (status) await update(meta?.user_id, { status, customerId: o.customer as string, subscriptionId: o.id as string, ...(end ? { currentPeriodEnd: new Date(end * 1000).toISOString() } : {}) })
  }
  return Response.json({ received: true })
}
