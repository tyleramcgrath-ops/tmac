'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTO_PRICED, PLAN_NAMES, PRICES, billingReady, cleanInterval, cleanPlan, cleanPromo, lookupKey, newBilling, priceId } from '@/lib/billing'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { checkoutUrl, ensurePrice, portalUrl } from '@/lib/stripe'

async function origin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'saysites.com'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

// Sends the owner to Stripe Checkout, with their promo code if they have one.
export async function startPlan(form: FormData): Promise<void> {
  const user = await requireUser()
  if (!billingReady()) redirect('/dashboard/account?billing=soon')
  const store = getStore()
  const current = (await store.billing(user.id)) ?? newBilling(new Date(user.createdAt).getTime())
  const typed = cleanPromo(String(form.get('promo') ?? ''))
  const promo = typed ?? current.promo
  if (typed && typed !== current.promo) await store.saveBilling(user.id, { ...current, promo: typed })
  const plan = cleanPlan(form.get('plan'))
  const interval = cleanInterval(form.get('interval'))
  let price = priceId(plan, interval)
  // A plan whose Stripe price isn't set up yet can't be bought, unless it's
  // one checkout can create in Stripe itself.
  if (!price && !AUTO_PRICED.includes(plan)) redirect('/dashboard/account?billing=soon')
  let url: string
  try {
    price ??= await ensurePrice({ lookupKey: lookupKey(plan, interval), product: `SaySites ${PLAN_NAMES[plan]}${interval === 'year' ? ' (yearly)' : ''}`, amountCents: PRICES[plan][interval] * 100, interval })
    url = await checkoutUrl({ userId: user.id, email: user.email, customerId: current.customerId, promo, origin: await origin(), price, plan, interval, ...(current.status === 'trial' ? { trialEnd: current.trialEndsAt } : {}) })
  } catch (e) {
    console.error('checkout failed', e)
    redirect(`/dashboard/account?billing=error${why(e)}`)
  }
  redirect(url)
}

// Stripe's own reason, carried along so the SaySites team (and only them)
// can see why a payment page didn't open.
function why(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  return `&why=${encodeURIComponent(msg.slice(0, 300))}`
}

// Stripe's own page for changing card, seeing invoices or cancelling.
export async function managePlan(): Promise<void> {
  const user = await requireUser()
  const b = await getStore().billing(user.id)
  if (!b?.customerId || !billingReady()) redirect('/dashboard/account')
  let url: string
  try {
    url = await portalUrl(b.customerId, await origin())
  } catch (e) {
    console.error('portal failed', e)
    redirect(`/dashboard/account?billing=error${why(e)}`)
  }
  redirect(url)
}
