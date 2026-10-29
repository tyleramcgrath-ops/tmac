'use server'

// Everything the owner does in the Store tab. Each action checks the site is
// theirs, saves, and comes back to the page with a short note (?m= or ?e=).

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { canSell, loadAccess } from '@/lib/billing'
import { CARRIERS, parsePrice, productSlugs, stockKey, trackingUrl, type Fulfillment } from '@/lib/commerce'
import { addNote, refundOrder, setFulfillment } from '@/lib/orders'
import { AmazonError, TAG, checkKeys } from '@/lib/amazon'
import { importAmazon } from '@/lib/amazon-sync'
import { AMAZON_MARKETS, DiscountSchema, type Discount } from '@/lib/schema'
import { ownShop, productPhotos, readProductForm, saveShop } from '@/lib/shop-admin'

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max)
const back = (url: string, note: { m?: string; e?: string }) => {
  const q = new URLSearchParams(note.e ? { e: note.e } : { m: note.m ?? 'saved' })
  redirect(`${url}${url.includes('?') ? '&' : '?'}${q}`)
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function saveProduct(siteId: string, productId: string, form: FormData) {
  const { user, store, site } = await ownShop(siteId)
  const base = `/dashboard/sites/${siteId}/store/products`
  if (!canSell(await loadAccess(store, user))) back(`${base}/${productId}`, { e: 'Selling online is on the Store plan. Switch plans on your Account page to add products.' })
  const products = site.store?.products ?? []
  const existing = products.find((p) => p.id === productId)
  const id = existing?.id ?? `p-${randomUUID().slice(0, 8)}`
  const slugs = productSlugs(products)
  const taken = new Set(products.filter((p) => p.id !== id).map((p) => slugs.get(p.id)!))
  const r = readProductForm(form, existing, id, await productPhotos(store, site.id), taken)
  if ('error' in r) return back(`${base}/${productId}`, { e: r.error })
  if (!existing && products.length >= 300) return back(base, { e: 'A shop can have up to 300 products.' })
  await saveShop(store, site, (s) => ({ ...s, products: existing ? s.products.map((p) => (p.id === id ? r.product : p)) : [...s.products, r.product] }))
  for (const [k, qty] of Object.entries(r.stock)) await store.setStock(site.id, k, qty)
  back(`${base}/${id}`, { m: existing ? 'saved' : 'added' })
}

export async function deleteProduct(siteId: string, productId: string) {
  const { store, site } = await ownShop(siteId)
  await saveShop(store, site, (s) => ({ ...s, products: s.products.filter((p) => p.id !== productId) }))
  back(`/dashboard/sites/${siteId}/store/products`, { m: 'deleted' })
}

export async function duplicateProduct(siteId: string, productId: string) {
  const { store, site } = await ownShop(siteId)
  const p = site.store?.products.find((x) => x.id === productId)
  if (!p) return back(`/dashboard/sites/${siteId}/store/products`, { e: 'That product isn’t there any more.' })
  const id = `p-${randomUUID().slice(0, 8)}`
  // A copy starts as a draft, with its own address.
  const copy = { ...p, id, name: `${p.name} (copy)`.slice(0, 120), slug: undefined, status: 'draft' as const }
  delete copy.slug
  await saveShop(store, site, (s) => ({ ...s, products: [...s.products, copy] }))
  back(`/dashboard/sites/${siteId}/store/products/${id}`, { m: 'copied' })
}

// The stock box on the product list.
export async function setStockCount(siteId: string, key: string, form: FormData) {
  const { store, site } = await ownShop(siteId)
  const [pid, vid] = key.split('/')
  const p = site.store?.products.find((x) => x.id === pid)
  const qty = Number(str(form, 'qty', 7))
  if (!p || !Number.isInteger(qty) || qty < 0) return back(`/dashboard/sites/${siteId}/store/products`, { e: 'Enter a whole number for stock.' })
  if (!p.track) await saveShop(store, site, (s) => ({ ...s, products: s.products.map((x) => (x.id === pid ? { ...x, track: true } : x)) }))
  await store.setStock(site.id, stockKey(pid, vid), Math.min(qty, 1_000_000))
  back(`/dashboard/sites/${siteId}/store/products`, { m: 'stock' })
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const settingsUrl = (siteId: string, anchor = '') => `/dashboard/sites/${siteId}/store/settings${anchor}`

export async function setShopOpen(siteId: string, open: boolean) {
  const { store, site } = await ownShop(siteId)
  await saveShop(store, site, (s) => ({ ...s, open }))
  back(settingsUrl(siteId), { m: open ? 'open' : 'paused' })
}

export async function saveCurrency(siteId: string, form: FormData) {
  const { store, site } = await ownShop(siteId)
  const c = (['USD', 'CAD', 'GBP', 'EUR', 'AUD'] as const).find((x) => x === str(form, 'currency', 3))
  if (!c) return back(settingsUrl(siteId), { e: 'Pick a currency from the list.' })
  await saveShop(store, site, (s) => ({ ...s, currency: c }))
  back(settingsUrl(siteId), { m: 'saved' })
}

export async function saveDelivery(siteId: string, form: FormData) {
  const { store, site } = await ownShop(siteId)
  const url = settingsUrl(siteId)
  const shipping: NonNullable<NonNullable<typeof site.store>['shipping']> = {}
  if (form.get('ship_on')) {
    const rate = parsePrice(str(form, 'ship_rate', 20) || '0')
    const freeOver = str(form, 'ship_free', 20) ? parsePrice(str(form, 'ship_free', 20)) : undefined
    const countries = [...new Set(str(form, 'ship_countries', 200).toUpperCase().split(/[\s,]+/).filter((c) => /^[A-Z]{2}$/.test(c)))].slice(0, 30)
    if (rate === null || freeOver === null) return back(url, { e: 'Enter shipping prices like 6 or 5.99.' })
    if (!countries.length) return back(url, { e: 'List the countries you ship to as two-letter codes, like US, CA.' })
    const exRate = str(form, 'express_rate', 20) ? parsePrice(str(form, 'express_rate', 20)) : undefined
    if (exRate === null) return back(url, { e: 'Enter the express price like 15 or 14.99.' })
    shipping.ship = {
      rate,
      ...(freeOver !== undefined ? { freeOver } : {}),
      countries,
      ...(str(form, 'ship_days', 60) ? { days: str(form, 'ship_days', 60) } : {}),
      ...(exRate !== undefined ? { express: { rate: exRate, ...(str(form, 'express_days', 60) ? { days: str(form, 'express_days', 60) } : {}) } } : {}),
    }
  }
  if (form.get('pickup_on')) {
    const note = str(form, 'pickup_note', 300)
    if (!note) return back(url, { e: 'Say where and when people can pick up, like “123 Main St, Mon to Sat 10am to 6pm”.' })
    shipping.pickup = { note }
  }
  if (form.get('delivery_on')) {
    const fee = parsePrice(str(form, 'delivery_fee', 20) || '0')
    const min = str(form, 'delivery_min', 20) ? parsePrice(str(form, 'delivery_min', 20)) : undefined
    const zips = [...new Set(str(form, 'delivery_zips', 3000).split(/[\s,;]+/).map((z) => z.trim()).filter((z) => /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}\*?$/.test(z)))].slice(0, 300)
    if (fee === null || min === null) return back(url, { e: 'Enter delivery prices like 5 or 4.99.' })
    if (!zips.length) return back(url, { e: 'List the ZIP or postal codes you deliver to. A code ending in * covers every code that starts with it.' })
    shipping.delivery = { fee, zips, ...(min !== undefined ? { minOrder: min } : {}), ...(str(form, 'delivery_note', 300) ? { note: str(form, 'delivery_note', 300) } : {}) }
  }
  try {
    await saveShop(store, site, (s) => ({ ...s, shipping }))
  } catch {
    return back(url, { e: 'Those delivery settings don’t fit. Check the codes and prices.' })
  }
  back(`${url}#delivery`, { m: 'saved' })
}

// ---------------------------------------------------------------------------
// Amazon picks (lib/amazon)
// ---------------------------------------------------------------------------

export async function saveAmazon(siteId: string, form: FormData) {
  const { user, store, site } = await ownShop(siteId)
  const url = `/dashboard/sites/${siteId}/store/settings#amazon`
  if (!canSell(await loadAccess(store, user))) return back(url, { e: 'Amazon picks are on the Store plan. Switch plans on your Account page.' })
  const tag = str(form, 'tag', 40)
  const market = AMAZON_MARKETS.find((m) => m === str(form, 'market', 30))
  if (!TAG.test(tag)) return back(url, { e: 'Your Associates tag looks like mystore-20. Find it at the top of Associates Central.' })
  if (!market) return back(url, { e: 'Choose the Amazon store your Associates account is for.' })
  const old = await store.amazonKeys(site.id)
  const credentialId = str(form, 'credentialId', 200) || old?.credentialId || ''
  const credentialSecret = str(form, 'credentialSecret', 400) || old?.credentialSecret || ''
  if (!credentialId || !credentialSecret) return back(url, { e: 'Paste your Creators API Credential ID and Secret (Associates Central, Tools, then Creators API).' })
  const keys = { credentialId, credentialSecret }
  try {
    await checkKeys(keys, market)
  } catch (e) {
    return back(url, { e: e instanceof AmazonError ? e.message : 'Couldn’t reach Amazon. Try again in a minute.' })
  }
  await store.saveAmazonKeys(site.id, keys)
  await saveShop(store, site, (s) => ({ ...s, amazon: { tag, market } }))
  back(url, { m: 'amazon' })
}

export async function disconnectAmazon(siteId: string) {
  const { store, site } = await ownShop(siteId)
  await store.saveAmazonKeys(site.id, null)
  // Amazon picks stay on the site, linking with the tag, until removed.
  back(`/dashboard/sites/${siteId}/store/settings#amazon`, { m: 'amazon-off' })
}

export async function addFromAmazon(siteId: string, form: FormData) {
  const { user, store, site } = await ownShop(siteId)
  const base = `/dashboard/sites/${siteId}/store/products`
  if (!canSell(await loadAccess(store, user))) return back(base, { e: 'Amazon picks are on the Store plan. Switch plans on your Account page.' })
  let r
  try {
    r = await importAmazon(store, site, String(form.get('links') ?? '').slice(0, 5000))
  } catch (e) {
    return back(base, { e: e instanceof AmazonError ? e.message : 'Couldn’t reach Amazon. Try again in a minute.' })
  }
  const done = r.added.length + r.updated.length
  if (!done) return back(base, { e: r.problems[0] ?? 'Nothing was added.' })
  const words = [r.added.length ? `Added ${r.added.length} from Amazon` : '', r.updated.length ? `refreshed ${r.updated.length}` : ''].filter(Boolean).join(', ')
  back(base, { m: `amazon:${words}.${r.problems.length ? ` ${r.problems[0]}` : ''}`.slice(0, 300) })
}

export async function saveShopRules(siteId: string, form: FormData) {
  const { store, site } = await ownShop(siteId)
  const url = settingsUrl(siteId)
  const days = Number(str(form, 'return_days', 3) || '0')
  if (!Number.isInteger(days) || days < 0 || days > 365) return back(url, { e: 'Return days should be a number from 0 to 365.' })
  const email = str(form, 'notify', 200)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back(url, { e: 'That email address doesn’t look right.' })
  const low = Number(str(form, 'low', 5) || '3')
  await saveShop(store, site, (s) => ({
    ...s,
    ...(form.get('returns_on') ? { returns: { days, ...(form.get('return_free') ? { free: true } : {}), ...(str(form, 'return_note', 1000) ? { note: str(form, 'return_note', 1000) } : {}) } } : { returns: undefined }),
    tax: form.get('tax_auto') ? { auto: true } : undefined,
    notifyEmail: email || undefined,
    lowStock: Number.isInteger(low) && low >= 0 ? Math.min(low, 10_000) : 3,
  }))
  back(url, { m: 'saved' })
}

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export async function saveDiscount(siteId: string, form: FormData) {
  const { store, site } = await ownShop(siteId)
  const url = `/dashboard/sites/${siteId}/store/discounts`
  const kind = (['percent', 'amount', 'shipping'] as const).find((k) => k === str(form, 'kind', 10)) ?? 'percent'
  const auto = str(form, 'how', 10) === 'auto'
  const code = (auto ? str(form, 'name', 30) || `AUTO-${randomUUID().slice(0, 4)}` : str(form, 'code', 30)).toUpperCase().replace(/[^A-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  const value = kind === 'percent' ? Number(str(form, 'percent', 3)) : kind === 'amount' ? parsePrice(str(form, 'amount', 20)) : 0
  if (kind === 'percent' && (!Number.isInteger(value) || value! < 1 || value! > 100)) return back(url, { e: 'A percentage should be a whole number from 1 to 100.' })
  if (kind === 'amount' && !value) return back(url, { e: 'Enter the amount off, like 10 or 5.50.' })
  const min = str(form, 'min', 20) ? parsePrice(str(form, 'min', 20)) : undefined
  if (min === null) return back(url, { e: 'Enter the minimum order like 50.' })
  const limit = str(form, 'limit', 7) ? Number(str(form, 'limit', 7)) : undefined
  const d: Discount = {
    code,
    kind,
    value: value ?? 0,
    ...(min ? { minSubtotal: min } : {}),
    ...(str(form, 'starts', 10) ? { startsOn: str(form, 'starts', 10) } : {}),
    ...(str(form, 'ends', 10) ? { endsOn: str(form, 'ends', 10) } : {}),
    ...(limit && Number.isInteger(limit) && limit > 0 ? { limit } : {}),
    ...(auto ? { auto: true } : {}),
    active: true,
  }
  const ok = DiscountSchema.safeParse(d)
  if (!ok.success) return back(url, { e: 'Codes are 3 to 30 letters or numbers, like SPRING10.' })
  if ((site.store?.discounts ?? []).some((x) => x.code === d.code)) return back(url, { e: `You already have a discount called ${d.code}.` })
  if ((site.store?.discounts ?? []).length >= 50) return back(url, { e: 'A shop can have up to 50 discounts. Delete an old one first.' })
  await saveShop(store, site, (s) => ({ ...s, discounts: [...(s.discounts ?? []), ok.data] }))
  back(url, { m: 'added' })
}

export async function toggleDiscount(siteId: string, code: string) {
  const { store, site } = await ownShop(siteId)
  await saveShop(store, site, (s) => ({ ...s, discounts: (s.discounts ?? []).map((d) => (d.code === code ? { ...d, active: !d.active } : d)) }))
  back(`/dashboard/sites/${siteId}/store/discounts`, { m: 'saved' })
}

export async function deleteDiscount(siteId: string, code: string) {
  const { store, site } = await ownShop(siteId)
  await saveShop(store, site, (s) => ({ ...s, discounts: (s.discounts ?? []).filter((d) => d.code !== code) }))
  back(`/dashboard/sites/${siteId}/store/discounts`, { m: 'deleted' })
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

async function ownOrder(siteId: string, orderId: string) {
  const own = await ownShop(siteId)
  const order = await own.store.order(own.site.id, orderId)
  if (!order) redirect(`/dashboard/sites/${siteId}/store/orders`)
  return { ...own, order, url: `/dashboard/sites/${siteId}/store/orders/${orderId}` }
}

export async function fulfillOrder(siteId: string, orderId: string, to: Fulfillment, form: FormData) {
  const { user, store, site, order, url } = await ownOrder(siteId, orderId)
  if (order.status !== 'paid') return back(url, { e: 'Only paid orders can be sent.' })
  const carrier = (CARRIERS as readonly string[]).includes(str(form, 'carrier', 20)) ? str(form, 'carrier', 20) : undefined
  const number = str(form, 'tracking', 60).replace(/[^\w -]/g, '')
  const tracking = number ? { ...(carrier && carrier !== 'Other' ? { carrier } : {}), number, ...(trackingUrl(carrier, number) ? { url: trackingUrl(carrier, number) } : {}) } : undefined
  await setFulfillment(store, site, order, to, user.name || 'You', tracking)
  back(url, { m: 'updated' })
}

export async function noteOrder(siteId: string, orderId: string, form: FormData) {
  const { user, store, order, url } = await ownOrder(siteId, orderId)
  const text = str(form, 'note', 2000)
  if (text) await addNote(store, order, text, user.name || 'You')
  back(url, { m: 'noted' })
}

export async function refundOrderAction(siteId: string, orderId: string, form: FormData) {
  const { user, store, site, order, url } = await ownOrder(siteId, orderId)
  const amount = parsePrice(str(form, 'amount', 20))
  if (!amount) return back(url, { e: 'Enter the amount to refund, like 24 or 24.50.' })
  try {
    await refundOrder(store, site, order, amount, !!form.get('restock'), user.name || 'You')
  } catch (err) {
    return back(url, { e: err instanceof Error ? err.message.replace(/^Stripe: /, 'Stripe said: ') : 'The refund didn’t go through.' })
  }
  back(url, { m: 'refunded' })
}

