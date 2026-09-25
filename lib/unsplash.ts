// Stock photos from the Unsplash API, so each site gets its own photos
// instead of sharing a fixed set. Free to use (Unsplash License); the API
// asks us to hotlink, credit the photographer and report each use.
//
// Cost control: the Demo tier allows 50 requests an hour, so search results
// are cached for a week per query and a site creation normally makes no
// request at all. Without UNSPLASH_ACCESS_KEY, or on any error, callers fall
// back to the built-in photos in lib/photos.

import { photoKey } from './photo-rules'
import type { Photo, PhotoSet } from './photos'
import type { Store } from './store'

export interface Credit {
  photo: string
  name: string
  url: string
  download?: string
}

export interface FoundPhoto extends Photo {
  credit: Credit
}

const WEEK = 7 * 24 * 3600 * 1000

// What to search for, per kind of business. A few angles each, so there
// are plenty of photos before any repeat.
const QUERIES: Record<string, string[]> = {
  plumber: ['plumber at work', 'plumbing pipes repair', 'bathroom sink faucet', 'water heater'],
  electrician: ['electrician at work', 'electrical panel wiring', 'light switch installation', 'modern home lighting'],
  hvac: ['hvac technician', 'air conditioner unit', 'heating system home', 'ductwork'],
  roofer: ['roofer working', 'roof shingles', 'house roof', 'roof repair'],
  landscaper: ['landscaping garden', 'lawn mowing', 'garden design backyard', 'landscaper at work'],
  cleaner: ['house cleaning', 'clean living room', 'cleaning supplies', 'tidy kitchen'],
  autorepair: ['auto mechanic', 'car repair garage', 'car engine', 'mechanic tools'],
  dentist: ['dentist office', 'dental clinic', 'smiling patient dentist', 'dental care'],
  salon: ['hair salon', 'hairdresser cutting hair', 'salon interior', 'hair styling'],
  lawyer: ['lawyer meeting client', 'law office', 'attorney desk documents', 'signing legal documents', 'courthouse'],
  restaurant: ['restaurant interior', 'chef cooking', 'plated food', 'restaurant table'],
  bakery: ['bakery bread', 'pastries display', 'baker kneading dough', 'coffee and croissant'],
  store: ['small shop interior', 'boutique store', 'shop owner', 'retail display'],
  other: ['small business owner', 'local business storefront', 'team at work', 'workspace'],
}

interface ApiPhoto {
  id: string
  width: number
  height: number
  alt_description: string | null
  description: string | null
  urls: { raw: string }
  links: { download_location: string }
  user: { name: string; links: { html: string } }
}

export function unsplashReady(): boolean {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY)
}

async function api(path: string): Promise<Response> {
  return fetch(`https://api.unsplash.com${path}`, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' },
    signal: AbortSignal.timeout(8000),
  })
}

function toPhoto(p: ApiPhoto, width: number): FoundPhoto | null {
  // Only free photos on the main image host (never Unsplash+).
  if (!p.urls.raw.startsWith('https://images.unsplash.com/photo-')) return null
  const src = `${p.urls.raw}${p.urls.raw.includes('?') ? '&' : '?'}auto=format&fit=crop&q=70&w=${width}`
  const alt = (p.alt_description || p.description || 'Photo').replace(/\s+/g, ' ').trim().slice(0, 200)
  const height = Math.round((width * p.height) / p.width)
  return {
    src,
    alt: alt.charAt(0).toUpperCase() + alt.slice(1),
    width,
    height,
    credit: { photo: photoKey(src), name: p.user.name.slice(0, 120), url: p.user.links.html, download: p.links.download_location },
  }
}

// One search, cached for a week. Landscape only: every slot on a starter
// site is wider than it is tall.
export async function searchPhotos(store: Store, query: string, page = 1): Promise<FoundPhoto[]> {
  if (!unsplashReady()) return []
  const key = `unsplash:${query.toLowerCase().trim()}:${page}`
  const cached = (await store.cacheGet(key, WEEK)) as ApiPhoto[] | null
  let results = cached
  if (!results) {
    try {
      const res = await api(`/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30&orientation=landscape&content_filter=high`)
      if (!res.ok) return []
      results = ((await res.json()) as { results: ApiPhoto[] }).results ?? []
      await store.cacheSet(key, results)
    } catch {
      return []
    }
  }
  return results.map((p) => toPhoto(p, 1600)).filter((p): p is FoundPhoto => p !== null)
}

// A full set for a new site: a hero, three cards and extras for inner pages,
// none of them used by another customer's site. Null when the API isn't
// available or can't supply enough, so the caller uses the built-in set.
export async function photoSetFor(store: Store, type: string, taken: Set<string>, need = 12): Promise<(PhotoSet & { credits: Credit[] }) | null> {
  if (!unsplashReady()) return null
  const queries = QUERIES[type] ?? QUERIES.other
  // One list per search angle, then take from each in turn, so the site
  // doesn't show several near-identical shots.
  const lists: FoundPhoto[][] = []
  for (const q of queries) lists.push(await searchPhotos(store, q))
  const seen = new Set<string>()
  const chosen: FoundPhoto[] = []
  for (let i = 0; chosen.length < need && lists.some((l) => i < l.length); i++) {
    for (const l of lists) {
      const p = l[i]
      if (!p || seen.has(p.credit.photo) || taken.has(p.credit.photo)) continue
      seen.add(p.credit.photo)
      chosen.push(p)
      if (chosen.length >= need) break
    }
  }
  if (chosen.length < 4) return null
  const hero = { ...chosen[0], src: chosen[0].src.replace(/w=1600$/, 'w=2000'), width: 2000, height: Math.round((chosen[0].height * 2000) / 1600) }
  const card = (p: FoundPhoto): Photo => ({ src: p.src.replace(/w=1600$/, 'w=800'), alt: p.alt, width: 800, height: Math.round((p.height * 800) / 1600) })
  const [a, b, c] = [chosen[1], chosen[2] ?? chosen[1], chosen[3] ?? chosen[1]].map(card)
  return {
    hero: { src: hero.src, alt: hero.alt, width: hero.width, height: hero.height },
    cards: [a, b, c],
    extra: chosen.slice(4).map((p) => ({ src: p.src, alt: p.alt, width: p.width, height: p.height })),
    credits: chosen.map((p) => p.credit),
  }
}

// Unsplash asks to be told each time a photo is actually used.
export async function reportUse(credits: Credit[]): Promise<void> {
  if (!unsplashReady()) return
  await Promise.all(
    credits
      .filter((c) => c.download?.startsWith('https://api.unsplash.com/'))
      .map((c) => api(c.download!.replace('https://api.unsplash.com', '')).catch(() => null))
  )
}
