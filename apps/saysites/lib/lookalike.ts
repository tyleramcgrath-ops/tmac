// Making a redesign preview look like the owner's current website: their own
// hero photo, their photos with their own descriptions, their logo and their
// exact brand colour. The SaySites layout and speed rules stay; the look is
// theirs. Read from the home page only, no AI.

import { decode } from './importer'
import type { Photo, PhotoSet } from './photos'

export interface SiteLook {
  // The big photo at the top of their home page, when there is one.
  hero?: Photo
  // True when their hero is a photo with the text on top of it.
  photoHero: boolean
  // Their other content photos, largest first, each with its own alt text.
  photos: Photo[]
  // Their logo, including light versions made for a dark header.
  logo?: string
  // The words on their hero: a short line ("When you need a win") and the
  // sentence under it.
  heroLine?: string
  heroText?: string
}

const IMAGE = /\.(jpe?g|png|webp|avif)(\?[^"')\s]*)?$/i
const NOT_PHOTO = /logo|icon|sprite|avatar|badge|seal|award|pattern|texture|placeholder|blank|spacer|pixel|loader|arrow|-bg\.|_bg\.|bg-|background/i

function absolute(src: string, base: string): string | undefined {
  try {
    const u = new URL(decode(src.trim()), base)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined
  } catch {
    return undefined
  }
}

// WordPress resizes uploads to "photo-300x200.jpg"; the original is "photo.jpg".
export function fullSize(src: string): string {
  return src.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp|avif)(\?|$))/i, '')
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined)

// Background photos set in style rules, by class or id: ".sliderhome" →
// its photo. From the page's own <style> blocks and its stylesheets.
export function cssBackgrounds(css: string, base: string): Map<string, string> {
  const out = new Map<string, string>()
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const m of flat.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const url = m[2].match(/background(?:-image)?\s*:[^;}]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i)?.[1]
    const src = url && absolute(url, base)
    if (!src || !IMAGE.test(src) || NOT_PHOTO.test(src)) continue
    for (const sel of m[1].split(',')) {
      const last = sel.trim().split(/[\s>+~]+/).pop() ?? ''
      for (const k of last.match(/[.#][\w-]+/g) ?? []) if (!out.has(k)) out.set(k, src)
    }
  }
  return out
}

export function readLook(html: string, url: string, name = '', stylesheets = ''): SiteLook {
  const body = html.replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi, ' ')

  // The hero: the background photo of the first section that has one, in
  // page order, whether it is set inline or by a style rule. Else the
  // og:image the site shares on social media.
  const inlineCss = [...body.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  const rules = cssBackgrounds(`${stylesheets}\n${inlineCss}`, url)
  let hero: Photo | undefined
  let photoHero = false
  const start = body.search(/<body[\s>]/i)
  for (const m of body.slice(Math.max(0, start)).matchAll(/<(?:div|section|header|main|figure|article|aside|span|a)\b[^>]*>/gi)) {
    const tag = m[0]
    const inline = attr(tag, 'style')?.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i)?.[1]
    let src = inline ? absolute(inline, url) : undefined
    if (src && (!IMAGE.test(src) || NOT_PHOTO.test(src))) src = undefined
    if (!src) {
      const keys = [...(attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean).map((c) => `.${c}`), ...(attr(tag, 'id') ? [`#${attr(tag, 'id')}`] : [])]
      src = keys.map((k) => rules.get(k)).find(Boolean)
    }
    if (src) {
      hero = { src: fullSize(src), alt: name || 'Our team', width: 1920, height: 1080 }
      photoHero = true
      break
    }
  }
  if (!hero) {
    const og = html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1] ?? html.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i)?.[1]
    const src = og && absolute(og, url)
    if (src && IMAGE.test(src) && !NOT_PHOTO.test(src)) hero = { src: fullSize(src), alt: name || 'Our business', width: 1600, height: 1067 }
  }

  // Content photos: real images with a description, big enough to be photos.
  const photos: Photo[] = []
  const seen = new Set<string>(hero ? [hero.src] : [])
  let logo: string | undefined
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const raw = attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || attr(tag, 'src') || ''
    const src = absolute(raw, url)
    if (!src || src.startsWith('data:')) continue
    const alt = decode(attr(tag, 'alt') ?? '').replace(/\s+/g, ' ').trim()
    const cls = `${attr(tag, 'class') ?? ''} ${attr(tag, 'id') ?? ''}`
    if (!logo && (/logo/i.test(`${src} ${cls} ${alt}`) || (name && alt && alt.toLowerCase() === name.toLowerCase())) && IMAGE.test(src)) {
      logo = src
      continue
    }
    if (!IMAGE.test(src) || NOT_PHOTO.test(src) || NOT_PHOTO.test(cls)) continue
    const w = Number(attr(tag, 'width')) || 0
    const h = Number(attr(tag, 'height')) || 0
    if ((w && w < 320) || (h && h < 200) || alt.length < 4) continue
    // Known sizes stay as they are; unsized thumbnails point at the original.
    const sized = w > 0 && h > 0
    const full = sized ? src : fullSize(src)
    if (seen.has(full)) continue
    seen.add(full)
    photos.push({ src: full, alt: alt.slice(0, 200), width: sized ? w : 1200, height: sized ? h : 800 })
  }
  // Landscape photos suit service cards; square and portrait ones (usually
  // team headshots) go last.
  const wide = (p: Photo) => (p.width / p.height >= 1.2 && !/^(portrait|headshot|photo of (attorney|lawyer))/i.test(p.alt) ? 0 : 1)
  photos.sort((a, b) => wide(a) - wide(b))
  if (!hero && photos.length) hero = photos.shift()
  // The hero's words: the first block marked hero, banner or slider.
  const text = (h: string) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const block = body.match(/<[a-z]+[^>]*class\s*=\s*["'][^"']*\b(hero|banner|slider|masthead|jumbotron|homeslider)[^"']*["'][^>]*>([\s\S]{0,3000})/i)?.[2] ?? ''
  const line = text(block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1] ?? '')
  const para = text(block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '')
  const tidy = (s: string) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s)
  return {
    ...(hero ? { hero } : {}),
    photoHero,
    photos: photos.slice(0, 12),
    ...(logo ? { logo } : {}),
    ...(line.length >= 6 && line.length <= 60 ? { heroLine: tidy(line) } : {}),
    ...(para.length >= 30 && para.length <= 240 ? { heroText: para } : {}),
  }
}

// Puts each service's best-matching photo first, by the words in the
// photo's own description ("Empty nursing home wheelchair" → nursing home).
const STOP = new Set(['and', 'the', 'for', 'with', 'our', 'your', 'from', 'that', 'this', 'legal', 'help', 'law', 'lawyer', 'lawyers', 'attorney', 'attorneys', 'services', 'service'])
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.replace(/(ing|es|s)$/, '')))
export function matchPhotos(photos: Photo[], services: string[]): Photo[] {
  const left = [...photos]
  const out: Photo[] = []
  for (const s of services) {
    const want = words(s)
    let best = -1, score = 0
    left.forEach((p, i) => {
      const n = [...words(p.alt)].filter((w) => want.has(w)).length
      if (n > score) (score = n), (best = i)
    })
    out.push(...(best >= 0 ? left.splice(best, 1) : left.length ? left.splice(0, 1) : []))
  }
  return [...out, ...left]
}

// Their photos as a starter photo set, when there are enough to fill it.
export function photoSet(look: SiteLook, fallback: PhotoSet, services: string[] = []): PhotoSet {
  if (!look.hero) return fallback
  const own = matchPhotos(look.photos, services)
  const cards = [0, 1, 2].map((i) => own[i] ?? fallback.cards[i]) as PhotoSet['cards']
  return { hero: look.hero, cards, extra: [...own.slice(3), ...(fallback.extra ?? [])] }
}

// How light a colour is, 0 (black) to 1 (white).
export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
