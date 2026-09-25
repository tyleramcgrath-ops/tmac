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

export async function checkoutUrl(input: { userId: string; email: string; customerId?: string; promo?: string; origin: string }): Promise<string> {
  const promotion = input.promo ? await promoId(input.promo).catch(() => null) : null
  const session = await stripe<{ url: string }>('POST', '/checkout/sessions', {
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: input.userId,
    ...(input.customerId ? { customer: input.customerId } : { customer_email: input.email }),
    subscription_data: { metadata: { user_id: input.userId } },
    metadata: { user_id: input.userId },
    // Either the code they arrived with, or a box to type one in.
    ...(promotion ? { discounts: [{ promotion_code: promotion }] } : { allow_promotion_codes: true }),
    success_url: `${input.origin}/dashboard/account?billing=welcome`,
    cancel_url: `${input.origin}/dashboard/account`,
  })
  return session.url
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
