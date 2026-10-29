import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addToCart,
  applyDiscounts,
  availableQty,
  buildVariants,
  cartCookie,
  customersFrom,
  decodeCart,
  encodeCart,
  funnel,
  lowStock,
  methodQuotes,
  nextSteps,
  ordersCsv,
  parsePrice,
  priceCart,
  productSlugs,
  readCartCookie,
  setupSteps,
  shopStats,
  trackingUrl,
  type Order,
} from '../apps/saysites/lib/commerce'
import { checkoutParams } from '../apps/saysites/lib/checkout'
import { draftOrder, refundOrder, settleOrder } from '../apps/saysites/lib/orders'
import { renderPage } from '../apps/saysites/lib/render'
import { SiteSchema, type Product, type ShopSettings, type Site } from '../apps/saysites/lib/schema'
import { serveSitePath } from '../apps/saysites/lib/serve'
import { productData, sitemapXml, structuredData } from '../apps/saysites/lib/seo'
import { SHOWCASE } from '../apps/saysites/lib/showcase'
import { handleCartPost, handleCheckout, serveCart, serveThanks } from '../apps/saysites/lib/shop-serve'
import { checkSpeed } from '../apps/saysites/lib/speed'
import { MemoryStore } from '../apps/saysites/lib/store'
import { Workspace, runTool } from '../apps/saysites/lib/sofie'

const TODAY = '2026-10-14'
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

const candle: Product = { id: 'p-candle', name: 'Lavender candle', price: 2400, compareAt: 3000, cost: 900, track: true, image: { src: 'https://images.unsplash.com/photo-1?w=800', alt: 'A candle' }, category: 'Candles' }
const tee: Product = {
  id: 'p-tee',
  name: 'Everyday tee',
  price: 3400,
  track: true,
  options: [
    { name: 'Size', values: ['S', 'M'] },
    { name: 'Color', values: ['Black', 'Natural'] },
  ],
  variants: [
    { id: 'v1', values: ['S', 'Black'] },
    { id: 'v2', values: ['S', 'Natural'] },
    { id: 'v3', values: ['M', 'Black'], price: 3600 },
    { id: 'v4', values: ['M', 'Natural'], soldOut: true },
  ],
}
const gift: Product = { id: 'p-gift', name: 'Gift card', price: 5000, noShipping: true }
const draft: Product = { id: 'p-draft', name: 'Secret thing', price: 100, status: 'draft' }
const hidden: Product = { id: 'p-hidden', name: 'Warranty add-on', price: 1500, status: 'unlisted' }

const settings: ShopSettings = {
  currency: 'USD',
  products: [candle, tee, gift, draft, hidden],
  checkout: { account: 'acct_123456789', ready: true },
  shipping: { ship: { rate: 600, freeOver: 5000, countries: ['US', 'CA'], days: '3 to 5 business days' }, pickup: { note: '12 Church St, daily 10 to 6' }, delivery: { fee: 500, zips: ['05401', '05402', 'M5V*'], minOrder: 2000 } },
  discounts: [
    { code: 'SPRING10', kind: 'percent', value: 10, active: true },
    { code: 'FIVE', kind: 'amount', value: 500, minSubtotal: 4000, active: true },
    { code: 'OLD', kind: 'percent', value: 50, endsOn: '2026-01-01', active: true },
    { code: 'ONCE', kind: 'amount', value: 1000, limit: 1, active: true },
    { code: 'AUTO-SHIP', kind: 'shipping', value: 0, minSubtotal: 3000, auto: true, active: true },
  ],
  returns: { days: 30, free: true },
}
const stock = { 'p-candle': 3, 'p-tee/v1': 5, 'p-tee/v2': 0, 'p-tee/v3': 2 }

function shopSite(): { site: Site; pages: ReturnType<typeof clone<(typeof SHOWCASE)['field-and-thread']['pages']>> } {
  const base = clone(SHOWCASE['field-and-thread'])
  const site = SiteSchema.parse({ ...base.site, store: settings })
  return { site, pages: base.pages }
}

describe('SaySites shop: products and variants', () => {
  it('builds every combination of options, keeping existing ones', () => {
    const vs = buildVariants([{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['Black', 'Natural'] }], tee.variants)
    expect(vs).toHaveLength(6)
    expect(vs.find((v) => v.values.join() === 'M,Black')).toMatchObject({ id: 'v3', price: 3600 })
    expect(new Set(vs.map((v) => v.id)).size).toBe(6)
  })

  it('gives each product a unique address', () => {
    const s = productSlugs([{ id: 'a', name: 'Tote bag', price: 1 }, { id: 'b', name: 'Tote Bag', price: 1 }, { id: 'c', name: 'X', price: 1, slug: 'tote-bag' }])
    expect(s.get('c')).toBe('tote-bag')
    expect(new Set(s.values()).size).toBe(3)
  })

  it('counts what can still be sold', () => {
    expect(availableQty(candle, undefined, stock)).toBe(3)
    expect(availableQty(tee, tee.variants![3], stock)).toBe(0)
    expect(availableQty(gift, undefined, {})).toBe(Infinity)
    expect(availableQty({ ...candle, oversell: true }, undefined, {})).toBe(Infinity)
    expect(lowStock(settings, stock).map((x) => x.product.id + (x.variant?.id ?? ''))).toEqual(['p-teev2', 'p-teev3', 'p-candle'])
  })

  it('reads prices people type', () => {
    expect(parsePrice('24')).toBe(2400)
    expect(parsePrice('$1,024.5')).toBe(102450)
    expect(parsePrice('abc')).toBeNull()
    expect(parsePrice('1.234')).toBeNull()
  })
})

describe('SaySites shop: the cart', () => {
  it('round-trips the cookie and survives junk', () => {
    const cart = addToCart(addToCart({ items: [] }, { p: 'p-candle', q: 2 }), { p: 'p-candle', q: 1 })
    expect(cart.items).toEqual([{ p: 'p-candle', q: 3 }])
    const back = decodeCart(encodeCart({ ...cart, method: 'pickup', code: 'SPRING10' }))
    expect(back).toEqual({ items: [{ p: 'p-candle', q: 3 }], method: 'pickup', code: 'SPRING10' })
    expect(decodeCart('not base64 {')).toEqual({ items: [] })
    expect(decodeCart(Buffer.from(JSON.stringify({ i: [['../etc', 1], ['ok', -2], ['fine', 2, 'BAD ID']] })).toString('base64url'))).toEqual({ items: [] })
    expect(readCartCookie(`a=1; ss_cart=${encodeCart(cart)}`).items).toHaveLength(1)
    expect(cartCookie({ items: [] })).toContain('Max-Age=0')
    expect(cartCookie(cart)).toMatch(/HttpOnly/)
  })

  it('prices a cart from the shop, never from the cookie, and fixes what can’t be bought', () => {
    const q = priceCart(settings, { items: [{ p: 'p-candle', q: 9 }, { p: 'p-tee', v: 'v3', q: 1 }, { p: 'p-tee', v: 'v4', q: 1 }, { p: 'p-draft', q: 1 }, { p: 'p-tee', q: 1 }], method: 'ship' }, stock, { today: TODAY })
    expect(q.lines.map((l) => [l.productId, l.variantId, l.qty, l.unit])).toEqual([
      ['p-candle', undefined, 3, 2400],
      ['p-tee', 'v3', 1, 3600],
    ])
    expect(q.notices).toHaveLength(4)
    expect(q.subtotal).toBe(10800)
    // Free shipping over $50 (and the automatic free-shipping deal).
    expect(q.shipping).toBe(0)
    expect(q.total).toBe(10800)
    expect(q.blocker).toBeNull()
  })

  it('applies codes, minimums, limits, end dates and automatic deals', () => {
    expect(applyDiscounts(settings, 10000, 'SPRING10', TODAY).money).toMatchObject({ code: 'SPRING10', amount: 1000 })
    expect(applyDiscounts(settings, 3000, 'FIVE', TODAY).codeProblem).toMatch(/\$40/)
    expect(applyDiscounts(settings, 10000, 'OLD', TODAY).codeProblem).toMatch(/ended/)
    expect(applyDiscounts(settings, 10000, 'ONCE', TODAY, { ONCE: 1 }).codeProblem).toMatch(/used up/)
    expect(applyDiscounts(settings, 10000, 'NOPE', TODAY).codeProblem).toMatch(/isn’t valid/)
    expect(applyDiscounts(settings, 10000, 'AUTO-SHIP', TODAY).codeProblem).toMatch(/isn’t valid/)
    const both = applyDiscounts(settings, 4000, 'SPRING10', TODAY)
    expect(both.money?.code).toBe('SPRING10')
    expect(both.shipping?.code).toBe('AUTO-SHIP')
  })

  it('offers shipping, pickup and local delivery by ZIP, with a minimum', () => {
    const near = methodQuotes(settings, 2500, '05401', false, true)
    expect(near.map((m) => [m.method, m.fee, m.ok])).toEqual([['ship', 600, true], ['pickup', 0, true], ['delivery', 500, true]])
    expect(methodQuotes(settings, 2500, '90210', false, true).find((m) => m.method === 'delivery')).toMatchObject({ ok: false })
    expect(methodQuotes(settings, 2500, 'M5V 2T6', false, true).find((m) => m.method === 'delivery')!.ok).toBe(true)
    expect(methodQuotes(settings, 1000, '05401', false, true).find((m) => m.method === 'delivery')!.reason).toMatch(/\$20/)
    // Nothing to deliver: no choice needed.
    expect(priceCart(settings, { items: [{ p: 'p-gift', q: 1 }] }, {}, { today: TODAY })).toMatchObject({ method: 'none', shipping: 0, blocker: null })
    // Several ways and none picked: the shopper must choose.
    expect(priceCart(settings, { items: [{ p: 'p-candle', q: 1 }] }, stock, { today: TODAY }).blocker).toMatch(/Choose/)
  })

  it('pauses checkout when the shop takes a break', () => {
    expect(priceCart({ ...settings, open: false }, { items: [{ p: 'p-gift', q: 1 }] }, {}, { today: TODAY }).blocker).toMatch(/break/)
  })
})

describe('SaySites shop: the storefront', () => {
  it('shows listed products with add to cart, choose options, sale and sold out, fast', () => {
    const { site, pages } = shopSite()
    const shop = pages.find((p) => p.slug === 'shop')!
    const r = renderPage(site, shop, pages, { stock })
    expect(r.html).toContain('action="/__cart"')
    expect(r.html).toContain('href="/shop/everyday-tee">Choose options')
    expect(r.html).toContain('<s class="pr-was">')
    expect(r.html).not.toContain('Secret thing')
    expect(r.html).not.toContain('Warranty add-on')
    expect(r.html).toContain('class="sh-cart" href="/cart"')
    expect(r.html).not.toMatch(/<script(?! type="application\/ld\+json")/)
    expect(checkSpeed(r).pass).toBe(true)
  })

  it('serves each product on its own page with full Google product data', () => {
    const { site, pages } = shopSite()
    const res = serveSitePath({ site, pages, redirects: [], stock }, ['shop', 'everyday-tee'], { preview: false })
    expect(res.status).toBe(200)
    const page = { id: 'x', siteId: site.id, slug: 'shop/everyday-tee', name: 'Everyday tee', status: 'published' as const, seo: { title: 'Tee', description: 'Tee' }, body: [{ id: 's', type: 'container' as const, layout: 'flex' as const, children: [{ id: 'pd', type: 'product' as const, productId: 'p-tee' }] }], updatedAt: site.updatedAt }
    const ld = structuredData(site, page, pages, stock) as { '@type': string; hasVariant?: { offers: { price: string; availability: string; hasMerchantReturnPolicy?: object; shippingDetails?: object } }[]; variesBy?: string[] }[]
    const group = ld.find((d) => d['@type'] === 'ProductGroup')!
    expect(group.variesBy).toEqual(['https://schema.org/size', 'https://schema.org/color'])
    expect(group.hasVariant!.map((v) => [v.offers.price, v.offers.availability.split('/').pop()])).toEqual([
      ['34.00', 'InStock'],
      ['34.00', 'OutOfStock'],
      ['36.00', 'InStock'],
      ['34.00', 'OutOfStock'],
    ])
    expect(group.hasVariant![0].offers.hasMerchantReturnPolicy).toMatchObject({ merchantReturnDays: 30, returnFees: 'https://schema.org/FreeReturn' })
    expect(group.hasVariant![0].offers.shippingDetails).toBeTruthy()
    expect(productData(site, gift, 'https://x/shop/gift-card')).toMatchObject({ '@type': 'Product', offers: { price: '50.00' } })
  })

  it('keeps drafts off the site and unlisted products out of search', () => {
    const { site, pages } = shopSite()
    expect(serveSitePath({ site, pages, redirects: [] }, ['shop', 'secret-thing'], { preview: false }).status).toBe(404)
    const xml = sitemapXml(site, pages)
    expect(xml).toContain('/shop/lavender-candle')
    expect(xml).not.toContain('warranty-add-on')
    expect(xml).toContain('/returns')
    expect(serveSitePath({ site, pages, redirects: [] }, ['returns'], { preview: false }).status).toBe(200)
  })

  it('asks people to get in touch, or uses a payment link, when checkout isn’t connected', () => {
    const { site, pages } = shopSite()
    const off = SiteSchema.parse({ ...site, store: { ...site.store!, checkout: undefined, products: [{ ...candle, buyUrl: 'https://buy.stripe.com/test_1' }, gift] } })
    const html = renderPage(off, pages.find((p) => p.slug === 'shop')!, pages, { stock }).html
    expect(html).toContain('href="https://buy.stripe.com/test_1"')
    expect(html).toContain('href="/contact">Ask about this')
    expect(html).not.toContain('class="sh-cart"')
  })
})

describe('SaySites shop: checkout and orders', () => {
  afterEach(() => vi.unstubAllGlobals())

  async function setup() {
    const store = new MemoryStore()
    const owner = await store.createUser({ email: 'owner@example.com', name: 'Owner', passwordHash: 'x' })
    const { site: s0, pages } = shopSite()
    const site = { ...s0, orgId: owner.id, subdomain: 'field-test-shop', id: 'site-field-test' }
    await store.createSite(owner.id, site, pages)
    await store.setStock(site.id, 'p-candle', 3)
    await store.setStock(site.id, 'p-tee/v1', 5)
    return { store, site, pages, bundle: { site, pages, redirects: [], stock: await store.stock(site.id) } }
  }

  it('builds a direct-charge checkout with no fee for SaySites', () => {
    const { site } = shopSite()
    const quote = priceCart(settings, { items: [{ p: 'p-candle', q: 1 }], method: 'delivery', zip: '05401', code: 'SPRING10' }, stock, { today: TODAY })
    const order = draftOrder(site, quote, 'acct_123456789', '05401')
    const p = checkoutParams({ site, settings, quote, order, origin: 'https://field.example', coupon: 'co_1' }) as Record<string, unknown>
    expect(JSON.stringify(p)).not.toContain('application_fee')
    expect(p).toMatchObject({ mode: 'payment', discounts: [{ coupon: 'co_1' }], phone_number_collection: { enabled: true }, shipping_address_collection: { allowed_countries: ['US'] } })
    expect((p.shipping_options as { shipping_rate_data: { fixed_amount: { amount: number } } }[])[0].shipping_rate_data.fixed_amount.amount).toBe(500)
    expect(String(p.success_url)).toContain(`o=${order.token}`)
    expect(order.lines[0]).toMatchObject({ productId: 'p-candle', qty: 1, cost: 900 })
    expect(order.discount).toBe(240)
  })

  it('goes from cart to Stripe to a numbered, paid order that takes stock once', async () => {
    const { store, site, bundle } = await setup()
    const calls: { url: string; body: string; headers: Record<string, string> }[] = []
    vi.stubGlobal('fetch', async (url: string, init: { body?: string; headers?: Record<string, string> }) => {
      calls.push({ url, body: init.body ?? '', headers: init.headers ?? {} })
      if (url.includes('/checkout/sessions/cs_1')) {
        return new Response(JSON.stringify({ id: 'cs_1', status: 'complete', payment_status: 'paid', amount_subtotal: 4800, amount_total: 4800, total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 }, customer_details: { email: 'buyer@example.com', name: 'Bea Buyer' }, payment_intent: 'pi_1' }))
      }
      return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' }))
    })
    const form = (o: Record<string, string>) => {
      const f = new FormData()
      for (const [k, v] of Object.entries(o)) f.set(k, v)
      return f
    }
    const add = await handleCartPost(bundle, new Request('https://field.example/__cart', { method: 'POST', body: form({ a: 'add', p: 'p-candle', q: '2' }) }), store, { preview: false })
    expect(add.status).toBe(303)
    const cookie = add.headers.get('set-cookie')!.split(';')[0]
    const cart = await serveCart(bundle, new Request('https://field.example/cart', { headers: { cookie } }), store, { preview: false })
    expect(await cart.text()).toContain('Lavender candle')

    const go = await handleCheckout(bundle, new Request('https://field.example/__checkout', { method: 'POST', headers: { cookie }, body: form({ m: 'pickup' }) }), store, { preview: false })
    expect(go.status).toBe(303)
    expect(go.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_1')
    expect(calls[0].headers['Stripe-Account']).toBe('acct_123456789')
    const [order] = await store.ordersForSite(site.id)
    expect(order).toMatchObject({ status: 'open', method: 'pickup', stripe: { session: 'cs_1' } })

    const thanks = await serveThanks(bundle, new Request(`https://field.example/cart/thanks?o=${order.token}&s=cs_1`), store, { preview: false })
    expect(thanks.headers.get('set-cookie')).toContain('Max-Age=0')
    const paid = (await store.order(site.id, order.id))!
    expect(paid).toMatchObject({ status: 'paid', number: 1001, payment: 'paid', customer: { email: 'buyer@example.com' }, stockTaken: true })
    expect((await store.stock(site.id))['p-candle']).toBe(1)
    // A second settle (the webhook) changes nothing.
    await settleOrder(store, site, paid)
    expect((await store.stock(site.id))['p-candle']).toBe(1)
    expect(await store.markOrderPaid(site.id, order.id, TODAY)).toBeNull()
  })

  it('refunds through the owner’s Stripe and puts stock back', async () => {
    const { store, site } = await setup()
    const quote = priceCart(settings, { items: [{ p: 'p-candle', q: 2 }], method: 'pickup' }, { 'p-candle': 3 }, { today: TODAY })
    const o: Order = { ...draftOrder(site, quote, 'acct_123456789'), status: 'paid', payment: 'paid', number: 1001, stockTaken: true, stripe: { account: 'acct_123456789', paymentIntent: 'pi_1' } }
    await store.saveOrder(o)
    await store.setStock(site.id, 'p-candle', 1)
    const seen: string[] = []
    vi.stubGlobal('fetch', async (url: string, init: { body?: string; headers?: Record<string, string> }) => {
      seen.push(`${url} ${init.headers?.['Stripe-Account']} ${init.body}`)
      return new Response(JSON.stringify({ id: 're_1', status: 'succeeded' }))
    })
    await expect(refundOrder(store, site, o, 99999, true, 'Owner')).rejects.toThrow(/up to/)
    const r = await refundOrder(store, site, o, o.total, true, 'Owner')
    expect(seen[0]).toContain('/v1/refunds acct_123456789')
    expect(r).toMatchObject({ payment: 'refunded', refunded: o.total, stockTaken: false })
    expect((await store.stock(site.id))['p-candle']).toBe(3)
  })

  it('steps orders along by how they’re delivered', () => {
    expect(nextSteps({ status: 'paid', method: 'ship', fulfillment: 'unfulfilled' }).map((s) => s.to)).toEqual(['shipped'])
    expect(nextSteps({ status: 'paid', method: 'pickup', fulfillment: 'unfulfilled' }).map((s) => s.to)).toEqual(['ready', 'done'])
    expect(nextSteps({ status: 'open', method: 'ship', fulfillment: 'unfulfilled' })).toEqual([])
    expect(trackingUrl('USPS', '9400 1000')).toContain('tLabels=9400%201000')
    expect(trackingUrl('Other', '1')).toBeUndefined()
  })
})

describe('SaySites shop: the owner’s numbers', () => {
  const at = (d: string) => `${d}T12:00:00.000Z`
  const order = (n: number, email: string, day: string, total: number, extra: Partial<Order> = {}): Order => ({
    id: `o${n}`,
    siteId: 's',
    number: 1000 + n,
    token: `t${n}`.padEnd(24, 'x'),
    status: 'paid',
    payment: 'paid',
    fulfillment: 'unfulfilled',
    method: 'ship',
    currency: 'USD',
    lines: [{ productId: 'p-candle', name: 'Lavender candle', unit: total, qty: 1, total, cost: 900 }],
    subtotal: total,
    discount: 0,
    shipping: 0,
    tax: 0,
    total,
    refunded: 0,
    customer: { email, name: email.split('@')[0] },
    stripe: { account: 'acct_123456789' },
    timeline: [],
    createdAt: at(day),
    paidAt: at(day),
    updatedAt: at(day),
    ...extra,
  })
  const orders = [order(1, 'a@x.com', '2026-09-01', 2400), order(2, 'a@x.com', '2026-10-10', 2400), order(3, 'b@x.com', '2026-10-12', 4800, { fulfillment: 'done' }), { ...order(4, 'c@x.com', '2026-10-13', 1000), status: 'abandoned' as const }]

  it('adds up sales, profit, returning customers and best sellers', () => {
    const s = shopStats(orders, '2026-10-01', ['2026-10-10', '2026-10-12'])
    expect(s).toMatchObject({ sales: 7200, orders: 2, aov: 3600, profit: 7200 - 1800, returningRate: 50, toSend: 2 })
    expect(s.top[0]).toMatchObject({ name: 'Lavender candle', qty: 2 })
    expect(s.byDay).toEqual([{ day: '2026-10-10', sales: 2400, orders: 1 }, { day: '2026-10-12', sales: 4800, orders: 1 }])
    expect(customersFrom(orders).map((c) => [c.email, c.orders, c.spent])).toEqual([['a@x.com', 2, 4800], ['b@x.com', 1, 4800]])
  })

  it('builds the funnel without cookies, and a safe spreadsheet', () => {
    expect(funnel([{ path: '/shop/a', views: 10 }, { path: '/shop', views: 5 }, { path: '#add', views: 4 }, { path: '#checkout', views: 2 }, { path: '/', views: 50 }], 1)).toEqual({ views: 15, adds: 4, checkouts: 2, paid: 1 })
    const csv = ordersCsv([order(9, 'x@x.com', '2026-10-01', 100, { customer: { name: '=HYPERLINK("evil")', email: 'x@x.com' } })])
    expect(csv).toContain(`"'=HYPERLINK(""evil"")"`)
    expect(csv.split('\n')).toHaveLength(3)
  })

  it('lists the steps to get a new shop selling', () => {
    expect(setupSteps(undefined, '/b', false).every((s) => !s.done)).toBe(true)
    expect(setupSteps(settings, '/b', true).every((s) => s.done)).toBe(true)
  })
})

describe('SaySites shop: Sofie', () => {
  it('adds and changes products from what the owner says, and can’t touch the shop any other way', async () => {
    const { site, pages } = shopSite()
    const ws = new Workspace({ site: { ...site, store: { currency: 'USD', products: [] } }, pages })
    const out = await runTool(ws, 'save_product', { product_json: JSON.stringify({ name: 'Beeswax candle', price: 18, options: [{ name: 'Size', values: ['Small', 'Large'] }], variant_prices: { Large: 28 }, stock: 12 }), summary: 'Added a candle' })
    expect(out).toMatch(/Product id: p-/)
    const p = ws.site.store!.products[0]
    expect(p).toMatchObject({ name: 'Beeswax candle', price: 1800, track: true })
    expect(p.variants!.map((v) => v.price)).toEqual([undefined, 2800])
    expect(Object.values(ws.stock)).toEqual([12])
    expect(await runTool(ws, 'save_product', { product_json: JSON.stringify({ name: 'No price' }), summary: 'x' })).toMatch(/never guess/)
    expect(await runTool(ws, 'update_site', { changes_json: JSON.stringify({ store: { currency: 'USD', products: [] } }), summary: 'x' })).toMatch(/cannot be changed/)
    await runTool(ws, 'remove_product', { id: p.id, summary: 'Removed it' })
    expect(ws.site.store!.products).toHaveLength(0)
  })
})
