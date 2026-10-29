// The few Stripe calls SaySites needs for its own plan, over Stripe's REST
// API (no SDK): Checkout for a subscription, the customer portal, promo code
// lookup, and webhook signature checks.

import { createHmac, timingSafeEqual } from 'crypto'

interface Params {
  [key: string]: string | number | boolean | undefined | Params | Params[] | string[]
}

// Stripe's form encoding: a[b]=c, a[0][b]=c.
export function formEncode(params: Params, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? out.push(...formEncode(item as Params, `${key}[${i}]`)) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`)))
    else if (typeof v === 'object') out.push(...formEncode(v, key))
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return out
}

async function stripe<T>(method: 'GET' | 'POST', path: string, params: Params = {}): Promise<T> {
  const body = formEncode(params).join('&')
  const url = `https://api.stripe.com/v1${path}${method === 'GET' && body ? `?${body}` : ''}`
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    ...(method === 'POST' ? { body } : {}),
    signal: AbortSignal.timeout(15000),
  })
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(`Stripe: ${json.error?.message ?? res.status}`)
  return json
}

// An active promotion code's id, or null (unknown, used up or expired).
export async function promoId(code: string): Promise<string | null> {
  const r = await stripe<{ data: { id: string; active: boolean }[] }>('GET', '/promotion_codes', { code, active: true, limit: 1 })
  return r.data[0]?.id ?? null
}

// trialEnd: free time the owner still has (their trial, or months earned
// with feedback). Stripe needs it at least 48 hours out.
export async function checkoutUrl(input: { userId: string; email: string; customerId?: string; promo?: string; origin: string; trialEnd?: string; price: string; plan: string; interval: string }): Promise<string> {
  const trialEnd = input.trialEnd ? Math.floor(Date.parse(input.trialEnd) / 1000) : 0
  const freeTime = trialEnd > Date.now() / 1000 + 48 * 3600 ? { trial_end: trialEnd } : {}
  const promotion = input.promo ? await promoId(input.promo).catch(() => null) : null
  const session = await stripe<{ url: string }>('POST', '/checkout/sessions', {
    mode: 'subscription',
    line_items: [{ price: input.price, quantity: 1 }],
    client_reference_id: input.userId,
    ...(input.customerId ? { customer: input.customerId } : { customer_email: input.email }),
    subscription_data: { metadata: { user_id: input.userId, plan: input.plan, interval: input.interval }, ...freeTime },
    metadata: { user_id: input.userId, plan: input.plan, interval: input.interval },
    // Either the code they arrived with, or a box to type one in.
    ...(promotion ? { discounts: [{ promotion_code: promotion }] } : { allow_promotion_codes: true }),
    success_url: `${input.origin}/dashboard/account?billing=welcome`,
    cancel_url: `${input.origin}/dashboard/account`,
  })
  return session.url
}

// A recurring price found by its lookup key, or created (with its product)
// at the given amount the first time it's needed. Lets a new plan be sold
// without anyone setting it up in the Stripe dashboard first.
export async function ensurePrice(input: { lookupKey: string; product: string; amountCents: number; interval: 'month' | 'year' }): Promise<string> {
  const found = await stripe<{ data: { id: string; unit_amount: number; recurring: { interval: string } | null }[] }>('GET', '/prices', { lookup_keys: [input.lookupKey], active: true, limit: 1 })
  const hit = found.data[0]
  if (hit && hit.unit_amount === input.amountCents && hit.recurring?.interval === input.interval) return hit.id
  const created = await stripe<{ id: string }>('POST', '/prices', {
    currency: 'usd',
    unit_amount: input.amountCents,
    recurring: { interval: input.interval },
    lookup_key: input.lookupKey,
    // Moves the key from an older price at a different amount to this one.
    transfer_lookup_key: true,
    product_data: { name: input.product },
  })
  return created.id
}

export async function portalUrl(customerId: string, origin: string): Promise<string> {
  const s = await stripe<{ url: string }>('POST', '/billing_portal/sessions', { customer: customerId, return_url: `${origin}/dashboard/account` })
  return s.url
}

// Stripe-Signature: t=<time>,v1=<hmac>. Rejects anything older than 5 minutes.
export function verifySignature(payload: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header || !secret) return false
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]).filter((p) => p.length === 2))
  const t = Number(parts.t)
  const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > 300) return false
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)))
}
