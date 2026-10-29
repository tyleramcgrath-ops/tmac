// Stripe webhook receiver — the single source of truth for billing state.
// Never trust a client-reported "I paid"; only a signature-verified event
// from Stripe updates org.billing. Body must be read as raw text (never
// request.json()) so the signature can be verified against the exact bytes
// Stripe sent.

import { stripeConfig } from '@/lib/foundation/env'
import { getStore } from '@/lib/foundation/store'
import { constructWebhookEvent } from '@/lib/foundation/billing/stripe-client'
import type Stripe from 'stripe'
import type { Organization } from '@/lib/foundation/types'

export const runtime = 'nodejs'

async function setBilling(orgId: string, patch: Partial<NonNullable<Organization['billing']>>) {
  const store = await getStore()
  const org = await store.getOrg(orgId)
  if (!org) {
    console.warn(`[stripe webhook] org ${orgId} not found`)
    return
  }
  const now = new Date().toISOString()
  const billing: NonNullable<Organization['billing']> = {
    status: org.billing?.status ?? 'trialing',
    trialEndsAt: org.billing?.trialEndsAt ?? null,
    stripeCustomerId: org.billing?.stripeCustomerId ?? null,
    stripeSubscriptionId: org.billing?.stripeSubscriptionId ?? null,
    ...org.billing,
    ...patch,
    updatedAt: now,
  }
  await store.updateOrg({ ...org, billing })
}

// Stripe subscription statuses → our billing status. Anything not explicitly
// mapped (incomplete, incomplete_expired, unpaid, paused) defaults to
// 'past_due' — a conservative fallback that blocks automation rather than
// silently granting it on a status we don't recognize.
function mapSubscriptionStatus(s: Stripe.Subscription.Status): NonNullable<Organization['billing']>['status'] {
  if (s === 'active' || s === 'trialing') return 'active'
  if (s === 'canceled') return 'canceled'
  return 'past_due'
}

export async function POST(request: Request) {
  const config = stripeConfig()
  if (!config) return Response.json({ error: 'Billing is not configured.' }, { status: 400 })

  const signature = request.headers.get('stripe-signature')
  if (!signature) return Response.json({ error: 'Missing signature.' }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.warn('[stripe webhook] signature verification failed:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.orgId || session.client_reference_id
        if (!orgId) break
        await setBilling(orgId, {
          status: 'active',
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null,
        })
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const orgId = sub.metadata?.orgId
        if (!orgId) break
        await setBilling(orgId, {
          status: event.type === 'customer.subscription.deleted' ? 'canceled' : mapSubscriptionStatus(sub.status),
          stripeSubscriptionId: sub.id,
          stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
        })
        break
      }
      default:
        break // every other event type is intentionally ignored
    }
  } catch (err) {
    console.error('[stripe webhook] handler failed:', err instanceof Error ? err.message : err)
    // Still 200 — Stripe retries on non-2xx, and re-processing the same
    // event won't fix a bug in our handler, only spam retries.
  }

  return Response.json({ received: true })
}
