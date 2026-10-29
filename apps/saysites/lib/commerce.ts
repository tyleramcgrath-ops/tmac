// The shop: products, variants, stock, the cart, discounts, delivery
// methods, orders and the numbers the owner sees. Everything here is pure
// (no network, no database), so the storefront, checkout, the dashboard,
// Sofie and the tests all share one set of rules.
//
// Money is always in cents. Stock counts live in their own table
// (ss_stock), keyed by stockKey(); everything else about the shop is in
// Site.store.

import type { Discount, Product, ShopSettings, Variant } from './schema'

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

const SYMBOL: Record<string, string> = { USD: '$', CAD: 'CA$', AUD: 'A$', GBP: '£', EUR: '€' }

export function formatPrice(cents: number, currency: string): string {
  const whole = cents % 100 === 0
  const sign = cents < 0 ? '-' : ''
  return `${sign}${SYMBOL[currency] ?? ''}${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`
}

// "24", "24.5", "$1,024.50" → cents. Null when it isn't a price.
export function parsePrice(text: string): number | null {
  const t = text.replace(/[$,£€\s]|CA|A(?=\$)/g, '')
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return null
  return Math.round(Number(t) * 100)
}

export const priceText = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, '')

// ---------------------------------------------------------------------------
// Products and variants
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70)
      .replace(/-+$/, '') || 'product'
  )
}

// Each product's address under /shop/, unique within the shop. A product's
// own slug wins; the rest are made from names, numbered when two clash.
export function productSlugs(products: readonly Product[]): Map<string, string> {
  const out = new Map<string, string>()
  const used = new Set<string>()
  for (const p of products) if (p.slug && !used.has(p.slug)) (out.set(p.id, p.slug), used.add(p.slug))
  for (const p of products) {
    if (out.has(p.id)) continue
    const base = slugify(p.name)
    let s = base
    for (let i = 2; used.has(s); i++) s = `${base}-${i}`
    out.set(p.id, s)
    used.add(s)
  }
  return out
}

export const productPath = (slug: string) => `/shop/${slug}`

// On the website at all (drafts aren't), and listed in the shop (unlisted
// products are reachable only by their own address).
export const isLive = (p: Product) => p.status !== 'draft'
export const isListed = (p: Product) => !p.status || p.status === 'active'
// An Amazon pick (lib/amazon): shown with a "Buy on Amazon" link, not sold here.
export const isAmazon = (p: Product) => !!p.amazon

export const hasVariants = (p: Product) => !!(p.options?.length && p.variants?.length)
export const variantLabel = (v: Pick<Variant, 'values'>) => v.values.join(' / ')

// Every combination of the options' values (Small / Red, Small / Blue, …),
// keeping the price, code and stock settings of combinations that already
// existed. At most 100.
export function buildVariants(options: NonNullable<Product['options']>, existing: readonly Variant[] = [], makeId: (i: number) => string = (i) => `v${i + 1}`): Variant[] {
  if (!options.length) return []
  let combos: string[][] = [[]]
  for (const o of options) combos = combos.flatMap((c) => o.values.map((v) => [...c, v]))
  const byKey = new Map(existing.map((v) => [v.values.join('\u0000'), v]))
  const ids = new Set(existing.map((v) => v.id))
  let n = 0
  const nextId = () => {
    let id = makeId(n++)
    while (ids.has(id)) id = makeId(n++)
    ids.add(id)
    return id
  }
  return combos.slice(0, 100).map((values) => {
    const old = byKey.get(values.join('\u0000'))
    return old ? { ...old, values } : { id: nextId(), values }
  })
}

export const unitPrice = (p: Product, v?: Variant) => v?.price ?? p.price
export const compareAtOf = (p: Product, v?: Variant) => {
  const c = v ? (v.compareAt ?? (v.price === undefined ? p.compareAt : undefined)) : p.compareAt
  return c && c > unitPrice(p, v) ? c : undefined
}

// "From $18" when variants differ in price.
export function priceRange(p: Product): { min: number; max: number } {
  const prices = hasVariants(p) ? p.variants!.map((v) => unitPrice(p, v)) : [p.price]
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export const stockKey = (productId: string, variantId?: string) => (variantId ? `${productId}/${variantId}` : productId)

export type Stock = Record<string, number>

// How many can still be sold: Infinity when stock isn't counted or the owner
// keeps selling at zero.
export function availableQty(p: Product, v: Variant | undefined, stock: Stock): number {
  if (p.soldOut || v?.soldOut) return 0
  if (!p.track || p.oversell) return Infinity
  return Math.max(0, stock[stockKey(p.id, v?.id)] ?? 0)
}

export function inStock(p: Product, stock: Stock): boolean {
  return hasVariants(p) ? p.variants!.some((v) => availableQty(p, v, stock) > 0) : availableQty(p, undefined, stock) > 0
}

// Tracked items at or under the shop's warning level.
export function lowStock(settings: ShopSettings, stock: Stock): { product: Product; variant?: Variant; qty: number }[] {
  const level = settings.lowStock ?? 3
  const out: { product: Product; variant?: Variant; qty: number }[] = []
  for (const p of settings.products) {
    if (!p.track || !isLive(p)) continue
    const vs = hasVariants(p) ? p.variants! : [undefined]
    for (const v of vs) {
      const qty = stock[stockKey(p.id, v?.id)] ?? 0
      if (qty <= level && !v?.soldOut) out.push({ product: p, variant: v, qty })
    }
  }
  return out.sort((a, b) => a.qty - b.qty)
}

export const categoriesOf = (products: readonly Product[]) => [...new Set(products.filter(isListed).map((p) => p.category).filter((c): c is string => !!c))]

// What the products widget shows: listed products, optionally one category.
export const shopList = (products: readonly Product[], category?: string) => products.filter((p) => isListed(p) && (!category || p.category?.toLowerCase() === category.toLowerCase()))

// Can shoppers pay on the site (Stripe connected and the shop open)?
export const checkoutOpen = (s: ShopSettings | undefined) => !!(s?.checkout?.ready && s.open !== false)

// ---------------------------------------------------------------------------
// The cart (a cookie on the shopper's browser; prices are always re-read)
// ---------------------------------------------------------------------------

export type Method = 'ship' | 'express' | 'pickup' | 'delivery' | 'none'

export interface CartItem {
  p: string
  v?: string
  q: number
}
export interface Cart {
  items: CartItem[]
  method?: Method
  zip?: string
  code?: string
}

export const CART_COOKIE = 'ss_cart'
export const MAX_LINES = 40
export const MAX_QTY = 99

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url')

export function encodeCart(cart: Cart): string {
  const compact = { i: cart.items.slice(0, MAX_LINES).map((x) => (x.v ? [x.p, x.q, x.v] : [x.p, x.q])), ...(cart.method ? { m: cart.method } : {}), ...(cart.zip ? { z: cart.zip } : {}), ...(cart.code ? { d: cart.code } : {}) }
  return b64url(JSON.stringify(compact))
}

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const METHODS: Method[] = ['ship', 'express', 'pickup', 'delivery', 'none']

// Anything malformed becomes an empty cart, never an error.
export function decodeCart(raw: string | undefined | null): Cart {
  if (!raw || raw.length > 4000) return { items: [] }
  try {
    const j = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { i?: unknown; m?: unknown; z?: unknown; d?: unknown }
    const items: CartItem[] = []
    for (const x of Array.isArray(j.i) ? j.i.slice(0, MAX_LINES) : []) {
      if (!Array.isArray(x)) continue
      const [p, q, v] = x as [unknown, unknown, unknown]
      if (typeof p !== 'string' || !ID.test(p) || typeof q !== 'number' || !Number.isInteger(q) || q < 1) continue
      if (v !== undefined && (typeof v !== 'string' || !ID.test(v))) continue
      items.push({ p, q: Math.min(q, MAX_QTY), ...(v ? { v } : {}) })
    }
    return {
      items,
      ...(METHODS.includes(j.m as Method) ? { method: j.m as Method } : {}),
      ...(typeof j.z === 'string' && /^[A-Za-z0-9 -]{2,10}$/.test(j.z) ? { zip: j.z } : {}),
      ...(typeof j.d === 'string' && /^[A-Z0-9_-]{3,30}$/.test(j.d) ? { code: j.d } : {}),
    }
  } catch {
    return { items: [] }
  }
}

export function readCartCookie(header: string | null): Cart {
  const m = (header ?? '').match(new RegExp(`(?:^|;\\s*)${CART_COOKIE}=([^;]+)`))
  return decodeCart(m?.[1])
}

export function cartCookie(cart: Cart): string {
  // Lax, so the cart survives the trip back from Stripe's checkout page.
  return cart.items.length || cart.code
    ? `${CART_COOKIE}=${encodeCart(cart)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure; HttpOnly`
    : `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`
}

export function addToCart(cart: Cart, item: CartItem): Cart {
  const items = cart.items.slice()
  const i = items.findIndex((x) => x.p === item.p && x.v === item.v)
  if (i >= 0) items[i] = { ...items[i], q: Math.min(MAX_QTY, items[i].q + item.q) }
  else if (items.length < MAX_LINES) items.push({ ...item, q: Math.min(MAX_QTY, item.q) })
  return { ...cart, items }
}

export function setQty(cart: Cart, p: string, v: string | undefined, q: number): Cart {
  const items = q <= 0 ? cart.items.filter((x) => !(x.p === p && x.v === v)) : cart.items.map((x) => (x.p === p && x.v === v ? { ...x, q: Math.min(MAX_QTY, q) } : x))
  return { ...cart, items }
}

export const cartCount = (cart: Cart) => cart.items.reduce((n, x) => n + x.q, 0)

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export interface AppliedDiscount {
  code: string
  label: string
  // Cents off the items (0 for a free-shipping discount).
  amount: number
  freeShipping: boolean
  auto: boolean
}

export function discountLabel(d: Discount, currency: string): string {
  return d.kind === 'percent' ? `${d.value}% off` : d.kind === 'amount' ? `${formatPrice(d.value, currency)} off` : 'Free shipping'
}

// Why a discount can't be used right now, or null if it can.
export function discountProblem(d: Discount, subtotal: number, today: string, uses: number, currency: string): string | null {
  if (!d.active) return 'That code isn’t active.'
  if (d.startsOn && today < d.startsOn) return 'That code isn’t active yet.'
  if (d.endsOn && today > d.endsOn) return 'That code has ended.'
  if (d.limit !== undefined && uses >= d.limit) return 'That code has been used up.'
  if (d.minSubtotal && subtotal < d.minSubtotal) return `That code needs an order of ${formatPrice(d.minSubtotal, currency)} or more.`
  return null
}

const amountOff = (d: Discount, subtotal: number) => (d.kind === 'percent' ? Math.round((subtotal * Math.min(100, d.value)) / 100) : d.kind === 'amount' ? Math.min(subtotal, d.value) : 0)

// The best money-off discount (the code or an automatic one) plus free
// shipping if any discount gives it: one of each can combine, as on most
// shops. Returns the code's problem when a typed code can't be used.
export function applyDiscounts(
  settings: ShopSettings,
  subtotal: number,
  code: string | undefined,
  today: string,
  uses: Record<string, number> = {},
): { money: AppliedDiscount | null; shipping: AppliedDiscount | null; codeProblem: string | null } {
  const all = settings.discounts ?? []
  const usable = (d: Discount) => discountProblem(d, subtotal, today, uses[d.code] ?? 0, settings.currency) === null
  const candidates = all.filter((d) => d.auto && usable(d))
  let codeProblem: string | null = null
  if (code) {
    const d = all.find((x) => x.code === code && !x.auto)
    if (!d) codeProblem = 'That code isn’t valid.'
    else {
      codeProblem = discountProblem(d, subtotal, today, uses[d.code] ?? 0, settings.currency)
      if (!codeProblem) candidates.push(d)
    }
  }
  const asApplied = (d: Discount): AppliedDiscount => ({ code: d.code, label: discountLabel(d, settings.currency), amount: amountOff(d, subtotal), freeShipping: d.kind === 'shipping', auto: !!d.auto })
  const money = candidates.filter((d) => d.kind !== 'shipping').map(asApplied).sort((a, b) => b.amount - a.amount)[0] ?? null
  const ship = candidates.filter((d) => d.kind === 'shipping').map(asApplied).sort((a, b) => Number(a.auto) - Number(b.auto))[0] ?? null
  return { money: money && money.amount > 0 ? money : null, shipping: ship, codeProblem }
}

// ---------------------------------------------------------------------------
// Delivery methods
// ---------------------------------------------------------------------------

export interface MethodQuote {
  method: Method
  label: string
  fee: number
  note?: string
  // False with a reason when it can't be picked for this cart.
  ok: boolean
  reason?: string
}

export const METHOD_LABEL: Record<Method, string> = { ship: 'Shipping', express: 'Express shipping', pickup: 'Pickup', delivery: 'Local delivery', none: 'No delivery needed' }

const zipMatch = (zips: readonly string[], zip: string | undefined) => {
  if (!zip) return false
  const z = zip.replace(/\s+/g, '').toUpperCase()
  return zips.some((x) => {
    const y = x.replace(/\s+/g, '').toUpperCase()
    // "M5V*" covers every code starting M5V.
    return y.endsWith('*') ? z.startsWith(y.slice(0, -1)) : z === y || (z.length > y.length && /^\d+$/.test(y) && z.startsWith(y + '-'))
  })
}

export function methodQuotes(settings: ShopSettings, itemsTotal: number, zip: string | undefined, freeShipping: boolean, needsDelivery: boolean): MethodQuote[] {
  if (!needsDelivery) return [{ method: 'none', label: METHOD_LABEL.none, fee: 0, ok: true }]
  const s = settings.shipping ?? {}
  const cur = settings.currency
  const out: MethodQuote[] = []
  if (s.ship) {
    const free = freeShipping || (s.ship.freeOver !== undefined && itemsTotal >= s.ship.freeOver)
    out.push({ method: 'ship', label: METHOD_LABEL.ship, fee: free ? 0 : s.ship.rate, ok: true, note: [s.ship.days, !free && s.ship.freeOver !== undefined ? `Free over ${formatPrice(s.ship.freeOver, cur)}` : ''].filter(Boolean).join(' · ') || undefined })
    if (s.ship.express) out.push({ method: 'express', label: METHOD_LABEL.express, fee: s.ship.express.rate, ok: true, note: s.ship.express.days })
  }
  if (s.pickup) out.push({ method: 'pickup', label: METHOD_LABEL.pickup, fee: 0, ok: true, note: s.pickup.note })
  if (s.delivery) {
    const d = s.delivery
    const reason = !zip ? 'Enter your ZIP or postal code to check.' : !zipMatch(d.zips, zip) ? 'We don’t deliver to that area yet.' : d.minOrder && itemsTotal < d.minOrder ? `Local delivery needs an order of ${formatPrice(d.minOrder, cur)} or more.` : undefined
    out.push({ method: 'delivery', label: METHOD_LABEL.delivery, fee: d.fee, ok: !reason, reason, note: d.note })
  }
  return out
}

// ---------------------------------------------------------------------------
// Pricing a cart
// ---------------------------------------------------------------------------

export interface QuoteLine {
  productId: string
  variantId?: string
  name: string
  variant?: string
  sku?: string
  image?: { src: string; alt: string }
  slug: string
  unit: number
  compareAt?: number
  qty: number
  total: number
  // How many more can be sold (Infinity when not counted).
  max: number
  noShipping: boolean
}

export interface Quote {
  currency: string
  lines: QuoteLine[]
  count: number
  subtotal: number
  discount: AppliedDiscount | null
  freeShipping: AppliedDiscount | null
  codeProblem: string | null
  methods: MethodQuote[]
  method: Method | null
  shipping: number
  // Before tax (Stripe adds tax at checkout when the owner turned it on).
  total: number
  // Things the shopper should know: an item sold out, a quantity lowered.
  notices: string[]
  // What stops checkout, if anything.
  blocker: string | null
}

export function priceCart(settings: ShopSettings, cart: Cart, stock: Stock, opts: { today: string; uses?: Record<string, number> }): Quote {
  const products = new Map(settings.products.map((p) => [p.id, p]))
  const slugs = productSlugs(settings.products)
  const notices: string[] = []
  const lines: QuoteLine[] = []
  for (const item of cart.items) {
    const p = products.get(item.p)
    // Amazon picks are bought on Amazon, never here.
    if (!p || !isLive(p) || p.amazon) {
      notices.push('An item in your cart is no longer available, so it was taken out.')
      continue
    }
    const v = item.v ? p.variants?.find((x) => x.id === item.v) : undefined
    if ((item.v && !v) || (!item.v && hasVariants(p))) {
      notices.push(`Please choose the options for ${p.name} again.`)
      continue
    }
    const max = availableQty(p, v, stock)
    if (max <= 0) {
      notices.push(`${p.name}${v ? ` (${variantLabel(v)})` : ''} just sold out, so it was taken out of your cart.`)
      continue
    }
    const qty = Math.min(item.q, max, MAX_QTY)
    if (qty < item.q) notices.push(`Only ${qty} of ${p.name}${v ? ` (${variantLabel(v)})` : ''} left, so your cart was updated.`)
    const unit = unitPrice(p, v)
    lines.push({
      productId: p.id,
      ...(v ? { variantId: v.id, variant: variantLabel(v) } : {}),
      name: p.name,
      ...((v?.sku ?? p.sku) ? { sku: v?.sku ?? p.sku } : {}),
      ...(p.image ? { image: p.image } : {}),
      slug: slugs.get(p.id)!,
      unit,
      ...(compareAtOf(p, v) ? { compareAt: compareAtOf(p, v) } : {}),
      qty,
      total: unit * qty,
      max,
      noShipping: !!p.noShipping,
    })
  }
  const subtotal = lines.reduce((n, l) => n + l.total, 0)
  const { money, shipping: freeShip, codeProblem } = applyDiscounts(settings, subtotal, cart.code, opts.today, opts.uses)
  const discount = money ? { ...money, amount: Math.min(money.amount, subtotal) } : null
  const itemsTotal = subtotal - (discount?.amount ?? 0)
  const needsDelivery = lines.some((l) => !l.noShipping)
  const methods = methodQuotes(settings, itemsTotal, cart.zip, !!freeShip, needsDelivery)
  const okMethods = methods.filter((m) => m.ok)
  const chosen = methods.find((m) => m.method === cart.method && m.ok) ?? (okMethods.length === 1 || !needsDelivery ? okMethods[0] : null) ?? null
  const shipping = chosen?.fee ?? 0
  const blocker = !lines.length
    ? 'Your cart is empty.'
    : settings.open === false
      ? 'The shop is taking a short break from orders.'
      : !methods.length
        ? 'This shop hasn’t set up delivery yet. Please get in touch to order.'
        : !chosen
          ? 'Choose how you’d like to get your order.'
          : null
  return {
    currency: settings.currency,
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal,
    discount,
    freeShipping: freeShip && chosen && ['ship', 'express'].includes(chosen.method) ? freeShip : null,
    codeProblem,
    methods,
    method: chosen?.method ?? null,
    shipping,
    total: itemsTotal + shipping,
    notices,
    blocker,
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface Address {
  line1: string
  line2?: string
  city: string
  state?: string
  postal: string
  country: string
}

export interface OrderLine {
  productId: string
  variantId?: string
  name: string
  variant?: string
  sku?: string
  image?: string
  unit: number
  qty: number
  total: number
  // Owner's cost per item when it was bought, for profit.
  cost?: number
}

export type OrderStatus = 'open' | 'paid' | 'abandoned' | 'canceled'
export type PaymentStatus = 'pending' | 'paid' | 'partially_refunded' | 'refunded'
export type Fulfillment = 'unfulfilled' | 'shipped' | 'ready' | 'out' | 'done'

export interface OrderEvent {
  at: string
  text: string
  // Who did it: a person's name, "Customer", "Stripe" or "SaySites".
  by?: string
}

export interface Order {
  id: string
  siteId: string
  // #1001, #1002…: given when the order is paid.
  number?: number
  // The order's private address for the customer (/order/<token>).
  token: string
  status: OrderStatus
  payment: PaymentStatus
  fulfillment: Fulfillment
  method: Method
  currency: string
  lines: OrderLine[]
  subtotal: number
  discount: number
  discountCode?: string
  shipping: number
  tax: number
  total: number
  refunded: number
  customer?: { name?: string; email?: string; phone?: string; address?: Address }
  zip?: string
  stripe: { account: string; session?: string; paymentIntent?: string }
  tracking?: { carrier?: string; number?: string; url?: string }
  // Stock was taken for this order (and put back when refunded with restock).
  stockTaken?: boolean
  timeline: OrderEvent[]
  createdAt: string
  paidAt?: string
  updatedAt: string
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = { pending: 'Payment pending', paid: 'Paid', partially_refunded: 'Partly refunded', refunded: 'Refunded' }

export function fulfillmentLabel(o: Pick<Order, 'fulfillment' | 'method'>): string {
  if (o.fulfillment === 'unfulfilled') return o.method === 'pickup' ? 'To get ready' : o.method === 'none' ? 'To complete' : 'To send'
  if (o.fulfillment === 'shipped') return 'Shipped'
  if (o.fulfillment === 'ready') return 'Ready for pickup'
  if (o.fulfillment === 'out') return 'Out for delivery'
  return o.method === 'pickup' ? 'Picked up' : o.method === 'ship' || o.method === 'express' ? 'Delivered' : o.method === 'delivery' ? 'Delivered' : 'Completed'
}

// The next step for an order, as a button label and the state it moves to.
export function nextSteps(o: Pick<Order, 'fulfillment' | 'method' | 'status'>): { to: Fulfillment; label: string }[] {
  if (o.status !== 'paid') return []
  if (o.fulfillment === 'done') return []
  if (o.method === 'pickup') return o.fulfillment === 'unfulfilled' ? [{ to: 'ready', label: 'Ready for pickup' }, { to: 'done', label: 'Mark picked up' }] : [{ to: 'done', label: 'Mark picked up' }]
  if (o.method === 'delivery') return o.fulfillment === 'unfulfilled' ? [{ to: 'out', label: 'Out for delivery' }, { to: 'done', label: 'Mark delivered' }] : [{ to: 'done', label: 'Mark delivered' }]
  if (o.method === 'none') return [{ to: 'done', label: 'Mark completed' }]
  return o.fulfillment === 'unfulfilled' ? [{ to: 'shipped', label: 'Mark shipped' }] : [{ to: 'done', label: 'Mark delivered' }]
}

export const needsAction = (o: Order) => o.status === 'paid' && o.fulfillment !== 'done' && o.payment !== 'refunded'

export const orderName = (o: Pick<Order, 'number' | 'id'>) => (o.number ? `#${o.number}` : 'Draft')

export function paymentAfterRefund(total: number, refunded: number): PaymentStatus {
  return refunded <= 0 ? 'paid' : refunded >= total ? 'refunded' : 'partially_refunded'
}

// A Stripe-ready tracking link for the big carriers, from the number alone.
export function trackingUrl(carrier: string | undefined, number: string): string | undefined {
  const n = encodeURIComponent(number.trim())
  switch ((carrier ?? '').toLowerCase()) {
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`
    case 'ups':
      return `https://www.ups.com/track?tracknum=${n}`
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    case 'dhl':
      return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id=${n}`
    case 'canada post':
      return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${n}`
    case 'royal mail':
      return `https://www.royalmail.com/track-your-item#/tracking-results/${n}`
    default:
      return undefined
  }
}
export const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Canada Post', 'Royal Mail', 'Other'] as const

// ---------------------------------------------------------------------------
// Customers (made from orders: no separate accounts to manage)
// ---------------------------------------------------------------------------

export interface Customer {
  email: string
  name: string
  phone?: string
  orders: number
  spent: number
  first: string
  last: string
}

export function customersFrom(orders: readonly Order[]): Customer[] {
  const m = new Map<string, Customer>()
  for (const o of orders) {
    const email = o.customer?.email?.toLowerCase()
    if (o.status !== 'paid' || !email) continue
    const at = o.paidAt ?? o.createdAt
    const c = m.get(email) ?? { email, name: o.customer?.name ?? email, orders: 0, spent: 0, first: at, last: at }
    c.orders++
    c.spent += o.total - o.refunded
    if (at < c.first) c.first = at
    if (at >= c.last) {
      c.last = at
      if (o.customer?.name) c.name = o.customer.name
      if (o.customer?.phone) c.phone = o.customer.phone
    }
    m.set(email, c)
  }
  return [...m.values()].sort((a, b) => b.spent - a.spent || b.orders - a.orders)
}

// ---------------------------------------------------------------------------
// The shop's numbers
// ---------------------------------------------------------------------------

export interface ShopStats {
  sales: number
  orders: number
  aov: number | null
  refunded: number
  // Paid minus refunds minus the owner's costs, when every item has a cost.
  profit: number | null
  returningRate: number | null
  toSend: number
  top: { name: string; qty: number; sales: number }[]
  byDay: { day: string; sales: number; orders: number }[]
}

export function shopStats(orders: readonly Order[], sinceDay: string, days: string[]): ShopStats {
  const paid = orders.filter((o) => o.status === 'paid' && (o.paidAt ?? o.createdAt).slice(0, 10) >= sinceDay)
  const sales = paid.reduce((n, o) => n + o.total, 0)
  const refunded = paid.reduce((n, o) => n + o.refunded, 0)
  const costed = paid.every((o) => o.lines.every((l) => l.cost !== undefined))
  const profit = paid.length && costed ? paid.reduce((n, o) => n + o.total - o.tax - o.shipping - o.refunded - o.lines.reduce((c, l) => c + (l.cost ?? 0) * l.qty, 0), 0) : null
  // Returning: customers in this period who had paid before it, or more than once in it.
  const earlier = new Set(orders.filter((o) => o.status === 'paid' && (o.paidAt ?? o.createdAt).slice(0, 10) < sinceDay).map((o) => o.customer?.email?.toLowerCase()).filter(Boolean))
  const counts = new Map<string, number>()
  for (const o of paid) {
    const e = o.customer?.email?.toLowerCase()
    if (e) counts.set(e, (counts.get(e) ?? 0) + 1)
  }
  const returning = [...counts].filter(([e, n]) => n > 1 || earlier.has(e)).length
  const top = new Map<string, { name: string; qty: number; sales: number }>()
  for (const o of paid)
    for (const l of o.lines) {
      const t = top.get(l.productId) ?? { name: l.name, qty: 0, sales: 0 }
      t.qty += l.qty
      t.sales += l.total
      top.set(l.productId, t)
    }
  const byDay = new Map(days.map((d) => [d, { day: d, sales: 0, orders: 0 }]))
  for (const o of paid) {
    const d = byDay.get((o.paidAt ?? o.createdAt).slice(0, 10))
    if (d) (d.sales += o.total, d.orders++)
  }
  return {
    sales,
    orders: paid.length,
    aov: paid.length ? Math.round(sales / paid.length) : null,
    refunded,
    profit,
    returningRate: counts.size ? Math.round((returning / counts.size) * 100) : null,
    toSend: orders.filter(needsAction).length,
    top: [...top.values()].sort((a, b) => b.sales - a.sales).slice(0, 5),
    byDay: [...byDay.values()],
  }
}

// Store events counted with page views (lib/store recordVisit), so the
// funnel needs no cookies: product views come from /shop/ page views.
export const ADD_KEY = '#add'
export const CHECKOUT_KEY = '#checkout'

export interface Funnel {
  views: number
  adds: number
  checkouts: number
  paid: number
}

export function funnel(visits: readonly { path: string; views: number }[], paidOrders: number): Funnel {
  let views = 0
  let adds = 0
  let checkouts = 0
  for (const v of visits) {
    if (v.path.startsWith('/shop')) views += v.views
    else if (v.path === ADD_KEY) adds += v.views
    else if (v.path === CHECKOUT_KEY) checkouts += v.views
  }
  return { views, adds, checkouts, paid: paidOrders }
}

// ---------------------------------------------------------------------------
// Setting up
// ---------------------------------------------------------------------------

export interface SetupStep {
  key: string
  label: string
  done: boolean
  href: string
}

// The short list that gets a new shop ready to sell, in order.
export function setupSteps(s: ShopSettings | undefined, base: string, shopPageLive: boolean): SetupStep[] {
  const live = (s?.products ?? []).filter(isLive)
  return [
    { key: 'product', label: 'Add your first product', done: live.length > 0, href: `${base}/products/new` },
    { key: 'pay', label: 'Connect Stripe so customers can pay you', done: !!s?.checkout?.ready, href: `${base}/settings#payments` },
    { key: 'delivery', label: 'Choose shipping, pickup or local delivery', done: !!(s?.shipping?.ship || s?.shipping?.pickup || s?.shipping?.delivery) || (live.length > 0 && live.every((p) => p.noShipping)), href: `${base}/settings#delivery` },
    { key: 'returns', label: 'Write your return policy', done: !!s?.returns, href: `${base}/settings#returns` },
    { key: 'page', label: 'Put your shop on your website', done: shopPageLive, href: `${base}/products` },
  ]
}

// ---------------------------------------------------------------------------
// Spreadsheet export
// ---------------------------------------------------------------------------

const csvCell = (v: string | number | undefined) => {
  const s = String(v ?? '')
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
const money = (c: number) => (c / 100).toFixed(2)

export function ordersCsv(orders: readonly Order[]): string {
  const head = ['order', 'date', 'status', 'payment', 'fulfillment', 'method', 'customer', 'email', 'phone', 'address', 'items', 'subtotal', 'discount', 'discount_code', 'shipping', 'tax', 'total', 'refunded', 'currency', 'tracking']
  const rows = orders
    .filter((o) => o.status === 'paid')
    .map((o) => {
      const a = o.customer?.address
      return [
        orderName(o),
        (o.paidAt ?? o.createdAt).slice(0, 10),
        o.status,
        PAYMENT_LABEL[o.payment],
        fulfillmentLabel(o),
        METHOD_LABEL[o.method],
        o.customer?.name,
        o.customer?.email,
        o.customer?.phone,
        a ? [a.line1, a.line2, a.city, a.state, a.postal, a.country].filter(Boolean).join(', ') : '',
        o.lines.map((l) => `${l.qty} x ${l.name}${l.variant ? ` (${l.variant})` : ''}`).join('; '),
        money(o.subtotal),
        money(o.discount),
        o.discountCode,
        money(o.shipping),
        money(o.tax),
        money(o.total),
        money(o.refunded),
        o.currency,
        o.tracking?.number,
      ].map(csvCell)
    })
  return [head.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n'
}
