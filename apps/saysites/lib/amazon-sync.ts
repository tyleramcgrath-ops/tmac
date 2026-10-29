// Amazon picks into and through the shop: adding products from pasted links
// (dashboard and Sofie) and the daily refresh that keeps prices and photos
// current (instrumentation.ts). See lib/amazon for the rules.

import { randomUUID } from 'crypto'
import { AmazonError, FRESH_MS, getItems, isShortLink, itemToProduct, parseAmazonLink, resolveShortLink, splitLinks, type AmazonItem } from './amazon'
import type { Product, Site } from './schema'
import { applyShop } from './shop-admin'
import type { Store } from './store'

export interface ImportResult {
  site: Site
  added: Product[]
  updated: Product[]
  // Plain sentences for the owner: links we couldn't use, and why.
  problems: string[]
}

const MAX_PRODUCTS = 300

// Adds (or refreshes) the Amazon products behind the pasted links.
export async function importAmazon(store: Store, site: Site, pasted: string, f: typeof fetch = fetch): Promise<ImportResult> {
  const cfg = site.store?.amazon
  const keys = await store.amazonKeys(site.id)
  if (!cfg || !keys) throw new AmazonError('Connect Amazon first: add your Associates tag and Creators API credentials in Store settings.')
  const problems: string[] = []
  const asins: string[] = []
  for (const raw of splitLinks(pasted)) {
    let link = raw
    if (isShortLink(raw)) {
      const to = await resolveShortLink(raw, f)
      if (!to) {
        problems.push(`Couldn’t open the short link ${raw}. Paste the full Amazon product link instead.`)
        continue
      }
      link = to
    }
    const parsed = parseAmazonLink(link)
    if (!parsed) {
      problems.push(`${raw.slice(0, 80)} isn’t an Amazon product link. Open the product on Amazon and copy the address.`)
      continue
    }
    if (parsed.market && parsed.market !== cfg.market) problems.push(`${parsed.asin} is from ${parsed.market.replace('www.', '')}; your shop uses ${cfg.market.replace('www.', '')}, so it was looked up there.`)
    if (!asins.includes(parsed.asin)) asins.push(parsed.asin)
  }
  if (!asins.length) return { site, added: [], updated: [], problems: problems.length ? problems : ['Paste at least one Amazon product link.'] }

  const { items, missing } = await getItems(keys, cfg.market, cfg.tag, asins, f)
  for (const a of missing) problems.push(`Amazon didn’t return ${a} for ${cfg.market.replace('www.', '')}. It may not be sold there, or may not be available to Associates.`)

  const existing = site.store?.products ?? []
  const room = MAX_PRODUCTS - existing.length
  const added: Product[] = []
  const updated: Product[] = []
  const now = new Date()
  for (const item of items) {
    const old = existing.find((p) => p.amazon?.asin === item.asin)
    if (old) updated.push(itemToProduct(item, cfg.market, old.id, old, now))
    else if (added.length < room) added.push(itemToProduct(item, cfg.market, `p-${randomUUID().slice(0, 8)}`, undefined, now))
    else problems.push(`${item.title.slice(0, 60)} wasn’t added: a shop can have up to ${MAX_PRODUCTS} products.`)
  }
  if (!added.length && !updated.length) return { site, added, updated, problems }
  const byId = new Map(updated.map((p) => [p.id, p]))
  const next = await applyShop(store, site, (s) => ({ ...s, products: [...s.products.map((p) => byId.get(p.id) ?? p), ...added] }))
  return { site: next, added, updated, problems }
}

// Refreshes a shop's Amazon picks whose data is older than `olderThanMs`.
// Items Amazon no longer returns keep their old data: their price stops
// showing once it's a day old.
export async function refreshAmazon(store: Store, site: Site, opts: { olderThanMs?: number; now?: Date; f?: typeof fetch } = {}): Promise<number> {
  const cfg = site.store?.amazon
  const now = opts.now ?? new Date()
  const cutoff = now.getTime() - (opts.olderThanMs ?? FRESH_MS - 4 * 3600_000)
  const due = (site.store?.products ?? []).filter((p) => p.amazon && p.amazon.market === cfg?.market && (!p.amazon.checkedAt || Date.parse(p.amazon.checkedAt) < cutoff))
  if (!cfg || !due.length) return 0
  const keys = await store.amazonKeys(site.id)
  if (!keys) return 0
  const { items } = await getItems(keys, cfg.market, cfg.tag, due.map((p) => p.amazon!.asin), opts.f)
  const byAsin = new Map<string, AmazonItem>(items.map((x) => [x.asin, x]))
  let n = 0
  await applyShop(store, site, (s) => ({
    ...s,
    products: s.products.map((p) => {
      const item = p.amazon && byAsin.get(p.amazon.asin)
      if (!item) return p
      n++
      return itemToProduct(item, cfg.market, p.id, p, now)
    }),
  }))
  return n
}

// The scheduler's job: every shop with Amazon picks. One shop's problem
// (bad credentials, Amazon busy) never stops the others; the last problem
// is kept for the Store page to show.
export async function refreshAllAmazon(store: Store, now = new Date()): Promise<number> {
  let total = 0
  for (const site of await store.allSites()) {
    if (!site.store?.amazon || !site.store.products.some((p) => p.amazon)) continue
    try {
      total += await refreshAmazon(store, site, { now })
      await store.cacheSet(`amazon-error:${site.id}`, null)
    } catch (e) {
      await store.cacheSet(`amazon-error:${site.id}`, { at: now.toISOString(), message: e instanceof Error ? e.message : 'Amazon refresh failed' })
    }
  }
  return total
}

