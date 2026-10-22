// Amazon picks: products from Amazon in a SaySites shop. The owner pastes an
// Amazon link; the product shows on their site with a "Buy on Amazon" button
// carrying their own Amazon Associates tag, so they earn the commission.
// Amazon items never go in the cart: the sale happens on Amazon.
//
// Product facts (title, photos, features, price) come only from Amazon's
// Creators API (PA-API 5 was shut down in 2026), using the owner's own
// credentials from Associates Central, never from scraping Amazon pages.
// Amazon's program rules we follow:
// - Show a price only while it is under 24 hours old; otherwise "See price
//   on Amazon". The scheduler refreshes Amazon items daily (refreshShop).
// - Use Amazon's own photo addresses from the API, not copies.
// - Say "As an Amazon Associate, we earn from qualifying purchases" wherever
//   Amazon items are shown.
// - Links are marked rel="sponsored nofollow".
//
// Credentials live in ss_amazon (Store.amazonKeys), never in the site JSON
// that Sofie and the renderer read. The tag and marketplace are public (they
// appear in every link), so they live on site.store.amazon.

import { AMAZON_MARKETS, type AmazonMarket, type Product } from './schema'

export interface AmazonKeys {
  credentialId: string
  credentialSecret: string
}

// Marketplaces SaySites shops can use, with the Creators API credential
// "version" (region) and token endpoint for each.
type Region = 'NA' | 'EU' | 'FE'
const REGION: Record<AmazonMarket, Region> = {
  'www.amazon.com': 'NA',
  'www.amazon.ca': 'NA',
  'www.amazon.co.uk': 'EU',
  'www.amazon.de': 'EU',
  'www.amazon.fr': 'EU',
  'www.amazon.it': 'EU',
  'www.amazon.es': 'EU',
  'www.amazon.com.au': 'FE',
}
const TOKEN_URL: Record<Region, string> = {
  NA: 'https://api.amazon.com/auth/o2/token',
  EU: 'https://api.amazon.co.uk/auth/o2/token',
  FE: 'https://api.amazon.co.jp/auth/o2/token',
}
const VERSION: Record<Region, string> = { NA: '3.1', EU: '3.2', FE: '3.3' }
export const MARKET_LABEL: Record<AmazonMarket, string> = {
  'www.amazon.com': 'United States (amazon.com)',
  'www.amazon.ca': 'Canada (amazon.ca)',
  'www.amazon.co.uk': 'United Kingdom (amazon.co.uk)',
  'www.amazon.de': 'Germany (amazon.de)',
  'www.amazon.fr': 'France (amazon.fr)',
  'www.amazon.it': 'Italy (amazon.it)',
  'www.amazon.es': 'Spain (amazon.es)',
  'www.amazon.com.au': 'Australia (amazon.com.au)',
}
export const credentialVersion = (m: AmazonMarket) => VERSION[REGION[m]]

const API = 'https://creatorsapi.amazon/catalog/v1/getItems'
export const FRESH_MS = 24 * 3600_000
// The words Amazon's Operating Agreement asks for wherever its items show.
export const DISCLOSURE = 'As an Amazon Associate, we earn from qualifying purchases.'

export const ASIN = /^[A-Z0-9]{10}$/
// Associates tracking IDs look like "mystore-20" (the number varies by country).
export const TAG = /^[A-Za-z0-9][A-Za-z0-9-]{1,38}-\d{2}$/

const ASIN_PATHS = [/\/dp\/([A-Z0-9]{10})(?=[/?#]|$)/i, /\/gp\/product\/([A-Z0-9]{10})(?=[/?#]|$)/i, /\/gp\/aw\/d\/([A-Z0-9]{10})(?=[/?#]|$)/i, /\/exec\/obidos\/(?:ASIN|tg\/detail\/-)\/([A-Z0-9]{10})(?=[/?#]|$)/i, /\/o\/ASIN\/([A-Z0-9]{10})(?=[/?#]|$)/i]
// Amazon's own store domains (any of them; the shop's marketplace decides
// where the item is looked up).
const AMAZON_HOST = /^(?:[a-z0-9-]+\.)*amazon\.(?:com|ca|com\.mx|com\.br|co\.uk|de|fr|it|es|nl|se|pl|com\.be|ie|com\.tr|ae|sa|eg|in|co\.jp|sg|com\.au)$/i
const SHORT_HOSTS = new Set(['amzn.to', 'a.co', 'amzn.eu', 'amzn.asia'])

export interface ParsedLink {
  asin: string
  // The marketplace the link was for, when it's one SaySites supports.
  market?: AmazonMarket
}

function hostMarket(host: string): AmazonMarket | undefined {
  const h = host.toLowerCase().replace(/^(smile|m)\./, 'www.')
  const withWww = h.startsWith('www.') ? h : `www.${h}`
  return (AMAZON_MARKETS as readonly string[]).includes(withWww) ? (withWww as AmazonMarket) : undefined
}

// The ASIN in an Amazon product link (or a bare ASIN). Short links
// (amzn.to, a.co) need resolveShortLink first. Null when it isn't one.
export function parseAmazonLink(input: string): ParsedLink | null {
  const t = input.trim()
  if (ASIN.test(t.toUpperCase()) && !t.includes('/')) return { asin: t.toUpperCase() }
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
  } catch {
    return null
  }
  if (!AMAZON_HOST.test(u.hostname)) return null
  for (const re of ASIN_PATHS) {
    const m = u.pathname.match(re)
    if (m) return { asin: m[1].toUpperCase(), market: hostMarket(u.hostname) }
  }
  const q = u.searchParams.get('asin') ?? u.searchParams.get('ASIN')
  if (q && ASIN.test(q.toUpperCase())) return { asin: q.toUpperCase(), market: hostMarket(u.hostname) }
  return null
}

export const isShortLink = (input: string) => {
  try {
    return SHORT_HOSTS.has(new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`).hostname.toLowerCase())
  } catch {
    return false
  }
}

// Follows an amzn.to / a.co short link one hop to see which product it
// points at (the redirect address only; the page itself isn't read).
export async function resolveShortLink(input: string, f: typeof fetch = fetch): Promise<string | null> {
  try {
    const url = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`
    const res = await f(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000) })
    return res.headers.get('location')
  } catch {
    return null
  }
}

// Splits what the owner pasted into links (one per line, or spaces/commas).
export const splitLinks = (text: string) =>
  text
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 30)

// The link every "Buy on Amazon" button uses: the product's own page with
// the owner's tag. Built when rendering, so a changed tag applies everywhere.
export function amazonUrl(p: Pick<NonNullable<Product['amazon']>, 'asin' | 'market'>, tag: string | undefined): string {
  return `https://${p.market}/dp/${p.asin}${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`
}

// A price may be shown only while it's fresh (Amazon's 24-hour rule).
export const priceFresh = (p: Product, now = Date.now()) => !!p.amazon?.checkedAt && p.price > 0 && now - Date.parse(p.amazon.checkedAt) < FRESH_MS

// --- The Creators API --------------------------------------------------------

const tokens = new Map<string, { token: string; until: number }>()

async function accessToken(keys: AmazonKeys, market: AmazonMarket, f: typeof fetch): Promise<string> {
  const region = REGION[market]
  const key = `${region}|${keys.credentialId}`
  const hit = tokens.get(key)
  if (hit && hit.until > Date.now()) return hit.token
  const res = await f(TOKEN_URL[region], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: keys.credentialId, client_secret: keys.credentialSecret, scope: 'creatorsapi::default' }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new AmazonError(res.status === 400 || res.status === 401 ? 'Amazon didn’t accept the Credential ID and Secret. Copy them again from Associates Central (Tools, then Creators API).' : `Amazon’s sign-in didn’t answer (${res.status}). Try again in a minute.`)
  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new AmazonError('Amazon’s sign-in sent no token. Try again in a minute.')
  // Tokens last an hour; renew a few minutes early.
  tokens.set(key, { token: data.access_token, until: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000 })
  return data.access_token
}

export class AmazonError extends Error {}

// Checks the credentials by signing in (no product lookup). Throws AmazonError.
export async function checkKeys(keys: AmazonKeys, market: AmazonMarket, f: typeof fetch = fetch): Promise<void> {
  tokens.delete(`${REGION[market]}|${keys.credentialId}`)
  await accessToken(keys, market, f)
}

export interface AmazonItem {
  asin: string
  title: string
  url?: string
  brand?: string
  features: string[]
  image?: string
  images: string[]
  // Cents, when Amazon gave an offer price.
  price?: number
  currency?: string
}

const RESOURCES = [
  'itemInfo.title',
  'itemInfo.features',
  'itemInfo.byLineInfo',
  'images.primary.large',
  'images.variants.large',
  'offersV2.listings.price',
  'offersV2.listings.availability',
]

type Json = Record<string, unknown>
const obj = (v: unknown): Json | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : undefined)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const httpsUrl = (v: unknown) => {
  const s = text(v)
  return s && /^https:\/\/[^\s]+$/.test(s) ? s : undefined
}

// One item from a getItems response. Defensive: any field may be missing.
export function readItem(raw: unknown): AmazonItem | null {
  const it = obj(raw)
  const asin = text(it?.asin)?.toUpperCase()
  if (!it || !asin || !ASIN.test(asin)) return null
  const info = obj(it.itemInfo)
  const title = text(obj(info?.title)?.displayValue)
  if (!title) return null
  const brand = text(obj(obj(info?.byLineInfo)?.brand)?.displayValue)
  const features = arr(obj(info?.features)?.displayValues)
    .map(text)
    .filter((x): x is string => !!x)
  const images = obj(it.images)
  const image = httpsUrl(obj(obj(images?.primary)?.large)?.url)
  const more = arr(images?.variants)
    .map((v) => httpsUrl(obj(obj(v)?.large)?.url))
    .filter((x): x is string => !!x)
  const listing = obj(arr(obj(it.offersV2)?.listings)[0])
  const money = obj(obj(listing?.price)?.money)
  const amount = typeof money?.amount === 'number' ? money.amount : undefined
  return {
    asin,
    title,
    url: httpsUrl(it.detailPageURL),
    brand,
    features,
    image,
    images: more,
    ...(amount !== undefined && amount > 0 ? { price: Math.round(amount * 100), currency: text(money?.currency) } : {}),
  }
}

// Looks up to 10 items per call (the API's limit), in batches.
export async function getItems(keys: AmazonKeys, market: AmazonMarket, tag: string, asins: string[], f: typeof fetch = fetch): Promise<{ items: AmazonItem[]; missing: string[] }> {
  const want = [...new Set(asins.map((a) => a.toUpperCase()).filter((a) => ASIN.test(a)))]
  const items: AmazonItem[] = []
  for (let i = 0; i < want.length; i += 10) {
    const batch = want.slice(i, i + 10)
    const token = await accessToken(keys, market, f)
    const res = await f(API, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-marketplace': market },
      body: JSON.stringify({ itemIds: batch, itemIdType: 'ASIN', marketplace: market, partnerTag: tag, resources: RESOURCES }),
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 401 || res.status === 403) {
      tokens.delete(`${REGION[market]}|${keys.credentialId}`)
      throw new AmazonError('Amazon turned the request down. Check the tag belongs to the same Associates account as the credentials, and that the account is approved for the Creators API.')
    }
    if (res.status === 429) throw new AmazonError('Amazon asked us to slow down. Try again in a minute.')
    if (!res.ok) throw new AmazonError(`Amazon didn’t answer (${res.status}). Try again in a minute.`)
    const data = obj(await res.json())
    for (const raw of arr(obj(data?.itemResults)?.items)) {
      const item = readItem(raw)
      if (item) items.push(item)
    }
  }
  const got = new Set(items.map((x) => x.asin))
  return { items, missing: want.filter((a) => !got.has(a)) }
}

// --- Into the shop -----------------------------------------------------------

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`)

// A shop product made from an Amazon item, or the existing one refreshed
// (the owner's own name, description, category and status are kept).
export function itemToProduct(item: AmazonItem, market: AmazonMarket, id: string, existing?: Product, now = new Date()): Product {
  const keepOwn = !!existing
  const photos = [...(item.image ? [item.image] : []), ...item.images].slice(0, 9).map((src) => ({ src, alt: clip(item.title, 250) }))
  // Selling settings don't apply: Amazon sells it.
  const { buyUrl: _b, track: _t, oversell: _o, options: _op, variants: _v, compareAt: _c, cost: _co, noShipping: _n, soldOut: _s, ...kept } = existing ?? ({} as Partial<Product>)
  return {
    ...kept,
    id,
    name: keepOwn ? existing!.name : clip(item.title, 120),
    price: item.price ?? 0,
    ...(keepOwn && existing!.description ? {} : item.features[0] || item.brand ? { description: clip(item.features[0] ?? `By ${item.brand}`, 160) } : {}),
    ...(keepOwn && existing!.details ? {} : item.features.length ? { details: clip(item.features.join('\n\n'), 5000) } : {}),
    ...(photos[0] ? { image: photos[0] } : {}),
    ...(photos.length > 1 ? { images: photos.slice(1) } : {}),
    status: existing?.status ?? 'active',
    amazon: { asin: item.asin, market, checkedAt: now.toISOString() },
  } as Product
}
