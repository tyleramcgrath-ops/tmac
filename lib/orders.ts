// An order's life on the server: made when the shopper heads to checkout,
// confirmed once Stripe says it's paid (from the thank-you page or Stripe's
// webhook, whichever comes first, exactly once), then sent, picked up or
// delivered, and sometimes refunded. Each step writes the order's timeline
// and sends the emails a shopper expects.

import { randomBytes, randomUUID } from 'crypto'
import { after } from 'next/server'
import { applySession, getSession, refund as stripeRefund, type CheckoutSession } from './checkout'
import {
  METHOD_LABEL,
  formatPrice,
  lowStock,
  orderName,
  paymentAfterRefund,
  stockKey,
  type Fulfillment,
  type Order,
  type Quote,
} from './commerce'
import { mailReady, sendMail } from './mail'
import { siteOrigin, type Site } from './schema'
import type { Store } from './store'

const APP = 'https://saysites.com'
export const orderLink = (siteId: string, id: string) => `${APP}/dashboard/sites/${siteId}/store/orders/${id}`
export const customerLink = (site: Site, o: Pick<Order, 'token'>) => `${siteOrigin(site)}/order/${o.token}`

const now = () => new Date().toISOString()

// After the response when there is one; straight away otherwise (scripts, tests).
function later(fn: () => Promise<void>) {
  try {
    after(fn)
  } catch {
    void fn().catch(() => {})
  }
}

// The order as it stands when the shopper leaves for Stripe: what's in the
// cart, at today's prices. Stripe's figures replace the totals once paid.
export function draftOrder(site: Site, quote: Quote, account: string, zip?: string): Order {
  const products = new Map((site.store?.products ?? []).map((p) => [p.id, p]))
  const at = now()
  return {
    id: `o_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    siteId: site.id,
    token: randomBytes(18).toString('base64url'),
    status: 'open',
    payment: 'pending',
    fulfillment: 'unfulfilled',
    method: quote.method ?? 'none',
    currency: quote.currency,
    lines: quote.lines.map((l) => {
      const cost = products.get(l.productId)?.cost
      return {
        productId: l.productId,
        ...(l.variantId ? { variantId: l.variantId, variant: l.variant } : {}),
        name: l.name,
        ...(l.sku ? { sku: l.sku } : {}),
        ...(l.image && /^https:\/\//.test(l.image.src) ? { image: l.image.src } : l.image ? { image: siteOrigin(site) + l.image.src } : {}),
        unit: l.unit,
        qty: l.qty,
        total: l.total,
        ...(cost !== undefined ? { cost } : {}),
      }
    }),
    subtotal: quote.subtotal,
    discount: quote.discount?.amount ?? 0,
    ...(quote.discount ? { discountCode: quote.discount.code } : quote.freeShipping ? { discountCode: quote.freeShipping.code } : {}),
    shipping: quote.shipping,
    tax: 0,
    total: quote.total,
    refunded: 0,
    ...(zip ? { zip } : {}),
    stripe: { account },
    timeline: [{ at, text: 'Checkout started', by: 'Customer' }],
    createdAt: at,
    updatedAt: at,
  }
}

const event = (o: Order, text: string, by?: string): Order => ({ ...o, timeline: [...o.timeline, { at: now(), text, ...(by ? { by } : {}) }], updatedAt: now() })

// Brings an open order up to date with its Stripe checkout. Safe to call
// any number of times from anywhere: only the first call that sees it paid
// numbers it, takes the stock and sends the emails.
export async function settleOrder(store: Store, site: Site, order: Order, session?: CheckoutSession): Promise<Order> {
  if (order.status === 'paid' || !order.stripe.session) return order
  const s = session ?? (await getSession(order.stripe.account, order.stripe.session))
  if (s.status === 'expired') {
    if (order.status !== 'open') return order
    const gone = event({ ...applySession(order, s), status: 'abandoned' }, 'Checkout expired without payment', 'Stripe')
    await store.saveOrder(gone)
    return gone
  }
  if (s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required') return order
  const at = now()
  const number = await store.markOrderPaid(site.id, order.id, at)
  if (number === null) return (await store.order(site.id, order.id)) ?? order
  let paid: Order = { ...applySession(order, s), number, status: 'paid', payment: 'paid', paidAt: at }
  paid = event(paid, `Paid ${formatPrice(paid.total, paid.currency)}`, 'Stripe')
  const products = new Map((site.store?.products ?? []).map((p) => [p.id, p]))
  const take: Record<string, number> = {}
  for (const l of paid.lines) if (products.get(l.productId)?.track) take[stockKey(l.productId, l.variantId)] = (take[stockKey(l.productId, l.variantId)] ?? 0) - l.qty
  if (Object.keys(take).length) {
    await store.adjustStock(site.id, take)
    paid = { ...paid, stockTaken: true }
  }
  await store.saveOrder(paid)
  const final = paid
  later(() => orderPlacedEmails(store, site, final).catch(() => {}))
  return paid
}

// ---------------------------------------------------------------------------
// The owner's actions
// ---------------------------------------------------------------------------

export async function setFulfillment(store: Store, site: Site, o: Order, to: Fulfillment, by: string, tracking?: Order['tracking']): Promise<Order> {
  const text: Record<Fulfillment, string> = { unfulfilled: 'Marked not sent', shipped: 'Marked shipped', ready: 'Marked ready for pickup', out: 'Marked out for delivery', done: o.method === 'pickup' ? 'Marked picked up' : o.method === 'none' ? 'Marked completed' : 'Marked delivered' }
  let next = event({ ...o, fulfillment: to, ...(tracking ? { tracking } : {}) }, `${text[to]}${tracking?.number ? ` (${[tracking.carrier, tracking.number].filter(Boolean).join(' ')})` : ''}`, by)
  const mail = await customerUpdateEmail(site, next, to)
  if (mail) next = event(next, mail, 'SaySites')
  await store.saveOrder(next)
  return next
}

export async function addNote(store: Store, o: Order, text: string, by: string): Promise<Order> {
  const next = event(o, text.slice(0, 2000), by)
  await store.saveOrder(next)
  return next
}

// Refunds through the owner's Stripe account. Restocking puts tracked items
// back when the whole order is refunded.
export async function refundOrder(store: Store, site: Site, o: Order, amount: number, restock: boolean, by: string): Promise<Order> {
  const left = o.total - o.refunded
  if (!o.stripe.paymentIntent) throw new Error('This order has no Stripe payment to refund.')
  if (amount <= 0 || amount > left) throw new Error(`You can refund up to ${formatPrice(left, o.currency)}.`)
  await stripeRefund(o.stripe.account, o.stripe.paymentIntent, amount, `${o.id}-refund-${o.refunded}-${amount}`)
  const refunded = o.refunded + amount
  let next: Order = event({ ...o, refunded, payment: paymentAfterRefund(o.total, refunded) }, `Refunded ${formatPrice(amount, o.currency)}`, by)
  if (restock && o.stockTaken) {
    const products = new Map((site.store?.products ?? []).map((p) => [p.id, p]))
    const back: Record<string, number> = {}
    for (const l of o.lines) if (products.get(l.productId)?.track) back[stockKey(l.productId, l.variantId)] = (back[stockKey(l.productId, l.variantId)] ?? 0) + l.qty
    if (Object.keys(back).length) {
      await store.adjustStock(site.id, back)
      next = event({ ...next, stockTaken: false }, 'Items put back in stock', by)
    }
  }
  if (next.customer?.email && mailReady()) {
    const r = await sendMail({
      to: next.customer.email,
      subject: `Refund for your ${site.business.name} order ${orderName(next)}`,
      text: [`Hi ${firstName(next)},`, '', `${site.business.name} has refunded ${formatPrice(amount, next.currency)} for order ${orderName(next)}. Refunds usually take 5 to 10 business days to reach your account, depending on your bank.`, '', `Your order: ${customerLink(site, next)}`, '', site.business.name].join('\n'),
      fromName: site.business.name,
      replyTo: site.business.email,
    })
    next = event(next, r.ok ? `Refund email sent to ${next.customer.email}` : `Refund email not sent: ${r.error}`, 'SaySites')
  }
  await store.saveOrder(next)
  return next
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

const firstName = (o: Order) => (o.customer?.name ?? '').split(/\s+/)[0] || 'there'

function receipt(o: Order): string[] {
  const m = (c: number) => formatPrice(c, o.currency)
  return [
    ...o.lines.map((l) => `${l.qty} x ${l.name}${l.variant ? ` (${l.variant})` : ''}  ${m(l.total)}`),
    '',
    `Subtotal  ${m(o.subtotal)}`,
    ...(o.discount ? [`Discount${o.discountCode ? ` (${o.discountCode})` : ''}  -${m(o.discount)}`] : []),
    ...(o.method !== 'none' ? [`${METHOD_LABEL[o.method]}  ${o.shipping ? m(o.shipping) : 'Free'}`] : []),
    ...(o.tax ? [`Tax  ${m(o.tax)}`] : []),
    `Total  ${m(o.total)}`,
  ]
}

function howItArrives(site: Site, o: Order): string {
  const s = site.store?.shipping
  if (o.method === 'pickup') return `Pickup: ${s?.pickup?.note ?? 'we’ll let you know when it’s ready.'} We’ll email you when it’s ready.`
  if (o.method === 'delivery') return `Local delivery${s?.delivery?.note ? `: ${s.delivery.note}` : ''}. We’ll email you when it’s on its way.`
  if (o.method === 'ship' || o.method === 'express') {
    const days = o.method === 'express' ? s?.ship?.express?.days : s?.ship?.days
    return `We’ll email you when it ships${days ? ` (usually ${days})` : ''}.`
  }
  return ''
}

async function ownerEmail(store: Store, site: Site): Promise<string> {
  return site.store?.notifyEmail || (await store.userById(site.orgId))?.email || site.business.email || ''
}

async function orderPlacedEmails(store: Store, site: Site, o: Order): Promise<void> {
  if (!mailReady()) return
  let next = o
  if (o.customer?.email) {
    const r = await sendMail({
      to: o.customer.email,
      subject: `Your ${site.business.name} order ${orderName(o)}`,
      text: [`Hi ${firstName(o)},`, '', `Thank you for your order. Here’s what you bought:`, '', ...receipt(o), '', howItArrives(site, o), '', `See your order any time: ${customerLink(site, o)}`, '', `Questions? Just reply to this email.`, '', site.business.name].filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n'),
      fromName: site.business.name,
      replyTo: site.business.email,
    })
    next = event(next, r.ok ? `Order confirmation sent to ${o.customer.email}` : `Order confirmation not sent: ${r.error}`, 'SaySites')
  }
  const to = await ownerEmail(store, site)
  if (to) {
    const low = lowStock(site.store!, await store.stock(site.id)).filter((x) => o.lines.some((l) => l.productId === x.product.id))
    const who = [o.customer?.name, o.customer?.email].filter(Boolean).join(', ')
    await sendMail({
      to,
      subject: `New order ${orderName(o)}: ${formatPrice(o.total, o.currency)}`,
      text: [
        `${who || 'Someone'} just ordered from ${site.business.name}.`,
        '',
        ...receipt(o),
        '',
        `${METHOD_LABEL[o.method]}${o.customer?.address ? `: ${[o.customer.address.line1, o.customer.address.city, o.customer.address.postal].join(', ')}` : ''}`,
        ...(low.length ? ['', 'Running low:', ...low.map((x) => `${x.product.name}${x.variant ? ` (${x.variant.values.join(' / ')})` : ''}: ${x.qty} left`)] : []),
        '',
        `Open the order: ${orderLink(site.id, o.id)}`,
        '',
        'The money goes straight to your Stripe account. SaySites takes 0% of your sales.',
      ].join('\n'),
      fromName: 'SaySites',
      ...(o.customer?.email ? { replyTo: o.customer.email } : {}),
    })
  }
  if (next !== o) {
    const fresh = await store.order(site.id, o.id)
    if (fresh) await store.saveOrder({ ...fresh, timeline: [...fresh.timeline, ...next.timeline.slice(o.timeline.length)] })
  }
}

// The email for a fulfillment step, if it's one customers hear about.
// Returns the timeline line, or null when nothing was sent.
async function customerUpdateEmail(site: Site, o: Order, to: Fulfillment): Promise<string | null> {
  const email = o.customer?.email
  if (!email || !mailReady()) return null
  const name = site.business.name
  const subjects: Partial<Record<Fulfillment, string>> = {
    shipped: `Your ${name} order ${orderName(o)} is on its way`,
    ready: `Your ${name} order ${orderName(o)} is ready for pickup`,
    out: `Your ${name} order ${orderName(o)} is out for delivery`,
  }
  const subject = subjects[to]
  if (!subject) return null
  const track = o.tracking?.url ? `Track it: ${o.tracking.url}` : o.tracking?.number ? `Tracking number: ${[o.tracking.carrier, o.tracking.number].filter(Boolean).join(' ')}` : ''
  const body =
    to === 'shipped'
      ? ['Good news: your order has shipped.', track]
      : to === 'ready'
        ? ['Your order is ready to pick up.', site.store?.shipping?.pickup?.note ?? '']
        : ['Your order is out for delivery today.']
  const r = await sendMail({
    to: email,
    subject,
    text: [`Hi ${firstName(o)},`, '', ...body.filter(Boolean), '', `Your order: ${customerLink(site, o)}`, '', name].join('\n'),
    fromName: name,
    replyTo: site.business.email,
  })
  return r.ok ? `Update sent to ${email}` : `Update not sent: ${r.error}`
}
