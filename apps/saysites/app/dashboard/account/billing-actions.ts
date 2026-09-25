'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { billingReady, cleanPromo, newBilling } from '@/lib/billing'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { checkoutUrl, portalUrl } from '@/lib/stripe'

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
  let url: string
  try {
    url = await checkoutUrl({ userId: user.id, email: user.email, customerId: current.customerId, promo, origin: await origin() })
  } catch (e) {
    console.error('checkout failed', e)
    redirect('/dashboard/account?billing=error')
  }
  redirect(url)
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
    redirect('/dashboard/account?billing=error')
  }
  redirect(url)
}
