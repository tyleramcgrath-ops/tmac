// Local legal facts for each city hub: courts, bar referral, legal aid,
// population and a photo, researched from official sources.

import data from './data/cities.json'

type Court = { name: string; courthouse?: string | null; address?: string | null; url?: string | null }
export type CityLocal = {
  county: string | null
  countyNote?: string
  stateCourt: Court | null
  smallClaims: { court: string; address?: string | null; url?: string | null } | null
  federalCourt: Court | null
  immigrationCourt: Court | null
  bar: { name: string; url?: string | null; referral?: { name: string; phone?: string | null; url?: string | null } | null } | null
  legalAid: { name: string; url?: string | null; serves?: string }[]
  population: { value: number; year: number; source?: string } | null
  blurb: string | null
  blurbSources?: string[]
  photo: { id: string; pageUrl?: string; photographer?: string; alt: string } | null
}

const CITY_DATA = data as unknown as Record<string, CityLocal>

export const cityLocal = (slug: string): CityLocal | null => CITY_DATA[slug] ?? null

export const unsplash = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?w=${w}&q=${w > 1000 ? 62 : 68}&auto=format&fit=crop`
export const unsplashSet = (id: string, widths = [640, 1080, 1600, 2200]) => widths.map((w) => `${unsplash(id, w)} ${w}w`).join(', ')
