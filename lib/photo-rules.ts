// Photo rules, enforced in code:
// 1. On one site, a photo appears once, unless the owner asks for it again.
// 2. A stock photo belongs to one customer's site. The owner's own uploads
//    are theirs to use anywhere.
// The starter follows both by dropping repeats (a page header falls back to
// a solid colour); Sofie is held to them by her publish check.

import type { Element, Page } from './schema'

// Stock photos are identified by their Unsplash id, whatever size was asked for.
export function photoKey(src: string): string {
  const m = /images\.unsplash\.com\/(photo-[\w-]+)/.exec(src)
  return m ? m[1] : src.split('?')[0]
}
export const isStock = (src: string) => src.includes('images.unsplash.com/')

// Home first, then the menu order the pages are stored in.
const ordered = (pages: Page[]) => [...pages].sort((a, b) => (a.slug === '' ? -1 : b.slug === '' ? 1 : 0))

export function photoUses(pages: Page[]): { key: string; src: string; page: string }[] {
  const out: { key: string; src: string; page: string }[] = []
  const walk = (els: Element[], page: string) => {
    for (const el of els) {
      if (el.type === 'container') {
        if (el.backgroundImage) out.push({ key: photoKey(el.backgroundImage.src), src: el.backgroundImage.src, page })
        walk(el.children, page)
      } else if (el.type === 'image') out.push({ key: photoKey(el.src), src: el.src, page })
      else if (el.type === 'gallery') for (const i of el.images) out.push({ key: photoKey(i.src), src: i.src, page })
    }
  }
  for (const p of ordered(pages)) if (p.status === 'published') walk(p.body, p.slug === '' ? 'home' : p.slug)
  return out
}

// Photos used more than once on the site: "photo-123 on home and services".
export function repeatedPhotos(pages: Page[]): { key: string; pages: string[] }[] {
  const by = new Map<string, string[]>()
  for (const u of photoUses(pages)) by.set(u.key, [...(by.get(u.key) ?? []), u.page])
  return [...by].filter(([, p]) => p.length > 1).map(([key, p]) => ({ key, pages: p }))
}

// Removes every repeat after the first use, and any stock photo in `taken`
// (used by another customer's site). A page header that loses its photo
// keeps a solid background so its white text stays readable.
export function dropRepeatedPhotos(pages: Page[], taken: Set<string> = new Set()): Page[] {
  const seen = new Set<string>()
  const keep = (src: string) => {
    const k = photoKey(src)
    if (seen.has(k) || (isStock(src) && taken.has(k))) return false
    seen.add(k)
    return true
  }
  const walk = (els: Element[]): Element[] => {
    const out: Element[] = []
    for (const el of els) {
      if (el.type === 'container') {
        const next = { ...el }
        if (next.backgroundImage && !keep(next.backgroundImage.src)) {
          delete next.backgroundImage
          next.style = { ...next.style, background: next.style?.background ?? 'secondary' }
        }
        next.children = walk(el.children)
        // A column that only held the dropped photo goes too.
        if (el.children.length && !next.children.length && !next.backgroundImage) continue
        out.push(next)
      } else if (el.type === 'image') {
        if (keep(el.src)) out.push(el)
      } else if (el.type === 'gallery') {
        const images = el.images.filter((i) => keep(i.src))
        if (images.length) out.push({ ...el, images })
      } else out.push(el)
    }
    return out
  }
  const done = new Map(ordered(pages).map((p) => [p.id, p.status === 'published' ? { ...p, body: walk(p.body) as Page['body'] } : p]))
  return pages.map((p) => done.get(p.id)!)
}
