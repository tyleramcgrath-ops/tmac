// The shop's request handlers on a customer's site: the cart (a cookie and
// plain form posts), heading to Stripe's checkout, the thank-you page, the
// customer's order page and the cart count in the header. Never cached:
// each answer depends on the shopper.

import { canSell, loadAccess } from './billing'
import { createCheckout } from './checkout'
import {
  ADD_KEY,
  CHECKOUT_KEY,
  addToCart,
  cartCookie,
  cartCount,
  checkoutOpen,
  hasVariants,
  isLive,
  priceCart,
  productPath,
  productSlugs,
  readCartCookie,
  setQty,
  type Cart,
  type Method,
} from './commerce'
import { draftOrder, settleOrder } from './orders'
import { renderPage, withBasePath } from './render'
import { siteOrigin } from './schema'
import { CART_MESSAGES, cartBadge, renderCart, renderOrder, shellPage } from './shop-render'
import type { SiteBundle } from './sites'
import { wordsFor } from './site-words'
import type { Store } from './store'

export interface ShopServeOptions {
  preview: boolean
  basePath?: string
}

const today = () => new Date().toISOString().slice(0, 10)
const NO_STORE = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }

function redirect(to: string, opts: ShopServeOptions, cart?: Cart): Response {
  const headers = new Headers({ location: (opts.basePath ?? '') + to, ...NO_STORE })
  if (cart) headers.append('set-cookie', cartCookie(cart))
  return new Response(null, { status: 303, headers })
}

function page(bundle: SiteBundle, slug: string, title: string, inject: string, opts: ShopServeOptions, cart?: Cart): Response {
  let { html } = renderPage(bundle.site, shellPage(bundle.site, slug, title), bundle.pages, { stock: bundle.stock, inject: `<h1 class="shop-h">${title.replace(/[<>&"]/g, '')}</h1>${inject}` })
  if (opts.basePath) html = withBasePath(html, opts.basePath)
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8', ...NO_STORE })
  if (cart) headers.append('set-cookie', cartCookie(cart))
  return new Response(html, { headers })
}

const field = (form: FormData, k: string, max = 80) => String(form.get(k) ?? '').trim().slice(0, max)

async function freshQuote(bundle: SiteBundle, cart: Cart, store: Store) {
  const settings = bundle.site.store!
  const [stock, uses] = await Promise.all([settings.products.some((p) => p.track) ? store.stock(bundle.site.id) : Promise.resolve({}), (settings.discounts ?? []).some((d) => d.limit) ? store.discountUses(bundle.site.id) : Promise.resolve({})])
  return priceCart(settings, cart, stock, { today: today(), uses })
}

const count = (store: Store, siteId: string, key: string, preview: boolean) => (preview ? Promise.resolve() : store.recordVisit(siteId, today(), key).catch(() => {}))

// POST /__cart: add, change a quantity, remove, or apply a code.
export async function handleCartPost(bundle: SiteBundle, req: Request, store: Store, opts: ShopServeOptions): Promise<Response> {
  const settings = bundle.site.store
  if (!settings?.products.length) return redirect('/', opts)
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return redirect('/cart', opts)
  }
  let cart = readCartCookie(req.headers.get('cookie'))
  const a = field(form, 'a', 10)
  const p = field(form, 'p', 64)
  const v = field(form, 'v', 64) || undefined
  const q = Math.max(0, Math.min(99, Math.floor(Number(field(form, 'q', 3)) || 0)))
  if (a === 'add') {
    const product = settings.products.find((x) => x.id === p && isLive(x) && !x.amazon)
    if (!product) return redirect('/cart', opts)
    if (hasVariants(product) && !product.variants!.some((x) => x.id === v)) return redirect(productPath(productSlugs(settings.products).get(product.id)!), opts)
    cart = addToCart(cart, { p, ...(hasVariants(product) ? { v } : {}), q: Math.max(1, q) })
    await count(store, bundle.site.id, ADD_KEY, opts.preview)
    return redirect('/cart?m=added', opts, cart)
  }
  if (a === 'set') return redirect('/cart', opts, setQty(cart, p, v, q))
  if (a === 'code') {
    const code = field(form, 'code', 30).toUpperCase().replace(/\s+/g, '')
    cart = { ...cart, ...(code ? { code } : { code: undefined }) }
    return redirect(code ? '/cart?m=code' : '/cart', opts, cart)
  }
  return redirect('/cart', opts)
}

// GET /cart
export async function serveCart(bundle: SiteBundle, req: Request, store: Store, opts: ShopServeOptions): Promise<Response> {
  const t = wordsFor(bundle.site.language)
  const settings = bundle.site.store
  if (!settings?.products.length) return redirect('/', opts)
  const cart = readCartCookie(req.headers.get('cookie'))
  const quote = await freshQuote(bundle, cart, store)
  const m = new URL(req.url).searchParams.get('m') ?? ''
  const message = m === 'code' && (quote.codeProblem || !quote.discount) ? '' : (CART_MESSAGES[m] ?? '')
  // Keep the cookie in step with what can actually be bought.
  const fixed: Cart | undefined = quote.notices.length ? { ...cart, items: quote.lines.map((l) => ({ p: l.productId, q: l.qty, ...(l.variantId ? { v: l.variantId } : {}) })) } : undefined
  return page(bundle, 'cart', t.shop.yourCart, renderCart(quote, { settings, stock: bundle.stock ?? {}, t }, message, cart.zip), opts, fixed)
}

const METHODS: Method[] = ['ship', 'express', 'pickup', 'delivery', 'none']

// POST /__checkout: makes the order and sends the shopper to Stripe.
export async function handleCheckout(bundle: SiteBundle, req: Request, store: Store, opts: ShopServeOptions): Promise<Response> {
  const { site } = bundle
  const settings = site.store
  if (!settings || !checkoutOpen(settings)) return redirect('/cart', opts)
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return redirect('/cart', opts)
  }
  const m = field(form, 'm', 10) as Method
  const zip = field(form, 'zip', 10).replace(/[^A-Za-z0-9 -]/g, '')
  const cart: Cart = { ...readCartCookie(req.headers.get('cookie')), ...(METHODS.includes(m) ? { method: m } : {}), ...(zip ? { zip } : {}) }
  const quote = await freshQuote(bundle, cart, store)
  if (quote.blocker || !quote.method) return redirect(`/cart?m=${m === 'delivery' && !zip ? 'zip' : 'method'}`, opts, cart)
  try {
    const owner = await store.userById(site.orgId)
    if (!owner || !canSell(await loadAccess(store, owner))) throw new Error('The shop’s plan doesn’t include selling online.')
    const origin = opts.preview ? new URL(req.url).origin + (opts.basePath ?? '') : siteOrigin(site)
    const order = draftOrder(site, quote, settings.checkout!.account, cart.method === 'delivery' ? zip : undefined)
    const session = await createCheckout({ site, settings, quote, order, origin })
    await store.saveOrder({ ...order, stripe: { ...order.stripe, session: session.id } })
    await count(store, site.id, CHECKOUT_KEY, opts.preview)
    const headers = new Headers({ location: session.url, ...NO_STORE })
    headers.append('set-cookie', cartCookie(cart))
    return new Response(null, { status: 303, headers })
  } catch (err) {
    // The owner sees why on their Store page; the shopper gets a calm note.
    await store.cacheSet(`shop-error:${site.id}`, { at: new Date().toISOString(), message: err instanceof Error ? err.message.slice(0, 300) : 'Checkout failed' }).catch(() => {})
    return redirect('/cart?m=error', opts, cart)
  }
}

// GET /cart/thanks?o=<token>&s=<session>
export async function serveThanks(bundle: SiteBundle, req: Request, store: Store, opts: ShopServeOptions): Promise<Response> {
  const t = wordsFor(bundle.site.language)
  const url = new URL(req.url)
  let order = await store.orderByToken(url.searchParams.get('o') ?? '')
  if (!order || order.siteId !== bundle.site.id) return redirect('/cart', opts)
  const s = url.searchParams.get('s')
  if (s && s === order.stripe.session) order = await settleOrder(store, bundle.site, order).catch(() => order!)
  const done: Cart | undefined = order.status === 'paid' ? { items: [] } : undefined
  return page(bundle, 'cart/thanks', order.status === 'paid' ? t.shop.thanksTitle : t.shop.orderTitle, renderOrder(order, t, { thanks: true }), opts, done)
}

// GET /order/<token>: the customer's own page for their order.
export async function serveOrderPage(bundle: SiteBundle, token: string, store: Store, opts: ShopServeOptions): Promise<Response | null> {
  const t = wordsFor(bundle.site.language)
  let order = /^[A-Za-z0-9_-]{20,40}$/.test(token) ? await store.orderByToken(token) : null
  if (!order || order.siteId !== bundle.site.id || order.status === 'abandoned') return null
  if (order.status === 'open') order = await settleOrder(store, bundle.site, order).catch(() => order!)
  return page(bundle, 'order', t.shop.orderTitle, renderOrder(order, t, { thanks: false }), opts)
}

// GET /__cn: the header's cart count, as a tiny picture.
export function serveCartCount(bundle: SiteBundle, req: Request): Response {
  const n = cartCount(readCartCookie(req.headers.get('cookie')))
  return new Response(cartBadge(n, bundle.site.globals.colors.primary), { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } })
}

// The shop's addresses on a site, for the site routes: null when the path
// isn't one of them.
export async function shopRoute(bundle: SiteBundle, req: Request, slug: string[], store: Store, opts: ShopServeOptions): Promise<Response | null> {
  if (!bundle.site.store?.products.length) return null
  const path = slug.join('/')
  if (req.method === 'POST') {
    if (path === '__cart') return handleCartPost(bundle, req, store, opts)
    if (path === '__checkout') return handleCheckout(bundle, req, store, opts)
    return null
  }
  if (path === 'cart') return serveCart(bundle, req, store, opts)
  if (path === 'cart/thanks') return serveThanks(bundle, req, store, opts)
  if (path === '__cn') return serveCartCount(bundle, req)
  if (slug[0] === 'order' && slug.length === 2) return serveOrderPage(bundle, slug[1], store, opts)
  return null
}
