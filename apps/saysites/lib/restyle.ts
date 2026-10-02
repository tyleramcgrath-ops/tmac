// The redesign preview's "fresh redesign": every page and word of the
// owner's site (taken from the "as it is" copy, so nothing is lost for
// search), laid out in a clean modern design. A photo hero, roomy sections
// on alternating backgrounds, columns as cards, photos with soft corners,
// one type scale and their brand colour, light or dark to suit it.

import { luminance } from './lookalike'
import type { Photo } from './photos'
import { walk, type Container, type Element, type ElementStyle, type GlobalStyles, type Page, type Site, type Widget } from './schema'

const LIGHT = { text: '#1a1c1f', muted: '#5d6066', background: '#ffffff', surface: '#f4f2ee', secondary: '#15171a' }
// A dark site; its footer and bands that use "secondary" turn light (as the
// Midnight palette does), so every pairing stays readable.
const DARK = { text: '#eeeae4', muted: '#a8a29a', background: '#111315', surface: '#1b1e21', secondary: '#efe8dd' }

export function freshGlobals(base: GlobalStyles, brand: string, serif: boolean): { globals: GlobalStyles; dark: boolean } {
  // A light brand colour (gold, peach) can't carry white button text on a
  // light page; it shines on a dark one instead.
  const dark = luminance(brand) > 0.33
  const c = dark ? DARK : LIGHT
  return {
    dark,
    globals: {
      ...base,
      colors: { primary: brand, accent: brand, secondary: c.secondary, text: c.text, muted: c.muted, background: c.background, surface: c.surface },
      fonts: { heading: serif ? 'serif' : 'sans', body: 'sans' },
      baseFontSize: 17,
      typeScale: 1.28,
      radius: 14,
      containerWidth: 1200,
      headingWeight: serif ? 500 : 700,
      headingTracking: serif ? -0.015 : -0.025,
      headingCase: 'none',
      buttonShape: 'rounded',
      buttonCase: 'none',
    },
  }
}

const SECTION_PAD: ElementStyle['padding'] = { desktop: { top: 104, right: 24, bottom: 104, left: 24 }, mobile: { top: 64, right: 20, bottom: 64, left: 20 } }
const HEADING: Record<number, [number, number]> = { 1: [54, 36], 2: [40, 29], 3: [25, 21], 4: [21, 19], 5: [19, 18], 6: [18, 17] }

// "WE'LL GUIDE YOU" → "We'll guide you": capitals shout; the words stay.
function calm(text: string): string {
  if (text.length < 12 || text !== text.toUpperCase() || !/[A-Z]{3}/.test(text)) return text
  const lower = text.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Only layout from the old styles survives; colours, sizes and alignment
// come from the design.
function bare(style?: ElementStyle): ElementStyle {
  return style?.grow ? { grow: style.grow } : {}
}

const isRow = (e: Container): boolean => e.type === 'container' && (e.layout === 'grid' || e.direction?.desktop === 'row') && !e.id.includes('-br')
const textLength = (els: Element[]): number => els.reduce((n, e) => n + (e.type === 'container' ? textLength(e.children) : e.type === 'text' || e.type === 'heading' ? e.text.length : 0), 0)

export function restylePage(page: Page, dark: boolean): Page {
  const out: Container[] = []
  let alt = false
  page.body.forEach((sec, i) => {
    const hero = i === 0 && !!sec.backgroundImage
    const photo = !!sec.backgroundImage
    // Plain sections alternate between the page colour and a soft tint.
    const bg = photo ? undefined : alt ? 'surface' : undefined
    if (!photo) alt = !alt
    const cardBg = bg === 'surface' ? 'background' : 'surface'
    const short = textLength(sec.children) < 280
    const centre = short && !hero
    const children = sec.children.map((e): Element => {
      const r = restyle(e, { hero, photo, cardBg, centre, top: true })
      // A lone button in a centred section sits in the middle too.
      return centre && r.type === 'button' ? { id: `${r.id}-br`, type: 'container', layout: 'flex', direction: { desktop: 'row' }, justify: 'center', children: [r] } : r
    })
    // A lone full-width photo opening the page reads as a banner.
    const banner = i === 0 && !photo && sec.children.length === 1 && sec.children[0].type === 'image'
    out.push({
      ...sec,
      ...(sec.backgroundImage ? { backgroundImage: { ...sec.backgroundImage, overlay: hero ? 0.62 : 0.68, overlayStyle: hero ? 'side' : 'full' } } : {}),
      ...(banner ? {} : { boxed: true }),
      style: {
        padding: banner ? undefined : hero ? { desktop: { top: 168, right: 24, bottom: 168, left: 24 }, mobile: { top: 104, right: 20, bottom: 96, left: 20 } } : SECTION_PAD,
        gap: { desktop: 18 },
        ...(bg ? { background: bg } : {}),
        ...(photo && !dark ? { color: '#ffffff' } : {}),
        ...(centre ? { textAlign: { desktop: 'center' } } : {}),
      },
      children,
    })
  })
  return { ...page, body: out }
}

interface Ctx {
  hero: boolean
  photo: boolean
  cardBg: 'surface' | 'background'
  centre: boolean
  top: boolean
}

function restyle(e: Element, ctx: Ctx): Element {
  if (e.type === 'container') {
    if (isRow(e)) return row(e, ctx)
    // Buttons side by side: the first solid, the rest outlined.
    if (e.id.includes('-br')) return { ...e, justify: ctx.centre ? 'center' : 'start', style: { gap: { desktop: 14 } }, children: e.children.map((c, i) => (c.type === 'button' ? button(c, i, ctx) : restyle(c, ctx))) }
    return { ...e, style: { ...bare(e.style), gap: { desktop: 14 } }, children: e.children.map((c) => restyle(c, { ...ctx, top: false })) }
  }
  return widget(e, ctx)
}

function row(r: Container, ctx: Ctx): Container {
  const cols = r.children.filter((c): c is Container => c.type === 'container')
  const onlyImage = (c: Container) => c.children.length === 1 && c.children[0].type === 'image'
  // A photo beside words: a split layout, no cards.
  const split = cols.length === 2 && cols.some(onlyImage)
  const children = r.children.map((c): Element => {
    if (c.type !== 'container') return restyle(c, { ...ctx, top: false })
    const inner = c.children.map((x) => restyle(x, { ...ctx, centre: false, top: false, photo: false }))
    if (split || onlyImage(c) || ctx.photo) return { ...c, style: { ...bare(c.style), gap: { desktop: 14 } }, children: inner }
    return {
      ...c,
      style: { ...bare(c.style), gap: { desktop: 12 }, background: ctx.cardBg, borderRadius: 18, padding: { desktop: { top: 30, right: 30, bottom: 32, left: 30 }, mobile: { top: 24, right: 22, bottom: 26, left: 22 } }, textAlign: { desktop: 'left' } },
      children: inner,
    }
  })
  if (split) return { ...r, layout: 'flex', direction: { desktop: 'row', mobile: 'column' }, align: 'center', style: { gap: { desktop: 64, mobile: 28 } }, children }
  const n = Math.min(cols.length, 3)
  return { ...r, layout: 'grid', direction: undefined, columns: { desktop: n, tablet: Math.min(n, 2), mobile: 1 }, align: 'stretch', style: { gap: { desktop: 24, mobile: 18 } }, children: children.map((c): Element => (c.type === 'container' ? { ...c, style: { ...c.style, grow: undefined } } : c)) }
}

function button(b: Extract<Widget, { type: 'button' }>, i: number, ctx: Ctx): Widget {
  return { ...b, label: b.label === b.label.toUpperCase() && /[A-Z]{3}/.test(b.label) ? b.label.charAt(0) + b.label.slice(1).toLowerCase() : b.label, variant: i === 0 ? 'primary' : 'outline', style: ctx.photo && i > 0 ? { color: '#ffffff', border: '#ffffff' } : undefined }
}

function widget(w: Widget, ctx: Ctx): Widget {
  switch (w.type) {
    case 'heading': {
      const [d, m] = ctx.hero && w.level <= 2 ? [60, 38] : HEADING[w.level] ?? HEADING[3]
      // Centred headings span the width so they sit in the middle.
      const style: ElementStyle = { fontSize: { desktop: d, mobile: m }, ...(ctx.centre ? {} : { maxWidth: w.level <= 2 ? 860 : 760 }) }
      // Sub-headings in their brand colour, as a quiet accent.
      if (w.level >= 3 && !ctx.photo) style.color = 'primary'
      return { ...w, text: calm(w.text), style }
    }
    case 'text': {
      const long = w.text.length > 260
      // A short line in a hero is its eyebrow.
      if (ctx.hero && w.text.length <= 80) return { ...w, text: calm(w.text), style: { fontSize: { desktop: 14 }, fontWeight: 600, letterSpacing: 0.12, textTransform: 'uppercase', color: 'primary' } }
      // A short label (a card's title) reads as one.
      if (!ctx.top && w.text.length <= 40 && !w.text.includes('\n')) return { ...w, style: { fontSize: { desktop: 19 }, fontWeight: 600, ...(ctx.photo ? {} : { color: 'text' }) } }
      return { ...w, style: { fontSize: { desktop: ctx.hero ? 20 : 17.5 }, ...(ctx.top && long ? { maxWidth: 780 } : {}), ...(ctx.photo ? {} : { color: 'text' }) } }
    }
    case 'image':
      return { ...w, aspect: w.width / w.height > 1.1 ? 1.5 : w.aspect, style: { borderRadius: 16 } }
    case 'button':
      return button(w, 0, ctx)
    default:
      return { ...w, style: undefined }
  }
}

// The whole fresh site: same pages and business, the new look.
export function freshSite(site: Site, pages: Page[], brand: string, serif: boolean, heroPhoto?: Photo): { site: Site; pages: Page[] } {
  const { globals, dark } = freshGlobals(site.globals, brand, serif)
  const fresh: Site = structuredClone(site)
  fresh.globals = globals
  // A calm header: the page colour, or near-black when their logo is made
  // for a dark one.
  const darkLogo = !!site.header?.colors && luminance(site.header.colors.background) < 0.3
  fresh.header = {
    ...(site.header?.topbar ? { topbar: site.header.topbar } : {}),
    ...(site.header?.cta ? { cta: site.header.cta } : {}),
    // Near-black for a logo made for a dark header; on a dark design, the
    // top bar stays dark too.
    ...(darkLogo && !dark ? { colors: { background: '#121417', text: '#ffffff', topbarBackground: '#1d2024', topbarText: '#e8e4de' } } : {}),
    ...(dark ? { colors: { background: DARK.background, text: DARK.text, topbarBackground: '#0a0b0c', topbarText: '#d9d4cc' } } : {}),
  }
  // A home page that opens with words, not a photo, gets their main photo
  // behind its first section (when it isn't already on the page).
  const out = pages.map((p) => structuredClone(p))
  const home = out.find((p) => p.slug === '')
  const first = home?.body[0]
  if (first && heroPhoto && !first.backgroundImage && !first.children.every((c) => c.type === 'image') && !JSON.stringify(home!.body).includes(heroPhoto.src)) {
    first.backgroundImage = { src: heroPhoto.src, width: heroPhoto.width, height: heroPhoto.height, overlay: 0.62, priority: true }
    // Only the hero loads first.
    for (const e of walk(home!.body)) if (e.type === 'image') e.priority = undefined
  }
  return { site: fresh, pages: out.map((p) => restylePage(p, dark)) }
}
