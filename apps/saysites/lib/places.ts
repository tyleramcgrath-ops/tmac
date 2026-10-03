// Starting a site from the owner's Google Business Profile, through Google's
// official Places API (New). The owner searches for their business, picks
// their listing, and the new-site form fills in with what Google already
// knows: name, kind of business, address, phone and opening hours. Nothing
// is guessed, and the owner can change every field before building.
//
// Off until GOOGLE_PLACES_API_KEY is set in the Vercel project.

import { BUSINESS_TYPES, type BusinessTypeKey } from './starter'
import { DAYS, closedWeek, fromWeek, type WeekHours } from './hours'

const API = 'https://places.googleapis.com/v1'

export function placesReady(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY)
}

export interface PlaceMatch {
  id: string
  name: string
  address: string
}

export interface PlaceDetails {
  placeId: string
  name: string
  type: BusinessTypeKey
  city: string
  region: string
  street?: string
  postalCode?: string
  phone?: string
  website?: string
  hours: string[]
  summary?: string
  rating?: number
  reviewCount?: number
}

type Fetch = typeof fetch

async function call<T>(path: string, init: RequestInit, fields: string, f: Fetch): Promise<T> {
  const res = await f(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY ?? '', 'X-Goog-FieldMask': fields, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Places API ${res.status}`)
  return (await res.json()) as T
}

// Up to five listings for "Rosie's Bakery Portland".
export async function searchPlaces(query: string, f: Fetch = fetch): Promise<PlaceMatch[]> {
  const q = query.trim().slice(0, 120)
  if (q.length < 3) return []
  const data = await call<{ places?: { id: string; displayName?: { text?: string }; formattedAddress?: string }[] }>(
    '/places:searchText',
    { method: 'POST', body: JSON.stringify({ textQuery: q, pageSize: 5 }) },
    'places.id,places.displayName,places.formattedAddress',
    f,
  )
  return (data.places ?? []).filter((p) => p.id && p.displayName?.text).map((p) => ({ id: p.id, name: p.displayName!.text!, address: p.formattedAddress ?? '' }))
}

interface RawPlace {
  id?: string
  displayName?: { text?: string }
  primaryType?: string
  types?: string[]
  postalAddress?: { locality?: string; administrativeArea?: string; postalCode?: string; addressLines?: string[] }
  nationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: { periods?: { open?: { day?: number; hour?: number; minute?: number }; close?: { day?: number; hour?: number; minute?: number } }[] }
  editorialSummary?: { text?: string }
  rating?: number
  userRatingCount?: number
}

export async function placeDetails(id: string, f: Fetch = fetch): Promise<PlaceDetails> {
  if (!/^[\w-]{10,300}$/.test(id)) throw new Error('Not a place id')
  const p = await call<RawPlace>(
    `/places/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'id,displayName,primaryType,types,postalAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,editorialSummary,rating,userRatingCount',
    f,
  )
  return toDetails(p, id)
}

export function toDetails(p: RawPlace, id: string): PlaceDetails {
  const a = p.postalAddress ?? {}
  return {
    placeId: p.id ?? id,
    name: (p.displayName?.text ?? '').slice(0, 120),
    type: typeFromGoogle([p.primaryType ?? '', ...(p.types ?? [])]),
    city: (a.locality ?? '').slice(0, 60),
    region: (a.administrativeArea ?? '').slice(0, 40),
    ...(a.addressLines?.[0] ? { street: a.addressLines[0].slice(0, 120) } : {}),
    ...(a.postalCode ? { postalCode: a.postalCode.slice(0, 20) } : {}),
    ...(p.nationalPhoneNumber ? { phone: p.nationalPhoneNumber.slice(0, 30) } : {}),
    ...(p.websiteUri ? { website: p.websiteUri } : {}),
    hours: hoursFromPeriods(p.regularOpeningHours?.periods ?? []),
    ...(p.editorialSummary?.text ? { summary: p.editorialSummary.text.slice(0, 300) } : {}),
    ...(typeof p.rating === 'number' ? { rating: p.rating } : {}),
    ...(typeof p.userRatingCount === 'number' ? { reviewCount: p.userRatingCount } : {}),
  }
}

// Google's categories ("hair_salon", "italian_restaurant") to ours.
const MATCHES: [RegExp, BusinessTypeKey][] = [
  [/plumb/, 'plumber'],
  [/electric/, 'electrician'],
  [/hvac|heating|air_condition/, 'hvac'],
  [/roof/, 'roofer'],
  [/landscap|lawn|garden|tree_service/, 'landscaper'],
  [/clean|maid|janitor/, 'cleaner'],
  [/car_repair|auto|mechanic|tire|body_shop/, 'autorepair'],
  [/dent|orthodont/, 'dentist'],
  [/doctor|physician|medical_clinic|hospital|medical_center/, 'doctor'],
  [/medical_spa|skin_care_clinic/, 'medspa'],
  [/hair|barber|beauty|nail|salon|spa/, 'salon'],
  [/lawyer|attorney|legal|law_firm/, 'lawyer'],
  [/bakery|cafe|coffee|pastry|donut|dessert/, 'bakery'],
  [/restaurant|bar\b|pub|pizza|food|diner|bistro|grill/, 'restaurant'],
  [/store|shop|boutique|florist/, 'store'],
]

export function typeFromGoogle(types: string[]): BusinessTypeKey {
  for (const t of types.filter(Boolean)) for (const [re, key] of MATCHES) if (re.test(t) && key in BUSINESS_TYPES) return key
  return 'other'
}

// Google counts days from Sunday (0). A day's hours run from its earliest
// opening to its latest closing; closing at or after midnight shows as 23:59.
export function hoursFromPeriods(periods: NonNullable<RawPlace['regularOpeningHours']>['periods'] = []): string[] {
  const week: WeekHours = closedWeek()
  const t = (h = 0, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  for (const p of periods) {
    if (p.open?.day === undefined) continue
    const day = DAYS[(p.open.day + 6) % 7]
    // Open all day: one period with no close.
    if (!p.close) {
      week[day] = { open: '00:00', close: '23:59' }
      continue
    }
    const open = t(p.open.hour, p.open.minute)
    // Closing after midnight (a bar open until 1am) shows as open until 23:59.
    const close = p.close.day !== p.open.day ? '23:59' : t(p.close.hour, p.close.minute)
    const had = week[day]
    week[day] = had ? { open: had.open < open ? had.open : open, close: had.close > close ? had.close : close } : { open, close }
  }
  return fromWeek(week)
}
