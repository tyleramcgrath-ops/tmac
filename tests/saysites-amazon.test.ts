import { afterEach, describe, expect, it, vi } from 'vitest'
import { DISCLOSURE, amazonUrl, getItems, itemToProduct, parseAmazonLink, priceFresh, readItem, type AmazonItem } from '../apps/saysites/lib/amazon'
import { importAmazon, refreshAmazon } from '../apps/saysites/lib/amazon-sync'
import { priceCart } from '../apps/saysites/lib/commerce'
import { privacyPage } from '../apps/saysites/lib/privacy'
import { renderPage } from '../apps/saysites/lib/render'
import { SiteSchema, StoreSchema, type Product, type ShopSettings, type Site } from '../apps/saysites/lib/schema'
import { structuredData } from '../apps/saysites/lib/seo'
import { SHOWCASE } from '../apps/saysites/lib/showcase'
import { handleCartPost } from '../apps/saysites/lib/shop-serve'
import { MemoryStore } from '../apps/saysites/lib/store'
import { Workspace, runTool } from '../apps/saysites/lib/sofie'

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

const own: Product = { id: 'p-candle', name: 'Lavender candle', price: 2400 }
const kettle: Product = {
  id: 'p-kettle',
  name: 'Gooseneck kettle',
  price: 4999,
  description: 'Pours slowly.',
  image: { src: 'https://m.media-amazon.com/images/I/kettle.jpg', alt: 'Kettle' },
  amazon: { asin: 'B0KETTLE01', market: 'www.amazon.com', checkedAt: hoursAgo(1) },
}
const stale: Product = { ...kettle, id: 'p-stale', name: 'Old grinder', amazon: { asin: 'B0GRINDER1', market: 'www.amazon.com', checkedAt: hoursAgo(30) } }
const settings: ShopSettings = { currency: 'USD', products: [own, kettle, stale], checkout: { account: 'acct_123456789', ready: true }, amazon: { tag: 'fieldshop-20', market: 'www.amazon.com' } }

function shopSite(s: ShopSettings = settings): { site: Site; pages: (typeof SHOWCASE)['field-and-thread']['pages'] } {
  const base = clone(SHOWCASE['field-and-thread'])
  return { site: SiteSchema.parse({ ...base.site, store: s }), pages: base.pages }
}

// A Creators API item as the docs describe it (offersV2 shaped like PA-API's).
const apiItem = (asin: string, title: string, amount?: number) => ({
  asin,
  detailPageURL: `https://www.amazon.com/dp/${asin}?tag=fieldshop-20`,
  itemInfo: {
    title: { displayValue: title, label: 'Title', locale: 'en_US' },
    features: { displayValues: ['Stainless steel', 'Holds 1 liter'], label: 'Features', locale: 'en_US' },
    byLineInfo: { brand: { displayValue: 'Acme', label: 'Brand', locale: 'en_US' } },
  },
  images: { primary: { large: { url: `https://m.media-amazon.com/images/I/${asin}.jpg`, height: 500, width: 500 } }, variants: [{ large: { url: `https://m.media-amazon.com/images/I/${asin}-2.jpg`, height: 500, width: 500 } }] },
  ...(amount ? { offersV2: { listings: [{ price: { money: { amount, currency: 'USD', displayAmount: `$${amount}` } } }] } } : {}),
})

// A fake Amazon: the token endpoint, then getItems for whatever was asked.
function fakeAmazon(prices: Record<string, number> = {}) {
  const calls: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = []
  const f = (async (url: string, init: { body?: string; headers?: Record<string, string>; method?: string }) => {
    const body = init.body ? JSON.parse(init.body) : {}
    calls.push({ url, body, headers: init.headers ?? {} })
    if (url.endsWith('/auth/o2/token')) return new Response(JSON.stringify({ access_token: 'tok-1', expires_in: 3600 }))
    if (url === 'https://creatorsapi.amazon/catalog/v1/getItems') {
      const ids = (body.itemIds as string[]).filter((a) => !a.startsWith('B0GONE'))
      return new Response(JSON.stringify({ itemResults: { items: ids.map((a) => apiItem(a, `Item ${a}`, prices[a])) }, ...(ids.length < (body.itemIds as string[]).length ? { errors: [{ code: 'ItemNotAccessible', message: 'nope' }] } : {}) }))
    }
    if (url.startsWith('https://amzn.to/')) return new Response(null, { status: 301, headers: { location: 'https://www.amazon.com/dp/B0SHORTLNK/ref=xyz' } })
    return new Response('not found', { status: 404 })
  }) as unknown as typeof fetch
  return { f, calls }
}

afterEach(() => vi.unstubAllGlobals())

describe('Amazon picks: links', () => {
  it('finds the ASIN in every kind of Amazon product link', () => {
    expect(parseAmazonLink('https://www.amazon.com/Gooseneck-Kettle/dp/B0KETTLE01/ref=sr_1_3?keywords=kettle')).toEqual({ asin: 'B0KETTLE01', market: 'www.amazon.com' })
    expect(parseAmazonLink('amazon.co.uk/gp/product/b0kettle01')).toEqual({ asin: 'B0KETTLE01', market: 'www.amazon.co.uk' })
    expect(parseAmazonLink('https://smile.amazon.com/gp/aw/d/B0KETTLE01')?.asin).toBe('B0KETTLE01')
    expect(parseAmazonLink('B0KETTLE01')).toEqual({ asin: 'B0KETTLE01' })
    expect(parseAmazonLink('https://www.amazon.co.jp/dp/B0KETTLE01')).toEqual({ asin: 'B0KETTLE01', market: undefined })
    expect(parseAmazonLink('https://www.amazon.com/s?k=kettle')).toBeNull()
    expect(parseAmazonLink('https://evil.example/dp/B0KETTLE01')).toBeNull()
    expect(parseAmazonLink('https://amazon.com.evil.example/dp/B0KETTLE01')).toBeNull()
  })

  it('links to the product on Amazon with the owner’s tag', () => {
    expect(amazonUrl({ asin: 'B0KETTLE01', market: 'www.amazon.ca' }, 'shop-21')).toBe('https://www.amazon.ca/dp/B0KETTLE01?tag=shop-21')
  })

  it('only accepts an Associates tag that looks like one', () => {
    expect(StoreSchema.safeParse({ ...settings, amazon: { tag: 'fieldshop-20', market: 'www.amazon.com' } }).success).toBe(true)
    expect(StoreSchema.safeParse({ ...settings, amazon: { tag: 'not a tag', market: 'www.amazon.com' } }).success).toBe(false)
  })
})

describe('Amazon picks: the Creators API', () => {
  it('signs in once, looks items up in batches of 10 with the right headers, and reads them', async () => {
    const { f, calls } = fakeAmazon({ B0KETTLE01: 49.99 })
    const asins = ['B0KETTLE01', ...Array.from({ length: 11 }, (_, i) => `B0ITEM${String(i).padStart(4, '0')}`)]
    const r = await getItems({ credentialId: 'amzn1.cred.1', credentialSecret: 's3cret' }, 'www.amazon.com', 'fieldshop-20', asins, f)
    const tokenCalls = calls.filter((c) => c.url.endsWith('/auth/o2/token'))
    expect(tokenCalls).toHaveLength(1)
    expect(tokenCalls[0].url).toBe('https://api.amazon.com/auth/o2/token')
    expect(tokenCalls[0].body).toEqual({ grant_type: 'client_credentials', client_id: 'amzn1.cred.1', client_secret: 's3cret', scope: 'creatorsapi::default' })
    const lookups = calls.filter((c) => c.url.includes('getItems'))
    expect(lookups.map((c) => (c.body.itemIds as string[]).length)).toEqual([10, 2])
    expect(lookups[0].headers).toMatchObject({ authorization: 'Bearer tok-1', 'x-marketplace': 'www.amazon.com' })
    expect(lookups[0].body).toMatchObject({ itemIdType: 'ASIN', marketplace: 'www.amazon.com', partnerTag: 'fieldshop-20' })
    expect(r.items).toHaveLength(12)
    expect(r.items[0]).toMatchObject({ asin: 'B0KETTLE01', title: 'Item B0KETTLE01', brand: 'Acme', price: 4999, image: 'https://m.media-amazon.com/images/I/B0KETTLE01.jpg' })
  })

  it('uses the right sign-in address for UK and Australian shops', async () => {
    const { f, calls } = fakeAmazon()
    await getItems({ credentialId: 'uk-cred', credentialSecret: 's' }, 'www.amazon.co.uk', 'shop-21', ['B0KETTLE01'], f)
    await getItems({ credentialId: 'au-cred', credentialSecret: 's' }, 'www.amazon.com.au', 'shop-22', ['B0KETTLE01'], f)
    expect(calls.filter((c) => c.url.endsWith('/token')).map((c) => c.url)).toEqual(['https://api.amazon.co.uk/auth/o2/token', 'https://api.amazon.co.jp/auth/o2/token'])
  })

  it('ignores items with missing or unsafe fields instead of failing', () => {
    expect(readItem({ asin: 'B0KETTLE01' })).toBeNull()
    expect(readItem({ asin: 'nope', itemInfo: { title: { displayValue: 'x' } } })).toBeNull()
    expect(readItem({ asin: 'B0KETTLE01', itemInfo: { title: { displayValue: 'Kettle' } }, images: { primary: { large: { url: 'javascript:alert(1)' } } } })).toMatchObject({ title: 'Kettle', image: undefined, features: [] })
  })

  it('turns an item into a product, keeping the owner’s own words when refreshing', () => {
    const item: AmazonItem = { asin: 'B0KETTLE01', title: 'Acme Gooseneck Electric Kettle', brand: 'Acme', features: ['Stainless steel', 'Holds 1 liter'], image: 'https://m.media-amazon.com/a.jpg', images: ['https://m.media-amazon.com/b.jpg'], price: 5299 }
    const fresh = itemToProduct(item, 'www.amazon.com', 'p-1')
    expect(fresh).toMatchObject({ name: 'Acme Gooseneck Electric Kettle', price: 5299, description: 'Stainless steel', details: 'Stainless steel\n\nHolds 1 liter', status: 'active', amazon: { asin: 'B0KETTLE01', market: 'www.amazon.com' } })
    expect(fresh.images).toHaveLength(1)
    const mine = { ...fresh, name: 'Our favorite kettle', description: 'What we use in the shop.', category: 'Coffee', track: true, compareAt: 9000 }
    const again = itemToProduct({ ...item, price: 4799 }, 'www.amazon.com', 'p-1', mine)
    expect(again).toMatchObject({ name: 'Our favorite kettle', description: 'What we use in the shop.', category: 'Coffee', price: 4799 })
    expect(again.track).toBeUndefined()
    expect(again.compareAt).toBeUndefined()
  })
})

describe('Amazon picks: on the website', () => {
  it('shows Buy on Amazon with the tag, a fresh price only, and the disclosure, with no cart button', () => {
    const { site, pages } = shopSite()
    const shop = pages.find((p) => p.slug === 'shop')!
    const html = renderPage(site, shop, pages, {}).html
    expect(html).toContain('href="https://www.amazon.com/dp/B0KETTLE01?tag=fieldshop-20" rel="sponsored nofollow noopener" target="_blank">Buy on Amazon')
    expect(html).toContain('$49.99</span> <span class="pr-src">on Amazon')
    expect(html).toContain('See price on Amazon')
    expect(html).toContain(DISCLOSURE)
    expect(html).not.toContain('name="p" value="p-kettle"')
    expect(html).toContain('name="p" value="p-candle"')
    expect(priceFresh(kettle)).toBe(true)
    expect(priceFresh(stale)).toBe(false)
  })

  it('never puts an Amazon pick in the cart or checkout', async () => {
    const store = new MemoryStore()
    const { site, pages } = shopSite()
    const bundle = { site, pages, redirects: [], stock: {} }
    const f = new FormData()
    f.set('a', 'add')
    f.set('p', 'p-kettle')
    f.set('q', '1')
    const res = await handleCartPost(bundle, new Request('https://x/__cart', { method: 'POST', body: f }), store, { preview: false })
    expect(res.headers.get('set-cookie') ?? '').not.toContain('p-kettle')
    const quote = priceCart(settings, { items: [{ p: 'p-kettle', q: 1 }, { p: 'p-candle', q: 1 }] }, {}, { today: '2026-10-22' })
    expect(quote.lines.map((l) => l.productId)).toEqual(['p-candle'])
  })

  it('gives Google no Offer for an Amazon pick (Amazon sells it, not the business)', () => {
    const { site, pages } = shopSite()
    const page = { id: 'x', siteId: site.id, slug: 'shop/gooseneck-kettle', name: 'Kettle', status: 'published' as const, seo: { title: 'K', description: 'K' }, body: [{ id: 's', type: 'container' as const, layout: 'flex' as const, children: [{ id: 'pd', type: 'product' as const, productId: 'p-kettle' }] }], updatedAt: site.updatedAt }
    const ld = structuredData(site, page, pages, {}) as { '@type': string }[]
    expect(ld.some((d) => d['@type'] === 'Product' || d['@type'] === 'ProductGroup')).toBe(false)
  })

  it('says so on the privacy page', () => {
    const { site } = shopSite()
    expect(JSON.stringify(privacyPage(site))).toContain('As an Amazon Associate')
    expect(JSON.stringify(privacyPage(shopSite({ ...settings, products: [own] }).site))).not.toContain('Amazon')
  })
})

describe('Amazon picks: adding and refreshing', () => {
  async function setup(s: ShopSettings = { currency: 'USD', products: [own], amazon: { tag: 'fieldshop-20', market: 'www.amazon.com' } }) {
    const store = new MemoryStore()
    const owner = await store.createUser({ email: 'owner@example.com', name: 'Owner', passwordHash: 'x' })
    const { site: s0, pages } = shopSite(s)
    const site = { ...s0, orgId: owner.id, subdomain: 'amazon-test-shop', id: 'site-amazon-test' }
    await store.createSite(owner.id, site, pages)
    return { store, site }
  }

  it('needs Amazon connected first', async () => {
    const { store, site } = await setup()
    await expect(importAmazon(store, site, 'https://www.amazon.com/dp/B0KETTLE01')).rejects.toThrow(/Connect Amazon first/)
  })

  it('adds products from pasted links (short links too), skips what it can’t use, and refreshes repeats', async () => {
    const { store, site } = await setup()
    await store.saveAmazonKeys(site.id, { credentialId: 'c', credentialSecret: 's' })
    const { f } = fakeAmazon({ B0KETTLE01: 49.99 })
    const r = await importAmazon(store, site, 'https://www.amazon.com/dp/B0KETTLE01\nhttps://amzn.to/abc123\nhttps://example.com/x\nB0GONE0001', f)
    expect(r.added.map((p) => p.amazon!.asin).sort()).toEqual(['B0KETTLE01', 'B0SHORTLNK'])
    expect(r.problems.join(' ')).toMatch(/isn’t an Amazon product link/)
    expect(r.problems.join(' ')).toMatch(/didn’t return B0GONE0001/)
    const saved = (await store.siteById(site.id))!.store!.products
    expect(saved).toHaveLength(3)
    const again = await importAmazon(store, saved && (await store.siteById(site.id))!, 'B0KETTLE01', f)
    expect(again.added).toHaveLength(0)
    expect(again.updated).toHaveLength(1)
    expect((await store.siteById(site.id))!.store!.products).toHaveLength(3)
  })

  it('refreshes only stale Amazon picks, with the latest price', async () => {
    const { store, site } = await setup({ ...settings })
    await store.saveAmazonKeys(site.id, { credentialId: 'c2', credentialSecret: 's' })
    const { f, calls } = fakeAmazon({ B0GRINDER1: 89.5 })
    const n = await refreshAmazon(store, site, { f })
    expect(n).toBe(1)
    expect(calls.filter((c) => c.url.includes('getItems')).flatMap((c) => c.body.itemIds as string[])).toEqual(['B0GRINDER1'])
    const grinder = (await store.siteById(site.id))!.store!.products.find((p) => p.id === 'p-stale')!
    expect(grinder.price).toBe(8950)
    expect(grinder.name).toBe('Old grinder')
    expect(priceFresh(grinder)).toBe(true)
  })
})

describe('Amazon picks: Sofie', () => {
  it('adds Amazon picks from links, and won’t change their price', async () => {
    const { site, pages } = shopSite({ currency: 'USD', products: [], amazon: { tag: 'fieldshop-20', market: 'www.amazon.com' } })
    const lookup = async (asins: string[]) => ({ items: asins.map((a) => readItem(apiItem(a, `Item ${a}`, 20))!), missing: [] })
    const ws = new Workspace({ site, pages }, { amazon: { lookup, resolve: async () => null } })
    const out = await runTool(ws, 'add_amazon_products', { links: ['https://www.amazon.com/dp/B0KETTLE01'], summary: 'Added a kettle from Amazon' })
    expect(out).toMatch(/Added or refreshed: Item B0KETTLE01/)
    const p = ws.site.store!.products[0]
    expect(p).toMatchObject({ price: 2000, amazon: { asin: 'B0KETTLE01' } })
    expect(await runTool(ws, 'save_product', { product_json: JSON.stringify({ id: p.id, price: 1 }), summary: 'x' })).toMatch(/Amazon pick/)
    expect(await runTool(ws, 'save_product', { product_json: JSON.stringify({ id: p.id, name: 'Our kettle' }), summary: 'Renamed' })).toMatch(/Product id/)
    expect(ws.site.store!.products[0]).toMatchObject({ name: 'Our kettle', price: 2000, amazon: { asin: 'B0KETTLE01' } })
  })

  it('tells the owner to connect Amazon when it isn’t', async () => {
    const { site, pages } = shopSite({ currency: 'USD', products: [] })
    const ws = new Workspace({ site, pages })
    expect(await runTool(ws, 'add_amazon_products', { links: ['B0KETTLE01'], summary: 'x' })).toMatch(/isn’t connected/)
  })
})
