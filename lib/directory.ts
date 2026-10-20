// Reads the attorney directory from the existing LawMatchNow PocketBase API,
// on the server, so every listing is in the HTML that crawlers receive.
// Admin, imports and claims keep working in PocketBase (/_/) as before.

import { unstable_cache } from 'next/cache'
import { PRACTICE_AREAS } from './content/practice-areas'
import { CITIES, stateByCode, slugify } from './geo'

const API = (process.env.LMN_API_URL || 'https://lawmatchnow.com').replace(/\/$/, '')
const REVALIDATE = 3600

// About 99% of the records imported so far carry made-up (555) phone numbers.
// They stay hidden from visitors and search engines until real data replaces
// them. Set SHOW_PLACEHOLDER_LISTINGS=1 only for local testing.
const HIDE_PLACEHOLDERS = process.env.SHOW_PLACEHOLDER_LISTINGS !== '1'
// The rating and review counts in the database have no recorded source, so
// they aren't shown until reviews are collected and verified on the site.
export const SHOW_RATINGS = process.env.SHOW_UNVERIFIED_RATINGS === '1'

export type Attorney = {
  id: string
  slug: string
  name: string
  firm: string
  bio: string
  city: string
  state: string
  zip: string
  address: string
  phone: string
  website: string
  photo: string
  practiceSlugs: string[]
  yearsExperience: number | null
  education: string
  barAdmissions: string
  languages: string
  consultation: string
  claimed: boolean
  tier: 'free' | 'gold' | 'platinum'
  rating: number | null
  reviewsCount: number
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  author: string
  created: string
  updated: string
}

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const q = (v: string) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

type Page<T> = { items: T[]; totalItems: number; totalPages: number }

// Cached for an hour. Failures throw inside the cache so they're never
// stored: the API host sometimes answers with an anti-bot page (HTML, 202)
// instead of JSON, and caching that would blank listings for an hour.
const cachedGet = unstable_cache(
  async (url: string) => {
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': 'LawMatchNow-Site/1.0' } })
    if (res.status !== 200 || !res.headers.get('content-type')?.includes('json')) throw new Error(`HTTP ${res.status} ${res.headers.get('content-type')}`)
    return (await res.json()) as Page<Raw>
  },
  ['lmn-pb'],
  { revalidate: REVALIDATE },
)

async function pb(path: string, params: Record<string, string>): Promise<Page<Raw>> {
  const url = `${API}/api/collections/${path}/records?${new URLSearchParams(params)}`
  try {
    return await cachedGet(url)
  } catch (err) {
    console.error(`[directory] ${path} failed:`, (err as Error).message)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// PocketBase stores practice areas as record ids; the site uses slugs.
let practiceIds: Promise<Map<string, string>> | null = null
function practiceIdMap() {
  practiceIds ??= pb('practice_areas', { perPage: '200', fields: 'id,slug' }).then((r) => {
    if (!r.items.length) practiceIds = null
    return new Map(r.items.map((p) => [str(p.id), str(p.slug)]))
  })
  return practiceIds
}

async function toAttorney(r: Raw): Promise<Attorney> {
  const ids = await practiceIdMap()
  const known = new Set(PRACTICE_AREAS.map((p) => p.slug))
  const tier = str(r.tier)
  const photo = str(r.photo)
  return {
    id: str(r.id),
    slug: str(r.slug),
    name: str(r.name),
    firm: str(r.firm_name) || str(r.law_firm),
    bio: str(r.bio),
    city: str(r.city),
    state: str(r.state_code).toUpperCase(),
    zip: str(r.zip_code),
    address: str(r.address),
    phone: str(r.phone),
    website: str(r.website),
    photo: photo && !photo.startsWith('http') ? `${API}/api/files/attorneys/${str(r.id)}/${photo}` : photo,
    practiceSlugs: (Array.isArray(r.practice_areas) ? r.practice_areas : [])
      .map((id) => ids.get(String(id)) ?? '')
      .filter((s) => known.has(s)),
    yearsExperience: num(r.years_experience),
    education: str(r.education),
    barAdmissions: str(r.bar_admissions),
    languages: str(r.languages),
    consultation: str(r.consultation_availability),
    claimed: r.is_claimed === true,
    tier: tier === 'platinum' || tier === 'gold' ? tier : 'free',
    rating: SHOW_RATINGS ? num(r.rating) : null,
    reviewsCount: SHOW_RATINGS ? num(r.reviews_count) ?? 0 : 0,
  }
}

const QUALITY = HIDE_PLACEHOLDERS ? ["phone !~ '555-'"] : []

export type AttorneyQuery = {
  practice?: string
  city?: string
  state?: string
  text?: string
  page?: number
  perPage?: number
}

export async function searchAttorneys(query: AttorneyQuery) {
  const parts = [...QUALITY]
  if (query.practice) {
    const ids = await practiceIdMap()
    const id = [...ids].find(([, slug]) => slug === query.practice)?.[0]
    if (!id) return { items: [] as Attorney[], total: 0, pages: 0 }
    parts.push(`practice_areas ~ ${q(id)}`)
  }
  if (query.city) parts.push(`city = ${q(query.city)}`)
  if (query.state) parts.push(`state_code = ${q(query.state.toUpperCase())}`)
  if (query.text) {
    const t = q(query.text.slice(0, 80))
    parts.push(`(name ~ ${t} || firm_name ~ ${t})`)
  }
  const perPage = Math.min(query.perPage ?? 20, 50)
  const res = await pb('attorneys', {
    page: String(Math.max(1, query.page ?? 1)),
    perPage: String(perPage),
    filter: parts.join(' && '),
    sort: '-tier_priority,-is_claimed,name',
  })
  return { items: await Promise.all(res.items.map(toAttorney)), total: res.totalItems, pages: res.totalPages }
}

export async function getAttorney(slug: string): Promise<Attorney | null> {
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return null
  const res = await pb('attorneys', { perPage: '1', filter: [`slug = ${q(slug)}`, ...QUALITY].join(' && ') })
  return res.items[0] ? toAttorney(res.items[0]) : null
}

/** Slugs for the sitemap, newest first. */
export async function attorneySlugs(limit = 5000) {
  const res = await pb('attorneys', {
    perPage: String(Math.min(limit, 500)),
    fields: 'slug,updated',
    filter: QUALITY.join(' && '),
    sort: '-updated',
  })
  return res.items.map((r) => ({ slug: str(r.slug), updated: str(r.updated) }))
}

function toPost(r: Raw): BlogPost {
  const content = str(r.content)
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return {
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    excerpt: str(r.excerpt) || (text.length > 180 ? `${text.slice(0, 177).replace(/\s\S*$/, '')}…` : text),
    content,
    category: str(r.category),
    author: str(r.author),
    created: str(r.created),
    updated: str(r.updated),
  }
}

export async function listPosts(page = 1, perPage = 12) {
  const res = await pb('blog_posts', { page: String(page), perPage: String(perPage), sort: '-created' })
  return { items: res.items.map(toPost), pages: res.totalPages, total: res.totalItems }
}

export async function getPost(slug: string) {
  if (!/^[a-z0-9-]{2,160}$/.test(slug)) return null
  const res = await pb('blog_posts', { perPage: '1', filter: `slug = ${q(slug)}` })
  return res.items[0] ? toPost(res.items[0]) : null
}

/** City hub for an attorney's city, when we have one. */
export const cityHubFor = (a: Attorney) =>
  CITIES.find((c) => c.state === a.state && slugify(c.name) === slugify(a.city))

export const locationLabel = (a: Attorney) =>
  [a.city, stateByCode(a.state)?.code ?? a.state].filter(Boolean).join(', ')
