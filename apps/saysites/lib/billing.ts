// Accounts: a 7-day free trial, then a paid plan through Stripe. The price
// lives in Stripe (STRIPE_PRICE_ID), so it can be set later without code.
// Friends-and-family and limited promo codes are Stripe promotion codes:
// customers type them at checkout, or arrive with ?promo=CODE.
//
// Until Stripe is connected (STRIPE_SECRET_KEY and STRIPE_PRICE_ID), trials
// are shown but never lock anyone out, since there'd be no way to pay.

import type { User } from './store'

export const TRIAL_DAYS = 7
const DAY = 24 * 3600 * 1000

export type BillingStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'comp'

export interface Billing {
  status: BillingStatus
  trialEndsAt: string
  customerId?: string
  subscriptionId?: string
  // A promo code the owner arrived with, applied at checkout.
  promo?: string
  currentPeriodEnd?: string
}

export function billingReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)
}

export function newBilling(now = Date.now(), promo?: string): Billing {
  return { status: 'trial', trialEndsAt: new Date(now + TRIAL_DAYS * DAY).toISOString(), ...(promo ? { promo } : {}) }
}

// Accounts on the comp list (the owner, testers) never pay.
function comped(email: string): boolean {
  return (process.env.SAYSITES_COMP_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

export interface Access {
  // May edit, publish and use Sofie.
  ok: boolean
  status: BillingStatus
  trial: boolean
  daysLeft: number
  // True once the trial is over and no plan is active.
  locked: boolean
}

export function accessFor(user: User, b: Billing | null, now = Date.now()): Access {
  const bill = b ?? { status: 'trial' as const, trialEndsAt: new Date(new Date(user.createdAt).getTime() + TRIAL_DAYS * DAY).toISOString() }
  const status: BillingStatus = comped(user.email) ? 'comp' : bill.status
  const left = new Date(bill.trialEndsAt).getTime() - now
  const daysLeft = Math.max(0, Math.ceil(left / DAY))
  // A failed renewal keeps working while Stripe retries the card.
  const paid = status === 'active' || status === 'comp' || status === 'past_due'
  const inTrial = status === 'trial' && left > 0
  const ok = paid || inTrial || !billingReady()
  return { ok, status, trial: status === 'trial', daysLeft, locked: !ok }
}

// Promo codes are letters, digits, dashes and underscores, as Stripe allows.
export function cleanPromo(code: string | null | undefined): string | undefined {
  const c = (code ?? '').trim().toUpperCase()
  return /^[A-Z0-9_-]{2,40}$/.test(c) ? c : undefined
}

export async function loadAccess(store: { billing(userId: string): Promise<Billing | null> }, user: User): Promise<Access & { billing: Billing | null }> {
  const billing = await store.billing(user.id)
  return { ...accessFor(user, billing), billing }
}
