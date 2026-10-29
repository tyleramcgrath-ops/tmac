// Server helpers for the Store dashboard: who owns the shop, saving the
// shop (live site and Sofie's draft together), the photos a product can
// use, and reading the product form.

import { revalidatePath } from 'next/cache'
import { buildVariants, parsePrice, slugify, stockKey } from './commerce'
import { PHOTOS } from './photos'
import { ProductSchema, SiteSchema, type Product, type ShopSettings, type Site, type Variant } from './schema'
import { requireUser } from './session'
import { getStore, type Store } from './store'

export async function ownShop(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) throw new Error('Site not found')
  return { user, store, site }
}

export const emptyShop = (s?: ShopSettings): ShopSettings => s ?? { currency: 'USD', products: [] }

// Applies a change to the shop on the live site and on Sofie's draft (if
// any), so the two never drift apart.
export async function saveShop(store: Store, site: Site, fn: (s: ShopSettings) => ShopSettings): Promise<Site> {
  const next = await applyShop(store, site, fn)
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return next
}

// saveShop without refreshing the dashboard, for background jobs (the
// Amazon price refresh) that run outside a request.
export async function applyShop(store: Store, site: Site, fn: (s: ShopSettings) => ShopSettings): Promise<Site> {
  const next = SiteSchema.parse(JSON.parse(JSON.stringify({ ...site, store: fn(emptyShop(site.store)), updatedAt: new Date().toISOString() })))
  await store.updateSite(next)
  const state = await store.sofieState(site.id)
  if (state.draft) {
    try {
      const d = SiteSchema.parse(JSON.parse(JSON.stringify({ ...state.draft.site, store: fn(emptyShop(state.draft.site.store)) })))
      await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, site: d } })
    } catch {
      // Leave a draft that can't take the change as it is.
    }
  }
  return next
}

export interface PickPhoto {
  src: string
  alt: string
}

// The owner's own photos first, then a few stock photos that suit a shop.
export async function productPhotos(store: Store, siteId: string): Promise<PickPhoto[]> {
  const own = (await store.mediaForSite(siteId)).filter((m) => m.mime !== 'image/svg+xml').map((m) => ({ src: `/u/${m.id}`, alt: m.alt }))
  return [...own, ...PHOTOS.store.cards, ...PHOTOS.bakery.cards, ...PHOTOS.restaurant.cards].map((p) => ({ src: p.src, alt: p.alt }))
}

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max)
const money = (f: FormData, k: string): number | undefined | null => {
  const t = str(f, k, 20)
  if (!t) return undefined
  return parsePrice(t)
}
const count = (f: FormData, k: string): number | undefined => {
  const t = str(f, k, 7)
  if (!t || !/^-?\d+$/.test(t)) return undefined
  return Math.max(0, Math.min(1_000_000, Number(t)))
}

export interface ProductInput {
  product: Product
  // Stock counts to save (ss_stock), by stockKey.
  stock: Record<string, number>
}

// Reads the product form. Returns the product and its stock counts, or a
// sentence explaining what to fix.
export function readProductForm(form: FormData, existing: Product | undefined, id: string, photos: readonly PickPhoto[], taken: ReadonlySet<string>): ProductInput | { error: string } {
  const name = str(form, 'name', 120)
  if (!name) return { error: 'Give the product a name.' }
  // An Amazon pick: the owner's words, section, status and address; the
  // price and photos stay Amazon's (lib/amazon).
  if (existing?.amazon) {
    const wantedSlug = slugify(str(form, 'slug', 80) || name)
    if (taken.has(wantedSlug)) return { error: `Another product already uses the address /shop/${wantedSlug}. Change this one’s address.` }
    const desc = str(form, 'description', 600)
    const more = String(form.get('details') ?? '').trim().slice(0, 5000)
    const cat = str(form, 'category', 40)
    const st = (['active', 'draft', 'unlisted'] as const).find((s) => s === str(form, 'status', 10)) ?? 'active'
    const { description: _d, details: _x, category: _c, status: _s, ...rest } = existing
    const ok = ProductSchema.safeParse({ ...rest, name, slug: wantedSlug, ...(desc ? { description: desc } : {}), ...(more ? { details: more } : {}), ...(cat ? { category: cat } : {}), ...(st !== 'active' ? { status: st } : {}) })
    if (!ok.success) return { error: 'Some of those details don’t fit. Check them and try again.' }
    return { product: ok.data, stock: {} }
  }
  const price = money(form, 'price')
  if (price === undefined || price === null) return { error: 'Enter a price like 24 or 24.50.' }
  const compareAt = money(form, 'compareAt')
  if (compareAt === null) return { error: 'Enter the “was” price like 30 or 29.99, or leave it empty.' }
  const cost = money(form, 'cost')
  if (cost === null) return { error: 'Enter your cost like 8 or 7.50, or leave it empty.' }
  const status = (['active', 'draft', 'unlisted'] as const).find((s) => s === str(form, 'status', 10)) ?? 'active'
  const description = str(form, 'description', 600)
  const details = String(form.get('details') ?? '').trim().slice(0, 5000)
  const category = str(form, 'category', 40)
  const sku = str(form, 'sku', 60)
  const wanted = slugify(str(form, 'slug', 80) || name)
  if (taken.has(wanted)) return { error: `Another product already uses the address /shop/${wanted}. Change this one’s address.` }

  // Photos: the ticked ones in the order shown, then a pasted link.
  const byKey = new Map(photos.map((p) => [p.src, p]))
  const picked = form.getAll('photo').map(String).filter((s) => byKey.has(s) || (existing && [existing.image, ...(existing.images ?? [])].some((i) => i?.src === s)))
  const keep = new Map([...(existing ? [existing.image, ...(existing.images ?? [])] : [])].filter(Boolean).map((i) => [i!.src, i!]))
  const url = str(form, 'photoUrl', 500)
  if (url && !/^(https:\/\/[^\s]+|\/u\/[a-f0-9]{32})$/.test(url)) return { error: 'The photo link needs to start with https://.' }
  const images = [...new Set([...picked, ...(url ? [url] : [])])].slice(0, 9).map((src) => ({ src, alt: (byKey.get(src)?.alt ?? keep.get(src)?.alt ?? name).slice(0, 250) }))

  // Options: up to three, each "Name" with "value, value, value".
  const options: NonNullable<Product['options']> = []
  for (const i of [1, 2, 3]) {
    const oname = str(form, `opt${i}_name`, 30)
    const values = [...new Set(str(form, `opt${i}_values`, 600).split(',').map((v) => v.trim().slice(0, 40)).filter(Boolean))].slice(0, 30)
    if (oname && values.length) options.push({ name: oname, values })
    else if (oname || values.length) return { error: `Option ${i} needs a name (like Size) and at least one choice (like Small, Medium).` }
  }
  let combos = 1
  for (const o of options) combos *= o.values.length
  if (combos > 100) return { error: `Those options make ${combos} combinations; the most a product can have is 100.` }

  const track = !!form.get('track')
  const stock: Record<string, number> = {}
  let variants: Variant[] = []
  if (options.length) {
    variants = buildVariants(options, existing?.variants ?? [], (n) => `v${n + 1}`).map((v) => {
      const vp = money(form, `v_${v.id}_price`)
      const vc = money(form, `v_${v.id}_compare`)
      const vsku = str(form, `v_${v.id}_sku`, 60)
      const out: Variant = { id: v.id, values: v.values }
      // A variant's own price only when it differs from the product's.
      if (typeof vp === 'number' && vp !== price) out.price = vp
      if (typeof vc === 'number') out.compareAt = vc
      if (vsku) out.sku = vsku
      if (form.get(`v_${v.id}_soldout`)) out.soldOut = true
      const n = count(form, `v_${v.id}_stock`)
      if (track && n !== undefined) stock[stockKey(id, v.id)] = n
      return out
    })
  } else if (track) {
    const n = count(form, 'stock')
    if (n !== undefined) stock[stockKey(id)] = n
  }

  const product: Product = {
    id,
    name,
    price,
    ...(description ? { description } : {}),
    ...(images[0] ? { image: images[0] } : {}),
    ...(images.length > 1 ? { images: images.slice(1) } : {}),
    ...(existing?.buyUrl ? { buyUrl: existing.buyUrl } : {}),
    ...(form.get('soldOut') ? { soldOut: true } : {}),
    slug: wanted,
    ...(status !== 'active' ? { status } : {}),
    ...(details ? { details } : {}),
    ...(compareAt ? { compareAt } : {}),
    ...(cost !== undefined ? { cost } : {}),
    ...(sku ? { sku } : {}),
    ...(track ? { track: true } : {}),
    ...(track && form.get('oversell') ? { oversell: true } : {}),
    ...(options.length ? { options, variants } : {}),
    ...(category ? { category } : {}),
    ...(form.get('noShipping') ? { noShipping: true } : {}),
  }
  const ok = ProductSchema.safeParse(product)
  if (!ok.success) return { error: 'Some of those details don’t fit. Check the price, photos and options and try again.' }
  return { product: ok.data, stock }
}
