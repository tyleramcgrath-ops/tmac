// Works out who a business is from its current website's home page: the
// structured data many sites already publish for Google, then the page's own
// signals (site name, phone links, a "City, ST 12345" address). No AI, so a
// preview costs nothing but a few page reads.

import { decode } from './importer'
import { BUSINESS_TYPES, PALETTES, type BusinessTypeKey } from './starter'

export interface Detected {
  name: string
  type: BusinessTypeKey
  phone?: string
  email?: string
  street?: string
  city?: string
  region?: string
  postalCode?: string
  hours?: string[]
  logo?: string
  color?: string
  palette: keyof typeof PALETTES
  sameAs?: string[]
}

type Json = Record<string, unknown>

function jsonLd(html: string): Json[] {
  const out: Json[] = []
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim())
      const walk = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(walk)
        else if (v && typeof v === 'object') {
          out.push(v as Json)
          if ('@graph' in (v as Json)) walk((v as Json)['@graph'])
        }
      }
      walk(data)
    } catch {}
  }
  return out
}

const BUSINESSY = /LocalBusiness|LegalService|Attorney|Plumber|Electrician|HVACBusiness|RoofingContractor|Contractor|HomeAndConstructionBusiness|LandscapingBusiness|HousekeepingService|AutoRepair|AutomotiveBusiness|Dentist|MedicalBusiness|HairSalon|BeautySalon|Restaurant|Bakery|CafeOrCoffeeShop|FoodEstablishment|Store|ProfessionalService|Organization/
const str = (v: unknown) => (typeof v === 'string' ? decode(v).trim() : Array.isArray(v) && typeof v[0] === 'string' ? decode(v[0]).trim() : '')

// Keyword guesses for the kind of business, most specific first.
const TYPE_WORDS: [BusinessTypeKey, RegExp][] = [
  ['lawyer', /\b(attorneys?|lawyers?|law (firm|office|group)|legal services?|esq\.?)\b/i],
  ['dentist', /\b(dentists?|dental|orthodont\w*)\b/i],
  ['plumber', /\b(plumb\w*|drain cleaning|water heaters?)\b/i],
  ['electrician', /\b(electricians?|electrical (contractor|services?))\b/i],
  ['hvac', /\b(hvac|heating (and|&) (air|cooling)|air condition\w*|furnace)\b/i],
  ['roofer', /\b(roof\w*)\b/i],
  ['landscaper', /\b(landscap\w*|lawn care|hardscap\w*)\b/i],
  ['cleaner', /\b(cleaning (service|company)s?|maid|janitorial|house cleaning)\b/i],
  ['autorepair', /\b(auto repair|mechanics?|collision|brake|transmission)\b/i],
  ['salon', /\b(hair salon|salon|barber\w*|stylists?)\b/i],
  ['bakery', /\b(bakery|bakeries|bake shop|pastr\w*|cafe|café|coffee)\b/i],
  ['restaurant', /\b(restaurant|bistro|grill|kitchen|dining|pizzeria|tavern)\b/i],
  ['store', /\b(shop|boutique|store)\b/i],
]
const SCHEMA_TYPE: Record<string, BusinessTypeKey> = {
  LegalService: 'lawyer', Attorney: 'lawyer', Dentist: 'dentist', Plumber: 'plumber', Electrician: 'electrician', HVACBusiness: 'hvac', RoofingContractor: 'roofer',
  LandscapingBusiness: 'landscaper', HousekeepingService: 'cleaner', AutoRepair: 'autorepair', HairSalon: 'salon', BeautySalon: 'salon', Bakery: 'bakery',
  CafeOrCoffeeShop: 'bakery', Restaurant: 'restaurant', Store: 'store',
}

export function guessType(text: string): BusinessTypeKey {
  for (const [type, re] of TYPE_WORDS) if (re.test(text)) return type
  return 'other'
}

// The palette whose primary colour is closest in hue to the brand's.
function hue(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: h * 60, s, l }
}
export function nearestPalette(hex?: string): keyof typeof PALETTES {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 'ocean'
  const c = hue(hex)
  if (c.s < 0.15) return 'slate'
  let best: keyof typeof PALETTES = 'ocean', dist = Infinity
  for (const [k, p] of Object.entries(PALETTES)) {
    const q = hue(p.colors.primary)
    const d = Math.min(Math.abs(c.h - q.h), 360 - Math.abs(c.h - q.h))
    if (q.s >= 0.15 && d < dist) (dist = d), (best = k)
  }
  return best
}

// The brand colour: theme-color if set, else the most used saturated colour
// in the page's own styles.
function brandColor(html: string): string | undefined {
  const theme = html.match(/<meta[^>]*name\s*=\s*["']theme-color["'][^>]*content\s*=\s*["'](#[0-9a-f]{6})["']/i)?.[1]
  if (theme && hue(theme).s > 0.15) return theme.toLowerCase()
  const count = new Map<string, number>()
  for (const m of html.matchAll(/#([0-9a-f]{6})\b/gi)) {
    const c = `#${m[1].toLowerCase()}`
    const { s, l } = hue(c)
    if (s > 0.25 && l > 0.12 && l < 0.7) count.set(c, (count.get(c) ?? 0) + 1)
  }
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0]
}

function absolute(src: string, base: string): string | undefined {
  try {
    const u = new URL(decode(src), base)
    return u.protocol === 'https:' ? u.href : undefined
  } catch {
    return undefined
  }
}

export function detectBusiness(html: string, url: string): Detected {
  const ld = jsonLd(html)
  const biz = ld.find((o) => BUSINESSY.test(String(o['@type'] ?? '')) && !/Organization/.test(String(o['@type'])) && str(o.name)) ?? ld.find((o) => BUSINESSY.test(String(o['@type'] ?? '')) && str(o.name))
  const addr = (biz?.address && typeof biz.address === 'object' ? (Array.isArray(biz.address) ? biz.address[0] : biz.address) : {}) as Json
  const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ')
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
  const siteName = decode(html.match(/<meta[^>]*property\s*=\s*["']og:site_name["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').trim()
  const titleBrand = title.split(/\s[|\-–—]\s/).filter(Boolean)
  const name = (str(biz?.name) || siteName || (titleBrand.length > 1 ? titleBrand[titleBrand.length - 1] : titleBrand[0]) || new URL(url).hostname.replace(/^www\./, '')).slice(0, 120)

  const tel = str(biz?.telephone) || decode(html.match(/href\s*=\s*["']tel:([^"']+)["']/i)?.[1] ?? '').trim() || text.match(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/)?.[0] || ''
  const email = str(biz?.email).replace(/^mailto:/, '') || decode(html.match(/href\s*=\s*["']mailto:([^"'?]+)/i)?.[1] ?? '').trim()
  let city = str(addr.addressLocality)
  let region = str(addr.addressRegion)
  let postalCode = str(addr.postalCode)
  const street = str(addr.streetAddress)
  if (!city) {
    const m = text.match(/\b([A-Z][a-zA-Z.]+(?: [A-Z][a-zA-Z.]+){0,2}),\s*([A-Z]{2})\s+(\d{5})\b/)
    if (m) [city, region, postalCode] = [m[1], m[2], m[3]]
  }
  const schemaType = String(biz?.['@type'] ?? '').split(/[\s,]/).map((t) => SCHEMA_TYPE[t]).find(Boolean)
  const description = decode(html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i)?.[1] ?? '')
  const h1 = decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '').replace(/<[^>]+>/g, ''))
  const type = schemaType ?? guessType(`${name} ${title} ${description} ${h1}`)
  const logoSrc =
    (typeof biz?.logo === 'string' ? biz.logo : str((biz?.logo as Json | undefined)?.url)) ||
    html.match(/<img[^>]*(?:class|id|alt|src)\s*=\s*["'][^"']*logo[^"']*["'][^>]*>/i)?.[0].match(/\ssrc\s*=\s*["']([^"']+)["']/i)?.[1] ||
    ''
  const color = brandColor(html)
  const hours = Array.isArray(biz?.openingHours) ? (biz.openingHours as unknown[]).filter((h): h is string => typeof h === 'string' && /^(Mo|Tu|We|Th|Fr|Sa|Su)/.test(h)).slice(0, 7) : undefined
  return {
    name,
    type,
    ...(tel ? { phone: tel.slice(0, 30) } : {}),
    ...(email && /@/.test(email) ? { email: email.slice(0, 120) } : {}),
    ...(street ? { street: street.slice(0, 120) } : {}),
    ...(city ? { city: city.slice(0, 60) } : {}),
    ...(region ? { region: region.slice(0, 40) } : {}),
    ...(postalCode ? { postalCode: postalCode.slice(0, 12) } : {}),
    ...(hours?.length ? { hours } : {}),
    // Light or white logo versions are made for dark headers; SaySites'
    // header is light, so those would vanish. The name shows instead.
    ...(logoSrc && absolute(logoSrc, url) && !/(light|white|reverse|inverse)[-_.]?(logo)?/i.test(logoSrc) ? { logo: absolute(logoSrc, url) } : {}),
    ...(color ? { color } : {}),
    palette: nearestPalette(color),
    ...(Array.isArray(biz?.sameAs) ? { sameAs: (biz.sameAs as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 6) } : {}),
  }
}

export const typeLabel = (t: BusinessTypeKey) => BUSINESS_TYPES[t].label
