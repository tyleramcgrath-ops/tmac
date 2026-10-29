// Stripe tells us about payments in customers' shops (a Connect webhook:
// events from the owners' own Stripe accounts). Only signed events are
// trusted (STRIPE_CONNECT_WEBHOOK_SECRET). The thank-you page settles most
// orders first; this catches shoppers who close the tab, slow payment
// methods and checkouts that expire.

import type { CheckoutSession } from '@/lib/checkout'
import { settleOrder } from '@/lib/orders'
import { getStore } from '@/lib/store'
import { verifySignature } from '@/lib/stripe'

interface StripeEvent {
  type: string
  account?: string
  data: { object: CheckoutSession & { object?: string } }
}

const SESSION_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired']

export async function POST(req: Request) {
  const body = await req.text()
  if (!verifySignature(body, req.headers.get('stripe-signature'), process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? '')) return new Response('Bad signature', { status: 400 })
  const event = JSON.parse(body) as StripeEvent
  if (!SESSION_EVENTS.includes(event.type)) return Response.json({ ok: true })
  const store = getStore()
  const session = event.data.object
  const order = await store.orderBySession(session.id)
  // Only the account the order was made on can settle it.
  if (!order || order.stripe.account !== event.account) return Response.json({ ok: true })
  const site = await store.siteById(order.siteId)
  if (!site) return Response.json({ ok: true })
  if (event.type === 'checkout.session.async_payment_failed') {
    await store.saveOrder({ ...order, timeline: [...order.timeline, { at: new Date().toISOString(), text: 'The payment didn’t go through', by: 'Stripe' }], updatedAt: new Date().toISOString() })
    return Response.json({ ok: true })
  }
  await settleOrder(store, site, order, session)
  return Response.json({ ok: true })
}
