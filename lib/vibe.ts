// The originality check ("vibe check"). Cookie-cutter content is what makes
// big legal and trade website platforms interchangeable, and Google's spam
// policies treat templated, near-duplicate pages as low value. So every
// SaySites page is checked, in plain code (no AI, so it costs nothing):
//
// - Template wording: sentences that are SaySites' own starter copy with a
//   name and town swapped in. Pages that are mostly template stay out of
//   Google (noindex, and out of the sitemap) until they're made original.
// - Thin pages: too few words of the owner's own.
// - Filler: the stock phrases every agency site uses.
// - Keyword stuffing and doorway pages (near-copies of another page on the
//   site): these can't be published at all.
//
// It keeps each site honest and keeps the whole SaySites network free of
// duplicate boilerplate, which is better for every site on it.

import { walk, type Element, type Page, type Site } from './schema'
import { BUSINESS_TYPES, buildStarterSite, type BusinessTypeKey, type Design } from './starter'

export interface Vibe {
  // Share of the page's words that are the owner's own (0-100).
  originality: number
  words: number
  ownWords: number
  templated: string[]
  filler: string[]
  // Spam patterns that block publishing.
  blockers: string[]
  // Whether search engines may index the page.
  indexable: boolean
  // Why it's held back from Google, in plain words.
  held?: string
}

export const MIN_ORIGINAL = 60
export const MIN_OWN_WORDS = 60

// Pages that are useful to visitors but not meant to rank: always indexable
// by this check (their own SEO settings still apply).
const UTILITY = new Set(['contact', 'blog', 'shop', 'privacy', 'privacy-policy', 'terms'])

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function elementText(el: Element): string[] {
  switch (el.type) {
    case 'heading':
    case 'text':
      return [el.text]
    case 'faq':
      return el.items.flatMap((i) => [i.question, i.answer])
    case 'testimonials':
      return el.items.map((i) => i.quote)
    case 'gallery':
      return el.images.map((i) => i.caption ?? '').filter(Boolean)
    default:
      return []
  }
}

export function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' \n ')
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.replace(/^[•\-–]\s*/, '').trim())
    .filter((s) => s.split(/\s+/).length >= 4)
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length

// ---------------------------------------------------------------------------
// SaySites' own template wording, as patterns with the name, town and
// services left open.
// ---------------------------------------------------------------------------

const SLOT = '⟦'
let templates: RegExp[] | null = null

function templatePatterns(): RegExp[] {
  if (templates) return templates
  const seen = new Set<string>()
  const out: RegExp[] = []
  const designs: (Design | undefined)[] = [undefined, 'bold', 'editorial', 'warm']
  for (const type of Object.keys(BUSINESS_TYPES) as BusinessTypeKey[]) {
    for (const design of designs) {
      for (const services of [[`${SLOT}S1${SLOT}`, `${SLOT}S2${SLOT}`, `${SLOT}S3${SLOT}`, `${SLOT}S4${SLOT}`], []]) {
        const { site, pages } = buildStarterSite(
          { name: `${SLOT}N${SLOT}`, type, city: `${SLOT}C${SLOT}`, region: `${SLOT}R${SLOT}`, phone: `${SLOT}P${SLOT}`, services, palette: 'ocean', ...(design ? { design } : {}) },
          'org_t',
          'template',
          { siteId: 'template', now: '2026-01-01T00:00:00.000Z' }
        )
        const texts = [site.tagline ?? '', site.footerNote ?? '', ...pages.flatMap((p) => [...walk(p.body)].flatMap(elementText))]
        for (const t of texts)
          for (const s of sentences(t)) {
            if (seen.has(s)) continue
            seen.add(s)
            // Mostly slots ("⟦N⟧ in ⟦C⟧, ⟦R⟧.") isn't wording worth matching.
            const plain = s.replace(new RegExp(`${SLOT}[A-Z0-9]+${SLOT}`, 'g'), '').trim()
            if (words(plain) < 4) continue
            const src = s
              .split(new RegExp(`${SLOT}[A-Z0-9]+${SLOT}`))
              .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              .join('.{1,160}?')
            out.push(new RegExp(`^${src}$`, 'i'))
          }
      }
    }
  }
  templates = out
  return out
}

export function isTemplate(sentence: string): boolean {
  return templatePatterns().some((re) => re.test(sentence))
}

// ---------------------------------------------------------------------------
// Filler and stuffing
// ---------------------------------------------------------------------------

const FILLER = [
  /look no further/i, /one[- ]stop[- ]shop/i, /second to none/i, /top[- ]notch/i, /unparalleled/i, /in today['’]s fast[- ]paced/i,
  /we pride ourselves/i, /committed to (providing|delivering) (the )?(highest|best)/i, /state[- ]of[- ]the[- ]art/i, /best in the business/i,
  /your satisfaction is our (top )?priority/i, /customer satisfaction is our/i, /don['’]t hesitate to (contact|call|reach)/i, /tailored to (meet )?your (unique )?needs/i,
  /cutting[- ]edge/i, /world[- ]class/i, /go(es)? above and beyond/i, /we['’]ve got you covered/i, /your trusted partner/i, /(peace of mind|rest assured) knowing/i,
  /the best (plumber|lawyer|attorney|dentist|electrician|roofer|contractor)s? in/i, /#1 /i, /number one (choice|provider)/i,
  // Phrases that give away AI-written copy.
  /\belevat(e|es|ing)\b/i, /\bunlock (your|the)\b/i, /\bseamless(ly)?\b/i, /\bdelv(e|es|ing)\b/i, /\bembark\b/i, /\bnestled\b/i,
  /in the heart of/i, /\ba testament to\b/i, /\btapestry\b/i, /whether you['’]re .{3,60} or /i,
]

export function fillerIn(sentence: string): boolean {
  return FILLER.some((re) => re.test(sentence))
}

// Keyword stuffing, as Google describes it: a place-and-service phrase
// ("Dayton plumber", "plumber in Dayton") repeated until it reads unnaturally.
// Only phrases that include one of the business's places count, so a guide
// that naturally says "water heater" a lot is fine.
const STOP = new Set(['the', 'and', 'a', 'an', 'to', 'of', 'in', 'for', 'you', 'your', 'we', 'our', 'is', 'are', 'with', 'on', 'it', 'that', 'this', 'or', 'can', 'be', 'at', 'as', 'if', 'll', 're', 've', 's', 'd', 'near', 'me', 'by', 'from'])
export function stuffing(text: string, places: string[]): string | null {
  const w = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const where = places.map((p) => p.toLowerCase().trim()).filter((p) => p.length >= 3)
  if (w.length < 60 || !where.length) return null
  let worst: [string, number] | null = null
  for (const n of [2, 3, 4]) {
    const count = new Map<string, number>()
    for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n)
      if (STOP.has(g[0]) || STOP.has(g[n - 1]) || g.filter((x) => !STOP.has(x)).length < 2) continue
      const key = g.join(' ')
      if (!where.some((p) => ` ${key} `.includes(` ${p} `))) continue
      count.set(key, (count.get(key) ?? 0) + 1)
    }
    for (const [k, c] of count) if (c >= 6 && (c * n) / w.length > 0.04 && (!worst || c * n > worst[1])) worst = [k, c * n]
  }
  return worst ? worst[0] : null
}

// Near-duplicate pages ("doorway" pages that swap a town name): the share
// of 5-word runs two pages have in common.
function shingles(text: string): Set<string> {
  const w = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const out = new Set<string>()
  for (let i = 0; i + 5 <= w.length; i++) out.add(w.slice(i, i + 5).join(' '))
  return out
}
export function similarity(a: string, b: string): number {
  const x = shingles(a), y = shingles(b)
  if (x.size < 20 || y.size < 20) return 0
  let common = 0
  for (const s of x) if (y.has(s)) common++
  return common / Math.min(x.size, y.size)
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

export function pageText(page: Page): string {
  return [...walk(page.body)].flatMap(elementText).join('\n')
}

export function vibeCheck(site: Site, page: Page, pages: readonly Page[]): Vibe {
  const text = pageText(page)
  const all = sentences(text)
  const templated = all.filter(isTemplate)
  const filler = all.filter((s) => !templated.includes(s) && fillerIn(s))
  const total = all.reduce((n, s) => n + words(s), 0)
  const templatedWords = templated.reduce((n, s) => n + words(s), 0)
  const ownWords = total - templatedWords
  const originality = total ? Math.round((ownWords / total) * 100) : 0
  const blockers: string[] = []
  const b = site.business
  const places = [b.address?.city, b.address?.region, ...(b.area ?? '').split(',')].filter((x): x is string => !!x)
  const stuffed = stuffing(text, places)
  if (stuffed) blockers.push(`“${stuffed}” is repeated so often it reads as keyword stuffing. Say it naturally, once or twice.`)
  if (page.slug && !page.post) {
    for (const other of pages) {
      if (other.id === page.id || other.status !== 'published' || !other.slug) continue
      if (similarity(text, pageText(other)) >= 0.7) {
        blockers.push(`This page is nearly the same as /${other.slug}. Near-copies (like the same page for different towns) are treated as spam by Google. Merge them, or make each one genuinely different.`)
        break
      }
    }
  }
  const utility = UTILITY.has(page.slug) || !!page.seo.noindex
  let held: string | undefined
  if (!utility) {
    if (blockers.length) held = 'It has a problem that has to be fixed first.'
    else if (total > 0 && originality < MIN_ORIGINAL) held = `Most of its wording is SaySites’ starter text (${100 - originality}%). Put it in your own words so it stands apart.`
    else if (ownWords < MIN_OWN_WORDS && !page.post) held = 'There isn’t enough of your own writing on it yet.'
    else if (filler.length >= 3) held = 'It leans on stock phrases every other site uses. Say what’s actually true of your business instead.'
  }
  return { originality, words: total, ownWords, templated, filler, blockers, indexable: !held, ...(held ? { held } : {}) }
}

// Every page on a site, for the dashboard and the publish gate.
export function vibeForSite(site: Site, pages: readonly Page[]): Map<string, Vibe> {
  const live = pages.filter((p) => p.status === 'published')
  return new Map(pages.map((p) => [p.id, vibeCheck(site, p, live)]))
}
