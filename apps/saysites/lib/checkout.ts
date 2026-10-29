// Checkout for customers' shops, through the owner's own Stripe account
// (Stripe Connect, direct charges). The shopper pays the business on
// Stripe's checkout page; the money, the Stripe fee and any refunds are
// all on the owner's account. SaySites takes no application fee: 0% of
// sales, as the Store plan promises.
//
// Accounts are created with Stripe's Accounts v2 API (full Stripe
// Dashboard, Stripe collects its fees from the account and covers losses),
// and onboarded with Stripe's hosted form. Payments use the v1 API with the
// Stripe-Account header.

import { formEncode } from './stripe'
import type { Address, Order, Quote } from './commerce'
import type { ShopSettings, Site } from './schema'

// Accounts v2 needs a dated API version.
const V2_VERSION = '2026-09-30.endive'

export const connectReady = () => !!process.env.STRIPE_SECRET_KEY

type Params = Parameters<typeof formEncode>[0]

async function v1<T>(method: 'GET' | 'POST', path: string, params: Params, opts: { account?: string; idempotency?: string } = {}): Promise<T> {
  const body = formEncode(params).join('&')
  const res = await fetch(`https://api.stripe.com/v1${path}${method === 'GET' && body ? `?${body}` : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(opts.account ? { 'Stripe-Account': opts.account } : {}),
      ...(opts.idempotency ? { 'Idempotency-Key': opts.idempotency } : {}),
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(method === 'POST' ? { body } : {}),
    signal: AbortSignal.timeout(15000),
  })
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(`Stripe: ${json.error?.message ?? res.status}`)
  return json
}

async function v2<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v2${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Stripe-Version': V2_VERSION, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  })
  const json = (await res.json()) as T & { error?: { message?: string; code?: string } }
  if (!res.ok) throw new Error(`Stripe: ${json.error?.message ?? json.error?.code ?? res.status}`)
  return json
}

// ---------------------------------------------------------------------------
// Connecting the owner's Stripe account
// ---------------------------------------------------------------------------

export async function createAccount(input: { email: string; name: string; country: string }): Promise<string> {
  const a = await v2<{ id: string }>('POST', '/core/accounts', {
    contact_email: input.email,
    display_name: input.name.slice(0, 100),
    identity: { country: input.country.toLowerCase() },
    configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
    defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
    dashboard: 'full',
  })
  return a.id
}

// Stripe's hosted form, where the owner adds their business and bank
// details. The link works once and expires within minutes.
export async function onboardingLink(account: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const l = await v2<{ url: string }>('POST', '/core/account_links', {
    account,
    use_case: { type: 'account_onboarding', account_onboarding: { configurations: ['merchant'], return_url: returnUrl, refresh_url: refreshUrl } },
  })
  return l.url
}

export interface AccountStatus {
  // Card payments are switched on: customers can pay.
  ready: boolean
  // Stripe still needs something from the owner.
  needsInfo: boolean
}

export async function accountStatus(account: string): Promise<AccountStatus> {
  const a = await v2<{
    configuration?: { merchant?: { capabilities?: { card_payments?: { status?: string } } } }
    requirements?: { entries?: { minimum_deadline?: { status?: string } }[] }
  }>('GET', `/core/accounts/${encodeURIComponent(account)}?include=configuration.merchant&include=requirements`)
  const ready = a.configuration?.merchant?.capabilities?.card_payments?.status === 'active'
  const needsInfo = (a.requirements?.entries ?? []).some((e) => e.minimum_deadline?.status === 'currently_due' || e.minimum_deadline?.status === 'past_due')
  return { ready, needsInfo }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

const absolute = (origin: string, src: string) => (/^https:\/\//.test(src) ? src : src.startsWith('/') ? origin + src : '')

export function checkoutParams(input: { site: Site; settings: ShopSettings; quote: Quote; order: Order; origin: string; coupon?: string }): Params {
  const { settings, quote, order, origin } = input
  const cur = settings.currency.toLowerCase()
  const method = quote.method ?? 'none'
  const shipTo = method === 'delivery' ? [input.site.business.address?.country?.toUpperCase() || 'US'] : (settings.shipping?.ship?.countries ?? ['US'])
  const shippingLabel = method === 'ship' ? 'Shipping' : method === 'express' ? 'Express shipping' : 'Local delivery'
  const days = method === 'ship' ? settings.shipping?.ship?.days : method === 'express' ? settings.shipping?.ship?.express?.days : undefined
  return {
    mode: 'payment',
    line_items: quote.lines.map((l) => {
      const image = l.image ? absolute(origin, l.image.src) : ''
      return {
        quantity: l.qty,
        price_data: {
          currency: cur,
          unit_amount: l.unit,
          product_data: { name: `${l.name}${l.variant ? ` (${l.variant})` : ''}`.slice(0, 250), ...(image ? { images: [image] } : {}) },
        },
      }
    }),
    ...(input.coupon ? { discounts: [{ coupon: input.coupon }] } : {}),
    ...(method === 'ship' || method === 'express' || method === 'delivery'
      ? {
          shipping_address_collection: { allowed_countries: shipTo },
          shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: quote.shipping, currency: cur }, display_name: `${shippingLabel}${days ? ` (${days})` : ''}`.slice(0, 100) } }],
        }
      : {}),
    // A courier or the shop may need to call about a delivery or pickup.
    ...(method === 'delivery' || method === 'pickup' ? { phone_number_collection: { enabled: true } } : {}),
    ...(settings.tax?.auto ? { automatic_tax: { enabled: true } } : {}),
    client_reference_id: order.id,
    metadata: { order: order.id, site: order.siteId, method },
    payment_intent_data: { metadata: { order: order.id, site: order.siteId }, description: `Order from ${input.site.business.name}`.slice(0, 200) },
    success_url: `${origin}/cart/thanks?o=${order.token}&s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  }
}

// Creates the Stripe checkout for an order. A discount becomes a one-time
// coupon on the owner's account for exactly the amount the cart showed.
export async function createCheckout(input: { site: Site; settings: ShopSettings; quote: Quote; order: Order; origin: string }): Promise<{ id: string; url: string }> {
  const account = input.order.stripe.account
  let coupon: string | undefined
  if (input.quote.discount?.amount) {
    const c = await v1<{ id: string }>('POST', '/coupons', { amount_off: input.quote.discount.amount, currency: input.settings.currency.toLowerCase(), duration: 'once', max_redemptions: 1, name: input.quote.discount.code.slice(0, 40) }, { account, idempotency: `${input.order.id}-coupon` })
    coupon = c.id
  }
  const s = await v1<{ id: string; url: string }>('POST', '/checkout/sessions', checkoutParams({ ...input, coupon }), { account, idempotency: `${input.order.id}-session` })
  return { id: s.id, url: s.url }
}

interface StripeAddress {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface CheckoutSession {
  id: string
  status: 'open' | 'complete' | 'expired'
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  amount_subtotal: number | null
  amount_total: number | null
  total_details?: { amount_discount?: number; amount_shipping?: number; amount_tax?: number } | null
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null; address?: StripeAddress | null } | null
  // Where the shipping address lives depends on the API version.
  collected_information?: { shipping_details?: { name?: string | null; address?: StripeAddress | null } | null } | null
  shipping_details?: { name?: string | null; address?: StripeAddress | null } | null
  payment_intent?: string | { id: string } | null
  metadata?: Record<string, string>
}

export async function getSession(account: string, id: string): Promise<CheckoutSession> {
  return v1<CheckoutSession>('GET', `/checkout/sessions/${encodeURIComponent(id)}`, {}, { account })
}

const toAddress = (a: StripeAddress | null | undefined): Address | undefined =>
  a?.line1 && a.city !== undefined && a.postal_code !== undefined
    ? { line1: a.line1, ...(a.line2 ? { line2: a.line2 } : {}), city: a.city ?? '', ...(a.state ? { state: a.state } : {}), postal: a.postal_code ?? '', country: a.country ?? '' }
    : undefined

// What Stripe knows after checkout, folded into the order. Stripe's totals
// win: they include tax and are what the customer was charged.
export function applySession(o: Order, s: CheckoutSession): Order {
  const ship = s.collected_information?.shipping_details ?? s.shipping_details
  const c = s.customer_details
  const address = toAddress(ship?.address) ?? (o.method === 'ship' || o.method === 'express' || o.method === 'delivery' ? toAddress(c?.address) : undefined)
  const t = s.total_details ?? {}
  return {
    ...o,
    customer: {
      ...(ship?.name || c?.name ? { name: (ship?.name || c?.name)! } : {}),
      ...(c?.email ? { email: c.email } : {}),
      ...(c?.phone ? { phone: c.phone } : {}),
      ...(address ? { address } : {}),
    },
    ...(s.amount_subtotal !== null ? { subtotal: s.amount_subtotal } : {}),
    ...(s.amount_total !== null ? { total: s.amount_total } : {}),
    discount: t.amount_discount ?? o.discount,
    shipping: t.amount_shipping ?? o.shipping,
    tax: t.amount_tax ?? 0,
    stripe: { ...o.stripe, session: s.id, ...(s.payment_intent ? { paymentIntent: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent.id } : {}) },
  }
}

export async function refund(account: string, paymentIntent: string, amount: number, key: string): Promise<{ id: string; status: string }> {
  return v1('POST', '/refunds', { payment_intent: paymentIntent, amount }, { account, idempotency: key })
}
