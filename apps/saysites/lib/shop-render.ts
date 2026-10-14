// The shop on a customer's website: product cards, a product in full, the
// cart, the thank-you page and the customer's order page. Plain HTML forms
// and CSS only, like the rest of the site: no client JavaScript.

import {
  CART_COOKIE,
  availableQty,
  checkoutOpen,
  compareAtOf,
  formatPrice,
  hasVariants,
  inStock,
  isListed,
  isLive,
  priceRange,
  productPath,
  productSlugs,
  shopList,
  stockKey,
  unitPrice,
  variantLabel,
  type Fulfillment,
  type Order,
  type Quote,
  type Stock,
} from './commerce'
import type { Page, Product, ShopSettings, Site, Widget } from './schema'
import type { SiteWords } from './site-words'
import { esc } from './render'

export interface ShopCtx {
  settings: ShopSettings | undefined
  stock: Stock
  t: SiteWords
}

// The cart, checkout and order addresses on every shop.
export const CART_PATH = '/cart'
export const CART_POST = '__cart'
export const CHECKOUT_POST = '__checkout'
export const THANKS_PATH = '/cart/thanks'
export const ORDER_PATH = '/order'
export const CART_COUNT_PATH = '__cn'
export { CART_COOKIE }

const img = (src: string, alt: string, w: number, sizes: string, eager = false) =>
  `<img src="${esc(sized(src, w))}" alt="${esc(alt)}" width="${w}" height="${w}" sizes="${sizes}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`
const sized = (src: string, w: number) => (/^https:\/\/images\.unsplash\.com\//.test(src) ? src.replace(/([?&])w=\d+/, `$1w=${w}`) + (/[?&]w=/.test(src) ? '' : `${src.includes('?') ? '&' : '?'}w=${w}`) : src)

function priceHtml(p: Product, cur: string, t: SiteWords): string {
  const { min, max } = priceRange(p)
  if (hasVariants(p) && min !== max) return `<span class="pr-now">${esc(t.shop.from)} ${esc(formatPrice(min, cur))}</span>`
  const was = compareAtOf(p, hasVariants(p) ? p.variants![0] : undefined)
  return `<span class="pr-now${was ? ' pr-sale' : ''}">${esc(formatPrice(min, cur))}</span>${was ? ` <s class="pr-was"><span class="vh">${esc(t.shop.was)} </span>${esc(formatPrice(was, cur))}</s>` : ''}`
}

const addForm = (p: Product, label: string, extra = '') =>
  `<form class="pr-add" method="post" action="/${CART_POST}"><input type="hidden" name="a" value="add"><input type="hidden" name="p" value="${esc(p.id)}">${extra}<button class="btn btn-primary" type="submit">${esc(label)}</button></form>`

// The button under a product: add to cart, choose options, the owner's own
// Stripe payment link, or get in touch, depending on how the shop sells.
function cardAction(p: Product, href: string, ctx: ShopCtx): string {
  const t = ctx.t
  if (!inStock(p, ctx.stock)) return `<span class="pr-out">${esc(t.soldOut)}</span>`
  if (checkoutOpen(ctx.settings)) {
    if (hasVariants(p)) return `<a class="btn btn-outline pr-buy" href="${esc(href)}">${esc(t.shop.chooseOptions)}</a>`
    return addForm(p, t.shop.addToCart, '<input type="hidden" name="q" value="1">').replace('class="btn btn-primary"', 'class="btn btn-primary pr-buy"')
  }
  if (p.buyUrl) return `<a class="btn btn-primary pr-buy" href="${esc(p.buyUrl)}" rel="noopener">${esc(t.buyNow)}</a>`
  return `<a class="btn btn-outline pr-buy" href="/contact">${esc(t.askAboutThis)}</a>`
}

export function renderProductsGrid(w: Extract<Widget, { type: 'products' }>, ctx: ShopCtx, cls: string): string {
  const s = ctx.settings
  const list = shopList(s?.products ?? [], w.category).slice(0, w.limit ?? 100)
  if (!list.length) return ''
  const cur = s!.currency
  const slugs = productSlugs(s!.products)
  const cards = list.map((p) => {
    const href = productPath(slugs.get(p.id)!)
    const pic = p.image ? `<a class="pr-pic" href="${esc(href)}" tabindex="-1" aria-hidden="true">${img(p.image.src, '', 800, '(max-width: 640px) 100vw, 33vw')}</a>` : `<a class="pr-pic pr-none" href="${esc(href)}" tabindex="-1" aria-hidden="true">${esc(p.name.charAt(0))}</a>`
    const badge = !inStock(p, ctx.stock) ? `<span class="pr-tag">${esc(ctx.t.soldOut)}</span>` : compareAtOf(p, hasVariants(p) ? p.variants![0] : undefined) ? `<span class="pr-tag pr-tag-sale">Sale</span>` : ''
    return `<article class="pr">${badge}${pic}<div class="pr-body"><h3 class="pr-name"><a href="${esc(href)}">${esc(p.name)}</a></h3>${p.description ? `<p class="pr-desc">${esc(p.description)}</p>` : ''}<div class="pr-foot"><p class="pr-price">${priceHtml(p, cur, ctx.t)}</p>${cardAction(p, href, ctx)}</div></div></article>`
  })
  return `<div class="prs ${cls}">${cards.join('')}</div>`
}

const paras = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`)
    .join('')

// One product in full: photos you can flip through (radio buttons and CSS),
// the price, options, quantity and add to cart, then the description.
export function renderProductBlock(productId: string, ctx: ShopCtx, cls: string, headingLevel: 1 | 2 = 2): string {
  const s = ctx.settings
  const p = s?.products.find((x) => x.id === productId)
  if (!p || !isLive(p)) return ''
  const t = ctx.t
  const cur = s!.currency
  const photos = [...(p.image ? [p.image] : []), ...(p.images ?? [])].slice(0, 9)
  const g = `g-${p.id}`
  const gallery = !photos.length
    ? `<div class="pd-pics"><div class="pd-main"><span class="pr-none pd-none" aria-hidden="true">${esc(p.name.charAt(0))}</span></div></div>`
    : photos.length === 1
      ? `<div class="pd-pics"><div class="pd-main">${img(photos[0].src, photos[0].alt, 1200, '(max-width: 760px) 100vw, 50vw', headingLevel === 1)}</div></div>`
      : `<div class="pd-pics">${photos.map((_, i) => `<input class="vh" type="radio" name="${g}" id="${g}-${i}"${i === 0 ? ' checked' : ''}>`).join('')}<div class="pd-main">${photos.map((ph, i) => img(ph.src, ph.alt, 1200, '(max-width: 760px) 100vw, 50vw', headingLevel === 1 && i === 0)).join('')}</div><div class="pd-thumbs">${photos.map((ph, i) => `<label for="${g}-${i}">${img(ph.src, '', 160, '80px')}<span class="vh">${i + 1}</span></label>`).join('')}</div></div>`

  const open = checkoutOpen(s)
  const variants = hasVariants(p) ? p.variants! : []
  let buy: string
  if (!inStock(p, ctx.stock)) buy = `<p class="pr-out pd-out">${esc(t.soldOut)}</p>`
  else if (open) {
    const max = variants.length ? 99 : Math.min(99, availableQty(p, undefined, ctx.stock))
    const optionLabel = p.options!.length === 1 ? p.options![0].name : p.options!.map((o) => o.name).join(' / ')
    const select = variants.length
      ? `<label class="pd-field"><span>${esc(optionLabel)}</span><select name="v" required>${variants
          .map((v) => {
            const left = availableQty(p, v, ctx.stock)
            const price = unitPrice(p, v)
            return `<option value="${esc(v.id)}"${left <= 0 ? ' disabled' : ''}>${esc(variantLabel(v))} · ${esc(formatPrice(price, cur))}${left <= 0 ? ` (${esc(t.soldOut)})` : ''}</option>`
          })
          .join('')}</select></label>`
      : ''
    const qty = `<label class="pd-field pd-qty"><span>${esc(t.shop.quantity)}</span><input type="number" name="q" value="1" min="1" max="${max === Infinity ? 99 : max}" inputmode="numeric"></label>`
    buy = addForm(p, t.shop.addToCart, `<div class="pd-fields">${select}${qty}</div>`).replace('class="pr-add"', 'class="pd-add"')
  } else if (p.buyUrl) buy = `<a class="btn btn-primary pd-buy" href="${esc(p.buyUrl)}" rel="noopener">${esc(t.buyNow)}</a>`
  else buy = `<a class="btn btn-outline pd-buy" href="/contact">${esc(t.askAboutThis)}</a>`

  const left = !variants.length && p.track && !p.oversell ? (ctx.stock[stockKey(p.id)] ?? 0) : null
  const few = left !== null && left > 0 && left <= Math.max(3, s!.lowStock ?? 3) ? `<p class="pd-left">${esc(t.shop.onlyLeft(left))}</p>` : ''
  const info = [
    ...(p.noShipping ? [] : deliveryLines(s!, t)),
    s!.returns ? `<a href="/returns">${esc(s!.returns.days ? t.shop.returnsDays(s!.returns.days, !!s!.returns.free) : t.shop.returnsNone)}</a>` : '',
  ].filter(Boolean)
  const h = `h${headingLevel}`
  return (
    `<div class="pd ${cls}">${gallery}<div class="pd-info">` +
    `<${h} class="pd-name">${esc(p.name)}</${h}>` +
    `<p class="pd-price">${priceHtml(p, cur, t)}</p>` +
    (p.description ? `<p class="pd-lede">${esc(p.description)}</p>` : '') +
    few +
    buy +
    (info.length ? `<ul class="pd-notes">${info.map((x) => `<li>${x}</li>`).join('')}</ul>` : '') +
    (p.details ? `<div class="pd-details">${paras(p.details)}</div>` : '') +
    `</div></div>`
  )
}

function deliveryLines(s: ShopSettings, t: SiteWords): string[] {
  const d = s.shipping ?? {}
  const out: string[] = []
  if (d.ship) out.push(esc([t.shop.methods.ship, d.ship.days, d.ship.freeOver !== undefined ? `${t.shop.free} ${formatPrice(d.ship.freeOver, s.currency)}+` : ''].filter(Boolean).join(' · ')))
  if (d.pickup) out.push(esc(`${t.shop.methods.pickup}: ${d.pickup.note}`))
  if (d.delivery) out.push(esc(t.shop.methods.delivery + (d.delivery.note ? `: ${d.delivery.note}` : '')))
  return out
}

// The synthetic page for /shop/<slug>: one product widget, so it gets the
// site's header, footer, breadcrumbs and structured data like any page.
export function productPage(site: Site, p: Product, slug: string, pages: readonly Page[]): Page {
  const shop = pages.find((x) => x.slug === 'shop' && x.status === 'published')
  const words = p.description ?? p.details?.slice(0, 160) ?? `${p.name} from ${site.business.name}.`
  return {
    id: `prod-${p.id}`.slice(0, 64),
    siteId: site.id,
    slug: `shop/${slug}`,
    name: p.name,
    status: 'published',
    seo: {
      title: `${p.name} | ${site.business.name}`.slice(0, 70),
      description: words.slice(0, 170),
      ...(p.image ? { ogImage: p.image.src } : {}),
      ...(isListed(p) ? {} : { noindex: true }),
    },
    body: [
      {
        id: 'pd-sec',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: { desktop: { top: shop ? 24 : 48, right: 24, bottom: 88, left: 24 }, mobile: { top: 16, right: 18, bottom: 56, left: 18 } } },
        children: [{ id: 'pd', type: 'product', productId: p.id }],
      },
    ],
    updatedAt: site.updatedAt,
  }
}

// /returns, made from the owner's return policy.
export function returnsPage(site: Site, t: SiteWords): Page | undefined {
  const r = site.store?.returns
  if (!r) return undefined
  const text = [r.days ? t.shop.returnsDays(r.days, !!r.free) : t.shop.returnsNone, r.note ?? ''].filter(Boolean).join('\n\n')
  return {
    id: 'returns',
    siteId: site.id,
    slug: 'returns',
    name: t.shop.returnsTitle,
    status: 'published',
    seo: { title: `${t.shop.returnsTitle} | ${site.business.name}`.slice(0, 70), description: `${site.business.name}: ${text}`.replace(/\s+/g, ' ').slice(0, 170) },
    body: [
      {
        id: 'rt',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: { desktop: { top: 72, right: 24, bottom: 96, left: 24 }, mobile: { top: 40, right: 20, bottom: 56, left: 20 } }, gap: { desktop: 16 }, maxWidth: 760 },
        children: [
          { id: 'rt-h', type: 'heading', level: 1, text: t.shop.returnsTitle },
          { id: 'rt-t', type: 'text', text },
        ],
      },
    ],
    updatedAt: site.updatedAt,
  }
}

// A page with only a heading; the cart and order pages put their own HTML
// under it (renderPage's `inject`).
export function shellPage(site: Site, slug: string, title: string): Page {
  return {
    id: `shell-${slug.replace(/[^a-z0-9]+/g, '-')}`.slice(0, 64),
    siteId: site.id,
    slug,
    name: title,
    status: 'published',
    seo: { title: `${title} | ${site.business.name}`.slice(0, 70), description: `${title} at ${site.business.name}.`.slice(0, 170), noindex: true },
    body: [],
    updatedAt: site.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// The cart
// ---------------------------------------------------------------------------

export const CART_MESSAGES: Record<string, string> = {
  added: 'Added to your cart.',
  code: 'Discount applied.',
  nocode: '',
  error: 'Checkout isn’t available right now. Please try again in a moment, or get in touch to order.',
  method: 'Choose how you’d like to get your order.',
  zip: 'Enter your ZIP or postal code for local delivery.',
}

export function renderCart(q: Quote, ctx: ShopCtx, message?: string, zip = ''): string {
  const t = ctx.t
  const cur = q.currency
  const notes = [...(message ? [message] : []), ...q.notices].map((n) => `<p class="ct-note" role="status">${esc(n)}</p>`).join('')
  if (!q.lines.length) return `<div class="ct">${notes}<p class="ct-empty">${esc(t.shop.emptyCart)}</p><a class="btn btn-primary" href="/shop">${esc(t.shop.keepShopping)}</a></div>`
  const lines = q.lines
    .map((l) => {
      const href = productPath(l.slug)
      const hidden = `<input type="hidden" name="p" value="${esc(l.productId)}">${l.variantId ? `<input type="hidden" name="v" value="${esc(l.variantId)}">` : ''}`
      return (
        `<li class="ct-line">` +
        (l.image ? `<a class="ct-pic" href="${esc(href)}" tabindex="-1" aria-hidden="true">${img(l.image.src, '', 160, '80px')}</a>` : `<span class="ct-pic pr-none" aria-hidden="true">${esc(l.name.charAt(0))}</span>`) +
        `<div class="ct-what"><a href="${esc(href)}">${esc(l.name)}</a>${l.variant ? `<span>${esc(l.variant)}</span>` : ''}<span>${esc(formatPrice(l.unit, cur))}</span></div>` +
        `<form class="ct-qty" method="post" action="/${CART_POST}"><input type="hidden" name="a" value="set">${hidden}<label><span class="vh">${esc(t.shop.quantity)}</span><input type="number" name="q" value="${l.qty}" min="0" max="${l.max === Infinity ? 99 : Math.min(99, l.max)}" inputmode="numeric"></label><button class="ct-link" type="submit">${esc(t.shop.update)}</button></form>` +
        `<form method="post" action="/${CART_POST}"><input type="hidden" name="a" value="set">${hidden}<input type="hidden" name="q" value="0"><button class="ct-link" type="submit">${esc(t.shop.remove)}</button></form>` +
        `<strong class="ct-sum">${esc(formatPrice(l.total, cur))}</strong>` +
        `</li>`
      )
    })
    .join('')
  const codeForm =
    `<form class="ct-code" method="post" action="/${CART_POST}"><input type="hidden" name="a" value="code"><label><span>${esc(t.shop.code)}</span><input name="code" maxlength="30" autocapitalize="characters" autocomplete="off" value="${esc(q.discount && !q.discount.auto ? q.discount.code : '')}"></label><button class="btn btn-outline" type="submit">${esc(t.shop.apply)}</button></form>` +
    (q.codeProblem ? `<p class="ct-note ct-bad" role="alert">${esc(q.codeProblem)}</p>` : '')
  const needsChoice = q.methods.length > 1 || q.methods.some((m) => m.method === 'delivery')
  const methods = needsChoice
    ? `<fieldset class="ct-ways"><legend>${esc(t.shop.howToGet)}</legend>${q.methods
        .map(
          (m) =>
            `<label class="ct-way"><input type="radio" name="m" value="${m.method}"${q.method === m.method ? ' checked' : ''}${m.method !== 'delivery' && !m.ok ? ' disabled' : ''}><span><strong>${esc(t.shop.methods[m.method])}</strong>${m.note ? `<small>${esc(m.note)}</small>` : ''}${m.method === 'delivery' && m.reason ? `<small class="ct-bad">${esc(m.reason)}</small>` : ''}</span><b>${m.fee ? esc(formatPrice(m.fee, cur)) : esc(t.shop.free)}</b></label>`,
        )
        .join('')}${q.methods.some((m) => m.method === 'delivery') ? `<label class="ct-zip"><span>${esc(t.shop.zip)}</span><input name="zip" maxlength="10" autocomplete="postal-code" value="${esc(zip)}"></label>` : ''}</fieldset>`
    : q.methods[0]
      ? `<input type="hidden" name="m" value="${q.methods[0].method}">`
      : ''
  const row = (label: string, value: string, cls = '') => `<div class="ct-row${cls}"><span>${esc(label)}</span><span>${value}</span></div>`
  const totals =
    row(t.shop.subtotal, esc(formatPrice(q.subtotal, cur))) +
    (q.discount ? row(`${t.shop.discount} (${q.discount.code})`, `-${esc(formatPrice(q.discount.amount, cur))}`) : '') +
    (q.method && q.method !== 'none' ? row(t.shop.methods[q.method], q.shipping ? esc(formatPrice(q.shipping, cur)) : esc(t.shop.free)) : '') +
    row(t.shop.total, esc(formatPrice(q.total, cur)), ' ct-total') +
    (ctx.settings?.tax?.auto ? `<p class="ct-small">${esc(t.shop.taxAtCheckout)}</p>` : '')
  const open = checkoutOpen(ctx.settings)
  const checkout = open
    ? `<form class="ct-go" method="post" action="/${CHECKOUT_POST}">${methods}<div class="ct-totals">${totals}</div><button class="btn btn-primary ct-pay" type="submit">${esc(t.shop.checkout)}</button><p class="ct-small">${esc(t.shop.checkoutNote)}</p></form>`
    : `<div class="ct-go"><div class="ct-totals">${totals}</div><p class="ct-note">${esc(t.shop.paused)}</p></div>`
  return `<div class="ct">${notes}<ul class="ct-lines">${lines}</ul><div class="ct-side">${codeForm}${checkout}</div></div>`
}

// ---------------------------------------------------------------------------
// After checkout
// ---------------------------------------------------------------------------

const STEP_ORDER: Fulfillment[] = ['unfulfilled', 'shipped', 'out', 'ready', 'done']

export function renderOrder(o: Order, t: SiteWords, opts: { thanks: boolean }): string {
  const cur = o.currency
  const head = opts.thanks
    ? `<p class="od-kicker">${esc(t.shop.orderNumber(o.number ? `#${o.number}` : ''))}</p><p class="od-lede">${esc(t.shop.thanksText(o.customer?.email ?? ''))}</p>`
    : `<p class="od-kicker">${esc(t.shop.orderNumber(o.number ? `#${o.number}` : ''))}</p>`
  if (o.status !== 'paid') return `<div class="od">${head}<p class="ct-note">${esc(t.shop.processing)}</p></div>`
  const steps: { key: keyof SiteWords['shop']['steps']; done: boolean }[] =
    o.payment === 'refunded'
      ? [{ key: 'placed', done: true }, { key: 'refunded', done: true }]
      : [
          { key: 'placed', done: true },
          ...(o.method === 'pickup'
            ? [{ key: 'ready' as const, done: ['ready', 'done'].includes(o.fulfillment) }]
            : o.method === 'delivery'
              ? [{ key: 'out' as const, done: ['out', 'done'].includes(o.fulfillment) }]
              : o.method === 'none'
                ? []
                : [{ key: 'shipped' as const, done: ['shipped', 'done'].includes(o.fulfillment) }]),
          { key: 'done', done: o.fulfillment === 'done' },
        ]
  void STEP_ORDER
  const track = o.tracking?.url ? `<p><a class="btn btn-outline" href="${esc(o.tracking.url)}" rel="noopener">${esc(t.shop.tracking)}</a>${o.tracking.number ? ` <span class="ct-small">${esc([o.tracking.carrier, o.tracking.number].filter(Boolean).join(' '))}</span>` : ''}</p>` : o.tracking?.number ? `<p class="ct-small">${esc(t.shop.tracking)}: ${esc([o.tracking.carrier, o.tracking.number].filter(Boolean).join(' '))}</p>` : ''
  const a = o.customer?.address
  const where = a && (o.method === 'ship' || o.method === 'express' || o.method === 'delivery') ? `<p class="ct-small">${esc([o.customer?.name, a.line1, a.line2, [a.city, a.state, a.postal].filter(Boolean).join(' '), a.country].filter(Boolean).join(', '))}</p>` : ''
  const row = (label: string, value: string, cls = '') => `<div class="ct-row${cls}"><span>${esc(label)}</span><span>${esc(value)}</span></div>`
  return (
    `<div class="od">${head}` +
    `<ol class="od-steps">${steps.map((s) => `<li${s.done ? ' class="on"' : ''}>${esc(t.shop.steps[s.key])}</li>`).join('')}</ol>` +
    track +
    `<ul class="ct-lines od-lines">${o.lines.map((l) => `<li class="ct-line">${l.image ? `<span class="ct-pic">${img(l.image, '', 160, '80px')}</span>` : `<span class="ct-pic pr-none" aria-hidden="true">${esc(l.name.charAt(0))}</span>`}<div class="ct-what"><strong>${esc(l.name)}</strong>${l.variant ? `<span>${esc(l.variant)}</span>` : ''}<span>${l.qty} × ${esc(formatPrice(l.unit, cur))}</span></div><strong class="ct-sum">${esc(formatPrice(l.total, cur))}</strong></li>`).join('')}</ul>` +
    `<div class="ct-totals">${row(t.shop.subtotal, formatPrice(o.subtotal, cur))}${o.discount ? row(`${t.shop.discount}${o.discountCode ? ` (${o.discountCode})` : ''}`, `-${formatPrice(o.discount, cur)}`) : ''}${o.method !== 'none' ? row(t.shop.methods[o.method], o.shipping ? formatPrice(o.shipping, cur) : t.shop.free) : ''}${o.tax ? row(t.shop.tax, formatPrice(o.tax, cur)) : ''}${row(t.shop.total, formatPrice(o.total, cur), ' ct-total')}</div>` +
    where +
    `<p><a class="btn btn-outline" href="/shop">${esc(t.shop.keepShopping)}</a></p>` +
    `</div>`
  )
}

// A small badge for the header's cart link, drawn as an image so cached
// pages need no script to show the count.
export function cartBadge(count: number, color: string): string {
  if (!count) return `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`
  const n = count > 99 ? '99+' : String(count)
  const w = n.length > 2 ? 30 : 22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="22" viewBox="0 0 ${w} 22"><rect width="${w}" height="22" rx="11" fill="${/^#[0-9a-f]{3,8}$/i.test(color) ? color : '#111'}"/><text x="${w / 2}" y="15.5" font-family="system-ui,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">${n}</text></svg>`
}

export const SHOP_CSS =
  `.shop-x{padding:clamp(28px,5vw,56px) 24px 0}.shop-x>.bi{max-width:var(--w);margin:0 auto}.shop-h{margin:0 0 24px;font-size:clamp(2em,4vw,2.8em);line-height:1.1}` +
  `.prs button.btn,.pd button.btn,.ct button.btn{font:inherit;font-weight:600;cursor:pointer}` +
  `.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}` +
  `.prs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:24px}.pr{position:relative;display:flex;flex-direction:column;gap:14px}` +
  `.pr-pic{display:block;overflow:hidden;text-decoration:none;border-radius:var(--r);background:var(--c-surface);aspect-ratio:1}.pr-pic img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}.pr:hover .pr-pic img{transform:scale(1.04)}` +
  `.pr-none{display:grid;place-items:center;font:600 3em var(--f-h);color:var(--c-muted);background:var(--c-surface)}` +
  `.pr-tag{position:absolute;top:10px;left:10px;z-index:1;padding:.3em .7em;font-size:.75em;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:99px;background:var(--c-background);color:var(--c-text)}.pr-tag-sale{background:var(--c-primary);color:var(--c-background)}` +
  `.pr-body{display:flex;flex-direction:column;gap:4px;flex:1}.pr-name{font-size:1.08em;margin:0}.pr-name a{color:inherit;text-decoration:none}.pr-desc{margin:0;color:var(--c-muted);font-size:.92em}` +
  `.pr-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:auto;padding-top:10px}.pr-price{margin:0;font-weight:700;color:var(--c-text)}.pr-sale{color:var(--c-primary)}.pr-was{color:var(--c-muted);font-weight:400;font-size:.9em}` +
  `.pr-add{margin:0}.pr-buy{padding:.55em 1.1em;font-size:.9em;white-space:nowrap}.pr-out{padding:.5em 1em;font-size:.88em;font-weight:600;color:var(--c-muted);border:1.5px solid color-mix(in srgb,var(--c-muted) 45%,transparent);border-radius:var(--rb)}` +
  `.pd{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:start}` +
  `.pd-pics{display:flex;flex-direction:column;gap:12px}.pd-main{border-radius:var(--r);overflow:hidden;background:var(--c-surface);aspect-ratio:1}.pd-main img{width:100%;height:100%;object-fit:cover}.pd-none{width:100%;height:100%;font-size:6em}` +
  `.pd-pics input~.pd-main img{display:none}` +
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `.pd-pics input:nth-of-type(${n}):checked~.pd-main img:nth-child(${n})`).join(',') +
  `{display:block}` +
  `.pd-thumbs{display:flex;gap:10px;flex-wrap:wrap}.pd-thumbs label{width:72px;height:72px;border-radius:calc(var(--r) * .6);overflow:hidden;cursor:pointer;border:2px solid transparent;opacity:.75}.pd-thumbs img{width:100%;height:100%;object-fit:cover}` +
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `.pd-pics input:nth-of-type(${n}):checked~.pd-thumbs label:nth-child(${n})`).join(',') +
  `{border-color:var(--c-primary);opacity:1}` +
  `.pd-pics input:focus-visible~.pd-thumbs{outline:2px solid var(--c-primary);outline-offset:4px}` +
  `.pd-info{display:flex;flex-direction:column;gap:16px;position:sticky;top:24px}.pd-name{margin:0;font-size:clamp(1.9em,4vw,2.8em);line-height:1.08}.pd-price{margin:0;font-size:1.35em;font-weight:700}.pd-lede{margin:0;font-size:1.08em;color:var(--c-muted)}.pd-left{margin:0;font-weight:600;color:var(--c-primary)}` +
  `.pd-add{display:flex;flex-direction:column;gap:14px;margin:4px 0 0}.pd-fields{display:flex;gap:12px;flex-wrap:wrap}.pd-field{display:flex;flex-direction:column;gap:6px;font-size:.9em;font-weight:600;flex:1 1 200px}.pd-qty{flex:0 0 96px}` +
  `.pd-field select,.pd-field input,.ct input:not([type=radio]){font:inherit;font-weight:400;padding:.7em .8em;border:1.5px solid color-mix(in srgb,var(--c-text) 18%,transparent);border-radius:calc(var(--rb) * .5 + 4px);background:var(--c-background);color:var(--c-text);width:100%}` +
  `.pd-add .btn,.pd-buy{width:100%;justify-content:center;padding:1em 1.4em;font-size:1.02em}.pd-out{text-align:center}` +
  `.pd-notes{list-style:none;margin:0;padding:14px 0 0;border-top:1px solid color-mix(in srgb,var(--c-text) 12%,transparent);display:flex;flex-direction:column;gap:6px;font-size:.92em;color:var(--c-muted)}.pd-notes a{color:inherit}` +
  `.pd-details{border-top:1px solid color-mix(in srgb,var(--c-text) 12%,transparent);padding-top:16px}.pd-details p{margin:0 0 1em}` +
  `@media(max-width:760px){.pd{grid-template-columns:1fr}.pd-info{position:static}}` +
  `.ct{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:start;padding:8px 0 80px}.ct>.ct-note,.ct-empty{grid-column:1/-1}` +
  `.ct-lines{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}.ct-line{display:grid;grid-template-columns:72px 1fr auto auto auto;gap:12px 16px;align-items:center;padding:16px 0;border-bottom:1px solid color-mix(in srgb,var(--c-text) 10%,transparent)}` +
  `.ct-pic{width:72px;height:72px;border-radius:calc(var(--r) * .6);overflow:hidden;display:grid;place-items:center}.ct-pic img{width:100%;height:100%;object-fit:cover}` +
  `.ct-what{display:flex;flex-direction:column;gap:2px;min-width:0}.ct-what a,.ct-what strong{font-weight:600;color:var(--c-text);text-decoration:none}.ct-what span{font-size:.9em;color:var(--c-muted)}` +
  `.ct-qty{display:flex;align-items:center;gap:6px}.ct-qty input{width:64px!important;padding:.45em .5em!important}.ct-line form{margin:0}.ct-link{background:none;border:0;padding:0;font:inherit;font-size:.88em;color:var(--c-muted);text-decoration:underline;cursor:pointer}.ct-sum{min-width:70px;text-align:right}` +
  `.ct-side{display:flex;flex-direction:column;gap:18px;background:var(--c-surface);border-radius:var(--r);padding:clamp(18px,3vw,28px);position:sticky;top:24px}` +
  `.ct-code{display:flex;gap:8px;align-items:flex-end}.ct-code label{flex:1;display:flex;flex-direction:column;gap:6px;font-size:.9em;font-weight:600}` +
  `.ct-ways{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}.ct-ways legend{font-weight:700;margin-bottom:8px}.ct-way{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:12px;border-radius:calc(var(--r) * .6);background:var(--c-background);cursor:pointer}.ct-way small{display:block;color:var(--c-muted)}.ct-zip{display:flex;flex-direction:column;gap:6px;font-size:.9em;font-weight:600}` +
  `.ct-go{display:flex;flex-direction:column;gap:14px;margin:0}.ct-totals{display:flex;flex-direction:column;gap:8px}.ct-row{display:flex;justify-content:space-between;gap:12px}.ct-total{font-weight:700;font-size:1.15em;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--c-text) 14%,transparent)}` +
  `.ct-pay{width:100%;justify-content:center;padding:1em}.ct-small{margin:0;font-size:.85em;color:var(--c-muted)}.ct-note{margin:0;padding:12px 14px;border-radius:calc(var(--r) * .6);background:color-mix(in srgb,var(--c-primary) 10%,var(--c-background))}.ct-bad{color:#b42318}` +
  `@media(max-width:820px){.ct{grid-template-columns:1fr}.ct-side{position:static}.ct-line{grid-template-columns:64px 1fr auto;grid-template-areas:"p w s" "p q r"}.ct-pic{grid-area:p}.ct-what{grid-area:w}.ct-sum{grid-area:s}.ct-qty{grid-area:q}.ct-line>form:not(.ct-qty){grid-area:r;justify-self:end}}` +
  `.od{display:flex;flex-direction:column;gap:20px;max-width:720px;padding:8px 0 80px}.od-kicker{margin:0;font-weight:700;color:var(--c-primary);letter-spacing:.04em}.od-lede{margin:0;font-size:1.1em}` +
  `.od-steps{list-style:none;margin:0;padding:0;display:flex;gap:6px;counter-reset:s}.od-steps li{flex:1;padding:10px 12px;border-radius:calc(var(--r) * .5);background:var(--c-surface);color:var(--c-muted);font-size:.9em;font-weight:600}.od-steps li.on{background:var(--c-primary);color:var(--c-background)}` +
  `.sh-cart{display:inline-flex;align-items:center;gap:6px;font-weight:600;text-decoration:none;color:inherit}.sh-cart img{height:22px;width:auto}`
