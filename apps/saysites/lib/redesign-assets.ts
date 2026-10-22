// What makes a firm's own site convincing, read from it so the redesign can
// use the real thing instead of stock: their photos (people first), their
// published results, their clients' reviews, their award badges and logo.
// Only what their pages show; nothing is guessed or made up.

import { ancestors, findAll, isEl, parseHtml, textOf, type El } from './dom'
import { decode } from './importer'

export interface SitePhoto {
  src: string
  alt: string
  // A person or people (attorneys, the team): what clients want to see.
  people: boolean
  // Roughly how big it is on their site (width in px, when known).
  width: number
  height?: number
  // Their home page's banner (set as a background).
  banner?: boolean
  score: number
}
export interface SiteAssets {
  logo?: string
  photos: SitePhoto[]
  // Head-and-shoulders photos of named people (their attorneys).
  // home: shown on their home page (the person the firm leads with).
  portraits: { src: string; name: string; role?: string; home?: boolean }[]
  results: { amount: string; label: string }[]
  reviews: { quote: string; name: string }[]
  badges: { src: string; alt: string }[]
}

const NOT_PHOTO = /logo|icon|sprite|avatar-default|placeholder|blank|spacer|pixel|loader|arrow|emoji|gravatar|badge|seal|award|rating|bbb|avvo|super-?lawyers|martindale|best-?lawyers|expertise|justia|lawyers?-com|million-dollar|national-trial|fb\.|facebook|twitter|linkedin|instagram|youtube|google|yelp|flag|map|marker|\.svg(\?|$)|\.gif(\?|$)/i
const BADGE = /award|badge|seal|rating|bbb|avvo|super-?\s?lawyers|martindale|best-?\s?lawyers|expertise|million[- ]dollar|multi[- ]million|national[- ]trial|top[- ]?\d+|rising[- ]stars|preeminent|av-?rated|america'?s top|elite|forum|abota|naela|aaj|association|member|accredited|chambers|lawdragon|nadc|nacdl|10\.0|top 100/i
const PEOPLE = /(^|[-_/])team[-_.]|portrait|headshot|staff|partners?[-_]|founders?|esq|paralegal|our-people|group-?photo|dr-|owner/i
const NOT_NAME = /\b(law|laws|lawyers?|attorneys?|firm|injur(y|ies)|accidents?|criminal|defen[cs]e|county|city|vehicle|civil|rights|products?|liability|medical|malpractice|premises|wrongful|conviction|police|brutality|nursing|home|estate|planning|family|probate|child|custody|support|contact|us|property|division|news|team|about|practice|areas?|services?|divorce|trusts?|wills?|business|real|insurance|claims?|crimes?|charges|dui|dwi|truck|car|motorcycle|bus|train|pedestrian|bicycle|slip|fall|dog|bites?|workers|compensation|social|security|disability|immigration|bankruptcy|employment|tax|elder|guardianship|litigation|administration|consultation|free|call|today|office|offices|reviews?|testimonials?|results?|case|cases|welcome|meet|our|the)\b/i
const NAMED = /^(?:(?:dr|mr|ms|mrs)\.?\s)?[A-Z][a-z'’-]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-zA-Z'’-]+){1,2}(?:,?\s*(?:Esq(?:uire)?|Jr|Sr|III|II|J\.?D)\.?)?$/
// "photo-1920.jpg", "photo-tablet.jpg" and "photo-mob.webp" are one photo.
const stem = (src: string) => src.replace(/[?#].*$/, '').replace(/([-_](\d{3,4}w?|\d{2,4}x\d{2,4}|mobile|mob|tablet|desktop|small|large|lg|sm|md|xl|scaled|\d))+(?=\.\w+$)/gi, '').replace(/\.\w+$/, '')

function srcOf(el: El, base: string): { src: string; width: number; height?: number } | undefined {
  const set = el.attrs['data-srcset'] || el.attrs.srcset || el.attrs['data-lazy-srcset'] || ''
  const best = set
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter((p) => p[0] && /^\d+w$/.test(p[1] ?? ''))
    .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))[0]
  const raw = best?.[0] || el.attrs['data-lazy-src'] || el.attrs['data-src'] || el.attrs['data-original'] || (el.attrs.src?.startsWith('data:') ? '' : el.attrs.src) || ''
  if (!raw) return undefined
  try {
    const u = new URL(decode(raw), base)
    if (u.protocol === 'http:') u.protocol = 'https:'
    if (u.protocol !== 'https:') return undefined
    const fromName = u.pathname.match(/-(\d{3,4})x(\d{3,4})\.\w+$/)
    const width = best ? parseInt(best[1]) : Number(el.attrs.width) || (fromName ? Number(fromName[1]) : 0)
    const h = Number(el.attrs.height) || (fromName ? Number(fromName[2]) : 0)
    const ratio = width && h ? h / (Number(el.attrs.width) || (fromName ? Number(fromName[1]) : width)) : 0
    // WordPress sizes ("photo-300x200.jpg") have a full-size original.
    const full = u.href.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)(\?|$))/i, '')
    const w = full !== u.href ? Math.max(width, 1200) : width
    return { src: full, width: w, ...(ratio ? { height: Math.round(w * ratio) } : {}) }
  } catch {
    return undefined
  }
}

function spelled(fileName: string, alt: string): string {
  const m = fileName.match(/^([A-Za-z]+) ([A-Za-z]+)$/)
  if (!m) return fileName
  const hit = alt.match(new RegExp(`\\b${m[1]}\\s+(${m[2][0]}[A-Za-z'’-]+)`))
  return hit && Math.abs(hit[1].length - m[2].length) <= 2 ? `${m[1]} ${hit[1]}` : fileName
}

const people0 = (src: string) => PEOPLE.test(src)

const words = (e: El | string) => textOf(e).replace(/\s+/g, ' ').trim()
const where = (e: El) => [e, ...ancestors(e).slice(0, 4)].map((a) => `${a.attrs.class ?? ''} ${a.attrs.id ?? ''}`).join(' ')

export function readAssets(pages: { html: string; url: string }[]): SiteAssets {
  const photos = new Map<string, SitePhoto>()
  const badges = new Map<string, { src: string; alt: string }>()
  const portraits = new Map<string, { src: string; name: string; role?: string; home?: boolean }>()
  const results: { amount: string; label: string }[] = []
  const reviews: { quote: string; name: string }[] = []
  let logo: string | undefined
  for (const [i, page] of pages.entries()) {
    const root = parseHtml(page.html)
    const body = findAll(root, (e) => e.tag === 'body')[0] ?? root
    const teamPage = /attorney|lawyer|team|people|about|staff/i.test(new URL(page.url).pathname)
    for (const img of findAll(body, (e) => e.tag === 'img')) {
      const s = srcOf(img, page.url)
      if (!s) continue
      const alt = decode(img.attrs.alt ?? img.attrs.title ?? '').replace(/\s+/g, ' ').trim()
      const ctx = `${s.src} ${alt} ${img.attrs.class ?? ''} ${where(img)}`
      if (!logo && i === 0 && /logo/i.test(ctx) && !/footer/i.test(where(img))) logo = s.src
      if (BADGE.test(`${s.src} ${alt} ${img.attrs.class ?? ''}`) || /award|badge|accolade|associations?|affiliations?|recogni|as-seen/i.test(where(img))) {
        // Badges are small emblems, never stock photos or icons.
        if (!/(^|[-_/])ico(n)?s?[-_/.]/i.test(s.src) && (!/\.svg$/i.test(new URL(s.src).pathname) || BADGE.test(`${s.src} ${alt}`)) && /\.(png|svg|webp|jpe?g|gif|avif)$/i.test(new URL(s.src).pathname) && !/logo-?(white|light)?\.(png|svg)|stock|shutterstock|getty|unsplash|pexels/i.test(s.src) && !(s.width > 700) && badges.size < 12) badges.set(s.src, { src: s.src, alt: alt && !/^(variant|group|image|img)\d*$/i.test(alt) ? alt : 'Award' })
        continue
      }
      if (NOT_PHOTO.test(s.src) || /logo|icon|footer/i.test(`${img.attrs.class ?? ''}`)) continue
      // A named person's photo: their alt is a name ("Joseph M. Marrone,
      // Esquire"), or the file is ("Partner-Edward-Piasta_…jpg").
      const person = alt.replace(/\s*[-|–—].*$/, '').trim()
      const fileName = decode(new URL(s.src).pathname.split('/').pop() ?? '').replace(/\.\w+$/, '').replace(/^(partner|attorney|lawyer|headshot|portrait)[-_]/i, '').split(/[_]|-\d/)[0].replace(/-/g, ' ')
      // A file name can be misspelt ("Michael-Wlker"); the photo's description
      // ("Michael Walker Atlanta lawyer") then has the name right.
      const fixed = NAMED.test(fileName) ? spelled(fileName, alt) : ''
      // Two capitalised words aren't always a name ("Vehicle Accidents"), so a
      // name needs a sign it's a person: "Esq.", a middle initial, a role in
      // the file name, or a page about their people.
      const sign = /\b(esq|esquire|j\.?d|attorney|partner|founder|paralegal|associate|counsel)\b/i.test(alt) || /(^|\/)(partner|attorney|lawyer|headshot|portrait|atty|bio|paralegal)[-_]|headshot|portrait/i.test(s.src) || /\b[A-Z]\.\s/.test(person) || teamPage
      const plausible = (n: string) => !!n && !NOT_NAME.test(n)
      const named = sign ? (NAMED.test(person) && plausible(person) ? person : plausible(fixed) ? fixed : '') : ''
      const role = /paralegal/i.test(s.src + alt) ? 'Paralegal' : /partner/i.test(s.src) ? 'Partner' : /of[-_ ]counsel/i.test(s.src + alt) ? 'Of counsel' : undefined
      const squareish = !s.height || !s.width || s.height / s.width >= 0.85
      if (named && squareish && !portraits.has(stem(s.src))) portraits.set(stem(s.src), { src: s.src, name: named.replace(/,?\s*Esq(uire)?\.?$/i, '').trim(), ...(role ? { role } : {}), ...(i === 0 ? { home: true } : {}) })
      // Icons and illustrations aren't photos.
      if ((s.width && s.width < 260) || /(^|[-_/])ico(n)?[-_]/i.test(s.src) || (/\.png$/i.test(new URL(s.src).pathname) && !named && !people0(s.src))) continue
      const people = !!named || PEOPLE.test(s.src) || /\b(team|attorneys|lawyers|partners|staff|founders?)\b.*\b(photo|picture|portrait|group)\b|\bour (team|attorneys|lawyers|people)\b/i.test(alt)
      const score = (people ? 40 : 0) + Math.min(s.width, 2000) / 50 + (i === 0 ? 10 : 0) - (/(stock|shutterstock|istock|adobe|getty|unsplash)/i.test(s.src) ? 15 : 0)
      // The photo at the top of their home page ("header-background-img").
      const banner = i === 0 && !named && /hero|banner|header[-_]?(bg|background|img|image)|masthead|slider?[-_]?(img|image|bg)/i.test(`${s.src} ${img.attrs.class ?? ''} ${where(img)}`)
      const size = banner && !s.height ? { width: Math.max(s.width, 1920), height: 700 } : { width: s.width, ...(s.height ? { height: s.height } : {}) }
      const k = stem(s.src)
      const prev = photos.get(k)
      if (!prev || prev.score < score) photos.set(k, { src: s.src, alt: alt.replace(/^background\s*[-–—:]\s*/i, '').slice(0, 160), people, ...size, ...(banner ? { banner: true } : {}), score: score + (banner ? 25 : 0) })
    }
    // Photos set as backgrounds in the page itself (heroes, banners).
    for (const m of page.html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+\.(?:jpe?g|png|webp))[^)]*\)/gi)) {
      try {
        const u = new URL(decode(m[1]), page.url)
        if (u.protocol === 'http:') u.protocol = 'https:'
        if (NOT_PHOTO.test(u.href) || photos.has(stem(u.href)) || /texture|pattern|overlay|shape|gradient|dots/i.test(u.href)) continue
        // A home page's banner (hero, banner, slider) is their best wide photo.
        const banner = /hero|banner|slide|header|masthead|home-?bg|top-?bg/i.test(u.href)
        photos.set(stem(u.href), { src: u.href, alt: '', people: PEOPLE.test(u.href), width: 1920, height: banner ? 700 : 1080, ...(banner && i === 0 ? { banner: true } : {}), score: (PEOPLE.test(u.href) ? 40 : 0) + 30 + (i === 0 ? 10 : 0) + (banner && i === 0 ? 25 : 0) })
      } catch {}
    }
    // Published results: "$4.2 Million" with what it was for.
    const text = textOf(body, (e) => /^(script|style|nav|header|footer|form|noscript)$/.test(e.tag))
    if (results.length < 12) {
      // Deepest first: "$20 Million" alone has no label, so the box around
      // it ("$20 Million  Settlement for…") is the result.
      const boxes = findAll(body, (e) => /^(div|li|article|section|p|span|h\d|a|figure)$/.test(e.tag) && /\$\s?\d/.test(words(e)) && words(e).length <= 220)
        .map((e) => ({ e, depth: ancestors(e).length }))
        .sort((a, b) => b.depth - a.depth)
      const taken = new Set<El>()
      for (const { e: el } of boxes) {
        if (findAll(el, (d) => taken.has(d)).length) continue
        const t = words(el)
        const m = t.match(/\$\s?(\d[\d,.]*)\s*(million|billion|mil|m\b|k\b)?/i)
        if (!m) continue
        const n = parseFloat(m[1].replace(/,/g, ''))
        const unit = (m[2] ?? '').toLowerCase()
        const value = unit.startsWith('b') ? n * 1e9 : unit.startsWith('m') ? n * 1e6 : unit === 'k' ? n * 1e3 : n
        if (value < 50_000 || (t.match(/\$\s?\d/g) ?? []).length > 1) continue
        const amount = value >= 1e9 ? `$${+(value / 1e9).toFixed(1)}B` : value >= 1e6 ? `$${+(value / 1e6).toFixed(value >= 1e7 ? 1 : 2)}M` : `$${Math.round(value / 1e3)}K`
        let label = t.replace(m[0], '').replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').replace(/\s+/g, ' ')
        // "Over $1B Recovered" is "$1B+", recovered.
        const over = /^(over|more than)\s+/i.test(label) || /\b(over|more than)\s*$/i.test(t.slice(0, t.indexOf(m[0])))
        label = label.replace(/^(over|more than)\s+/i, '').replace(/^summary\s*:\s*/i, '')
        label = label.replace(/^(million|billion|dollars?)\b\s*/i, '').replace(/\s*(\.\.\.|…)?\s*read more\.?$/i, '').replace(/^(settlement|verdict|recovery|award)\s*[:–—-]\s*(.+)$/i, (_, k: string, rest: string) => `${rest.replace(/\.$/, '')} (${k.toLowerCase()})`).trim()
        if (label.length < 6 || label.length > 120 || /\ba dollar\b|\.\.\.|…/.test(label) || (/recovered for (our )?clients|over the years|in total|since \d{4}/i.test(label) && results.length)) continue
        taken.add(el)
        if (!results.some((r) => r.label === label && r.amount === amount)) results.push({ amount: over ? `${amount}+` : amount, label: label.charAt(0).toUpperCase() + label.slice(1), value } as never)
        if (results.length >= 12) break
      }
    }
    // Their clients' reviews, in their words, with the name they gave.
    if (reviews.length < 6) {
      for (const box of findAll(body, (e) => /testimonial|review|quote/i.test(`${e.attrs.class ?? ''} ${e.attrs.id ?? ''}`) && !/reviews?-(link|button|cta)|write/i.test(e.attrs.class ?? ''))) {
        const ps = findAll(box, (e) => e.tag === 'p' || e.tag === 'blockquote' || (e.tag === 'div' && !e.children.some((c) => isEl(c) && !/^(span|strong|em|b|i|br|a)$/.test(c.tag))))
        const quote = ps.map(words).find((t) => t.length >= 60 && t.length <= 520 && !/\$\s?\d/.test(t) && !/\b(el|los|las|que|muy|una|este|con|para)\b.*\b(el|los|las|que|muy|una|este|con|para)\b/i.test(t) && (t.match(/[.!?]/g) ?? []).length >= 1 && !/\(.*(daughter|son|wife|husband|mother|father) of/i.test(t))
        if (!quote) continue
        const name = findAll(box, (e) => /name|author|cite|client|title/i.test(`${e.attrs.class ?? ''} ${e.tag}`) || e.tag === 'cite' || e.tag === 'strong' || e.tag === 'h4' || e.tag === 'h5')
          .map(words)
          .find((t) => t && t.length <= 40 && t !== quote && !/review|testimonial|read more|google|stars?$/i.test(t))
        const q = quote.replace(/^["“”']+|["“”']+$/g, '').trim()
        const who = (name ?? '').replace(/^[-–—\s]+/, '').trim()
        const real = /^[A-Z][a-zA-Z'’-]+(\s+[A-Z][a-zA-Z'’.-]*){0,2}$/.test(who) && !/\b(spanish|english|star|stars|lawyer|attorney|review|client|google|avvo|yelp)\b/i.test(who)
        if (!reviews.some((r) => r.quote === q)) reviews.push({ quote: q, name: real ? (who === who.toUpperCase() ? who.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : who) : 'A client' })
        if (reviews.length >= 6) break
      }
    }
    void text
  }
  return {
    ...(logo ? { logo } : {}),
    photos: [...photos.values()].sort((a, b) => b.score - a.score).slice(0, 24),
    portraits: [...portraits.values()].filter((p, i, all) => all.findIndex((x) => x.name === p.name) === i).slice(0, 24),
    // The largest first.
    results: (results as { amount: string; label: string; value: number }[])
      .sort((a, b) => b.value - a.value)
      .filter((r, i, all) => all.findIndex((x) => x.label === r.label || x.amount === r.amount) === i)
      // "$19M Settlement" beside "$19M Settlement for…" is the same one.
      .filter((r, _, all) => r.label.split(' ').length > 2 || !all.some((x) => x !== r && x.amount === r.amount))
      .slice(0, 6)
      .map(({ amount, label }) => ({ amount, label })),
    reviews: reviews.slice(0, 6),
    badges: [...badges.values()].slice(0, 10),
  }
}

// An image's size from its first bytes (PNG, JPEG, GIF, WebP).
export function imageSize(b: Buffer): { width: number; height: number } | undefined {
  if (b.length < 30) return undefined
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
  if (b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16)
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L') {
      const n = b.readUInt32LE(21)
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }
    }
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) }
    return undefined
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return undefined
      const marker = b[i + 1]
      const len = b.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
      i += 2 + len
    }
  }
  return undefined
}

// The photos a design might lead with, measured for real: a guessed shape
// (a background's size isn't in the page) can put a tall, faded photo where
// a banner goes, and a photo that doesn't load leaves a hole. Those that
// can't be fetched are dropped.
export async function measurePhotos(a: SiteAssets, fetchBytes: (url: string) => Promise<{ type: string; data: Buffer } | null>, count = 6): Promise<SiteAssets> {
  const lead = a.photos.filter((p) => p.banner || p.people).slice(0, count)
  const gone = new Set<string>()
  await Promise.all(
    lead.map(async (p) => {
      const got = await fetchBytes(p.src).catch(() => null)
      const size = got && /^image\//.test(got.type) ? imageSize(got.data) : undefined
      if (!size || !size.width || !size.height) return void gone.add(p.src)
      p.width = size.width
      p.height = size.height
    })
  )
  return { ...a, photos: a.photos.filter((p) => !gone.has(p.src)) }
}
