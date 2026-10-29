// Thin Stripe SDK wrapper. Every function here throws if billing isn't
// configured (stripeConfig() returned null) — callers check that first via
// the route-level gate, this module assumes it's already been checked.

import Stripe from 'stripe'
import { stripeConfig } from '../env'

let cached: Stripe | null = null

function client(): Stripe {
  if (cached) return cached
  const config = stripeConfig()
  if (!config) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET unset).')
  cached = new Stripe(config.secretKey)
  return cached
}

// Test seam: lets tests inject a fake Stripe client instead of hitting the
// real API.
export function __setStripeClientForTests(fake: Stripe | null): void {
  cached = fake
}

export interface CheckoutSessionInput {
  orgId: string
  orgName: string
  customerEmail: string
  existingCustomerId: string | null
  successUrl: string
  cancelUrl: string
}

// Ad-hoc pricing (price_data) — no Product/Price needs to be pre-created in
// the Stripe dashboard; the amount lives in STRIPE_PRICE_CENTS here.
export async function createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string | null }> {
  const config = stripeConfig()
  if (!config) throw new Error('Stripe is not configured.')
  const session = await client().checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: config.priceLabel },
          recurring: { interval: 'month' },
          unit_amount: config.priceCents,
        },
        quantity: 1,
      },
    ],
    customer: input.existingCustomerId ?? undefined,
    customer_email: input.existingCustomerId ? undefined : input.customerEmail,
    client_reference_id: input.orgId,
    metadata: { orgId: input.orgId },
    subscription_data: { metadata: { orgId: input.orgId } },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  })
  return { url: session.url }
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const session = await client().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
  return { url: session.url }
}

// Verifies the webhook signature (throws on mismatch — never process an
// unverified payload) and returns the parsed event.
export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const config = stripeConfig()
  if (!config) throw new Error('Stripe is not configured.')
  return client().webhooks.constructEvent(rawBody, signature, config.webhookSecret)
}
