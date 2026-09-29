'use server'

import { placeDetails, placesReady, searchPlaces, type PlaceDetails, type PlaceMatch } from '@/lib/places'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { dayString } from '@/lib/visits'

// Each lookup costs a little on Google's side, so each account gets a
// generous but firm number per day.
const DAILY_LOOKUPS = 30

async function allowed(userId: string): Promise<boolean> {
  const store = getStore()
  const key = `places:${userId}:${dayString(new Date())}`
  const used = Number((await store.cacheGet(key, 36 * 3600_000)) ?? 0)
  if (used >= DAILY_LOOKUPS) return false
  await store.cacheSet(key, used + 1)
  return true
}

export type GoogleSearchResult = { matches?: PlaceMatch[]; error?: string }
export type GooglePickResult = { place?: PlaceDetails; error?: string }

export async function findOnGoogle(query: string): Promise<GoogleSearchResult> {
  const user = await requireUser()
  if (!placesReady()) return { error: 'Google lookups aren’t switched on yet.' }
  if (!(await allowed(user.id))) return { error: 'That’s a lot of searches for today. Fill in the details yourself, or try again tomorrow.' }
  try {
    const matches = await searchPlaces(query)
    return matches.length ? { matches } : { error: 'Nothing found. Try your business name and town, like “Rosie’s Bakery Portland”.' }
  } catch {
    return { error: 'Google didn’t answer just now. Try again, or fill in the details yourself.' }
  }
}

export async function pickFromGoogle(id: string): Promise<GooglePickResult> {
  const user = await requireUser()
  if (!placesReady()) return { error: 'Google lookups aren’t switched on yet.' }
  if (!(await allowed(user.id))) return { error: 'That’s a lot of lookups for today. Fill in the details yourself, or try again tomorrow.' }
  try {
    return { place: await placeDetails(id) }
  } catch {
    return { error: 'We couldn’t read that listing. Try again, or fill in the details yourself.' }
  }
}
