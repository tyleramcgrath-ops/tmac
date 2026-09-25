// Builds finished logos from a designer's spec. Sofie art-directs (typeface,
// weight, spacing, layout, mark, colours); this file does the craft that is
// hard to do blind: real typefaces turned into vector outlines (so the logo
// looks the same on every device, with proper kerning), lines sized by the
// typeface's own cap height, optical centring, proportional spacing, and
// professionally drawn icons. The output is plain SVG shapes.

import * as opentype from 'opentype.js'
import ICONS from './data/logo-icons.json'
import { sanitizeSvg, SvgError } from './svg'

// Open-licence typefaces from Google Fonts, each with a clear character.
export const LOGO_FONTS: Record<string, { style: string; weights: number[] }> = {
  Fraunces: { style: 'soft, warm serif with character (bakeries, cafes, florists)', weights: [400, 600, 700, 900] },
  'Playfair Display': { style: 'high-contrast elegant serif (salons, boutiques, restaurants)', weights: [400, 600, 700, 900] },
  'Cormorant Garamond': { style: 'refined classic serif, light and luxurious (spas, bridal, jewellery)', weights: [500, 600, 700] },
  'DM Serif Display': { style: 'bold display serif, confident', weights: [400] },
  'Libre Caslon Text': { style: 'traditional, trustworthy serif (law, accounting, books)', weights: [400, 700] },
  'Young Serif': { style: 'heavy, warm old-style serif', weights: [400] },
  Cinzel: { style: 'classical Roman capitals, always uppercase (heritage, stonework, wineries)', weights: [400, 600, 700, 900] },
  Marcellus: { style: 'flared, graceful caps-friendly serif', weights: [400] },
  'Zilla Slab': { style: 'friendly slab serif (workshops, coffee, hardware)', weights: [500, 600, 700] },
  'Roboto Slab': { style: 'sturdy slab serif (builders, auto, trades)', weights: [400, 500, 600, 700, 800] },
  Manrope: { style: 'modern, clean sans (clinics, studios, consultants)', weights: [400, 500, 600, 700, 800] },
  Sora: { style: 'geometric, crisp sans (tech, cleaning, modern services)', weights: [300, 400, 500, 600, 700, 800] },
  Outfit: { style: 'round geometric friendly sans', weights: [300, 400, 500, 600, 700, 800] },
  Archivo: { style: 'sturdy grotesque sans, dependable (trades, logistics)', weights: [400, 500, 600, 700, 800, 900] },
  Figtree: { style: 'friendly, open sans', weights: [400, 500, 600, 700, 800, 900] },
  Oswald: { style: 'strong condensed sans (plumbers, roofers, gyms)', weights: [300, 400, 500, 600, 700] },
  'Barlow Condensed': { style: 'industrial condensed sans (electricians, mechanics)', weights: [400, 500, 600, 700, 800] },
  'Bebas Neue': { style: 'tall all-caps condensed display, punchy', weights: [400] },
  Nunito: { style: 'rounded, soft and friendly (childcare, pets, dentists)', weights: [400, 600, 700, 800, 900] },
  'Josefin Sans': { style: 'vintage geometric sans, elegant caps (barbers, boutiques)', weights: [300, 400, 600, 700] },
  Unbounded: { style: 'wide, modern display sans (bold modern brands)', weights: [400, 500, 700, 900] },
}

// Professionally drawn icons (Phosphor, MIT licence; see data/PHOSPHOR-LICENSE),
// as path data on a 256 grid.
const ICON_PATHS = ICONS as Record<string, string>
export const LOGO_ICONS = Object.keys(ICON_PATHS)

export const MARK_SHAPES = ['circle', 'square', 'rounded', 'hexagon', 'diamond', 'shield', 'arch'] as const
type Shape = (typeof MARK_SHAPES)[number]

type TextCase = 'as-is' | 'upper' | 'lower'
export interface TextSpec {
  text: string
  font: string
  weight: number
  case?: TextCase
  // Letter-spacing in em, -0.06 to 0.5.
  tracking?: number
}
export type MarkSpec =
  | { kind: 'none' }
  | { kind: 'monogram'; letters: string; shape: Shape; style: 'solid' | 'outline'; font: string; weight: number }
  | { kind: 'icon'; icon: string; shape: Shape | 'none'; style: 'solid' | 'outline' }
  // A symbol Sofie draws herself in a 0 0 64 64 box; optionally on a filled shape.
  | { kind: 'symbol'; svg: string; shape?: Shape | 'none' }
export interface LogoSpec {
  layout: 'wordmark' | 'mark-left'
  name: TextSpec & {
    // More words on the same line in a contrasting weight (and colour), e.g.
    // "Rivertown" bold + "Plumbing" light.
    accent?: { text: string; weight: number }
  }
  tagline?: TextSpec
  // plain; rule: a line between name and tagline; flanked: lines either side of the tagline.
  taglineStyle?: 'plain' | 'rule' | 'flanked'
  align?: 'left' | 'center'
  // A border around a wordmark: a box or a pill.
  frame?: 'none' | 'box' | 'pill'
  mark: MarkSpec
  colors: { name: string; accent?: string; tagline?: string; mark: string; markInk: string }
}

export type FontLoader = (family: string, weight: number, text: string) => Promise<ArrayBuffer>

const cache = new Map<string, Promise<opentype.Font>>()

export const googleFontLoader: FontLoader = async (family, weight, text) => {
  const q = `family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${q}`, { signal: AbortSignal.timeout(8000) })).text()
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!url) throw new Error(`No font file for ${family} ${weight}`)
  return (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer()
}

async function font(load: FontLoader, family: string, weight: number, text: string): Promise<opentype.Font> {
  // Always include H (for the cap height) and a space.
  const chars = [...new Set([...text, 'H', ' '])].sort().join('')
  const key = `${family}|${weight}|${chars}`
  let f = cache.get(key)
  if (!f) {
    f = load(family, weight, chars).then((buf) => opentype.parse(buf))
    cache.set(key, f)
    f.catch(() => cache.delete(key))
  }
  return f
}

const hex = /^#[0-9a-fA-F]{6}$/
const color = (c: string | undefined, fallback: string) => (c && hex.test(c) ? c : fallback)
const r = (n: number) => Math.round(n * 100) / 100

function applyCase(text: string, c: TextCase | undefined): string {
  if (c === 'upper') return text.toUpperCase()
  if (c === 'lower') return text.toLowerCase()
  return text
}

function pickWeight(family: string, weight: number): number {
  const ws = LOGO_FONTS[family]?.weights ?? [400, 700]
  return ws.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), ws[0])
}

function checkFont(family: string): string {
  if (!LOGO_FONTS[family]) throw new SvgError(`"${family}" is not one of the logo typefaces: ${Object.keys(LOGO_FONTS).join(', ')}.`)
  return family
}

// Cap height as a fraction of the font size.
function capRatio(f: opentype.Font): number {
  const os2 = (f.tables as { os2?: { sCapHeight?: number } }).os2
  if (os2?.sCapHeight) return os2.sCapHeight / f.unitsPerEm
  const b = f.charToGlyph('H').getPath(0, 0, f.unitsPerEm).getBoundingBox()
  return (b.y2 - b.y1) / f.unitsPerEm || 0.7
}

interface Line {
  d: string
  // Advance from x = 0 to the end of the text, and the ink box, baseline y = 0.
  advance: number
  x1: number
  y1: number
  x2: number
  y2: number
}

// A line of text as one outline path with the font's kerning plus tracking.
function outline(f: opentype.Font, text: string, size: number, tracking: number, x0 = 0): Line {
  const glyphs = f.stringToGlyphs(text)
  const scale = size / f.unitsPerEm
  let x = x0
  const path = new opentype.Path()
  glyphs.forEach((g, i) => {
    path.extend(g.getPath(x, 0, size))
    const kern = i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) : 0
    x += ((g.advanceWidth ?? 0) + kern) * scale + (i < glyphs.length - 1 ? tracking * size : 0)
  })
  const b = path.getBoundingBox()
  const empty = !Number.isFinite(b.x1)
  return { d: path.toPathData(1), advance: x, x1: empty ? x0 : b.x1, y1: empty ? 0 : b.y1, x2: empty ? x : b.x2, y2: empty ? 0 : b.y2 }
}

// Unit shapes in a 100 x 100 box.
function shapePath(shape: Shape): string {
  switch (shape) {
    case 'circle':
      return 'M50 0A50 50 0 1 1 49.99 0Z'
    case 'square':
      return 'M0 0H100V100H0Z'
    case 'rounded':
      return 'M24 0H76A24 24 0 0 1 100 24V76A24 24 0 0 1 76 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z'
    case 'hexagon':
      return 'M50 0L93.3 25V75L50 100L6.7 75V25Z'
    case 'diamond':
      return 'M50 0L100 50L50 100L0 50Z'
    case 'shield':
      return 'M0 6Q25 0 50 0T100 6V52Q100 82 50 100Q0 82 0 52Z'
    case 'arch':
      return 'M0 100V50A50 50 0 0 1 100 50V100Z'
  }
}

// How much of each shape a centred letter or icon can safely fill, and where
// its optical centre sits.
const INNER: Record<Shape, number> = { circle: 0.5, square: 0.6, rounded: 0.58, hexagon: 0.5, diamond: 0.38, shield: 0.5, arch: 0.52 }
const CENTRE_Y: Record<Shape, number> = { circle: 0.5, square: 0.5, rounded: 0.5, hexagon: 0.5, diamond: 0.5, shield: 0.46, arch: 0.58 }

const tf = (x: number, y: number, s: number) => `translate(${r(x)} ${r(y)}) scale(${r(s * 10000) / 10000})`

function shapeEl(shape: Shape, x: number, y: number, size: number, solid: boolean, c: string): string {
  // Outline strokes are drawn in the 100-unit shape space, so 5 = 5% of the mark.
  return `<path d="${shapePath(shape)}" transform="${tf(x, y, size / 100)}" ${solid ? `fill="${c}"` : `fill="none" stroke="${c}" stroke-width="5"`}/>`
}

// The mark drawn into a box of the given size at (x, y).
async function drawMark(mark: MarkSpec, load: FontLoader, colors: LogoSpec['colors'], x: number, y: number, size: number): Promise<string> {
  const markColor = color(colors.mark, '#1b2430')
  const ink = color(colors.markInk, '#ffffff')
  if (mark.kind === 'none') return ''
  if (mark.kind === 'monogram') {
    const letters = [...mark.letters.trim()].slice(0, 3).join('')
    if (!letters) throw new SvgError('A monogram needs one to three letters.')
    const family = checkFont(mark.font)
    const f = await font(load, family, pickWeight(family, mark.weight), letters)
    const solid = mark.style !== 'outline'
    const probe = outline(f, letters, 100, 0.02)
    const room = size * INNER[mark.shape] * (solid ? 1 : 0.92)
    const s = Math.min(room / (probe.x2 - probe.x1), room / (probe.y2 - probe.y1)) * 100
    const t = outline(f, letters, s, 0.02)
    const dx = x + size / 2 - (t.x1 + t.x2) / 2
    const dy = y + size * CENTRE_Y[mark.shape] - (t.y1 + t.y2) / 2
    return `${shapeEl(mark.shape, x, y, size, solid, markColor)}<path d="${t.d}" transform="translate(${r(dx)} ${r(dy)})" fill="${solid ? ink : markColor}"/>`
  }
  if (mark.kind === 'icon') {
    const d = ICON_PATHS[mark.icon]
    if (!d) throw new SvgError(`"${mark.icon}" is not one of the icons.`)
    if (mark.shape === 'none') return `<path d="${d}" transform="${tf(x, y, size / 256)}" fill="${markColor}"/>`
    const solid = mark.style !== 'outline'
    const box = size * INNER[mark.shape] * 1.3
    const ix = x + (size - box) / 2
    const iy = y + size * CENTRE_Y[mark.shape] - box / 2
    return `${shapeEl(mark.shape, x, y, size, solid, markColor)}<path d="${d}" transform="${tf(ix, iy, box / 256)}" fill="${solid ? ink : markColor}"/>`
  }
  // Symbol: her own drawing, cleaned, scaled into the box (inside a shape if asked).
  const clean = sanitizeSvg(mark.svg)
  const inner = clean.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  const vb = clean.svg.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number) ?? [0, 0, clean.width, clean.height]
  let back = ''
  let box = size
  let bx = x
  let by = y
  if (mark.shape && mark.shape !== 'none') {
    back = shapeEl(mark.shape, x, y, size, true, markColor)
    box = size * INNER[mark.shape] * 1.25
    bx = x + (size - box) / 2
    by = y + size * CENTRE_Y[mark.shape] - box / 2
  }
  const s = box / Math.max(vb[2], vb[3])
  const ox = bx + (box - vb[2] * s) / 2 - vb[0] * s
  const oy = by + (box - vb[3] * s) / 2 - vb[1] * s
  return `${back}<g transform="${tf(ox, oy, s)}">${inner}</g>`
}

export interface ComposedLogo {
  svg: string
  width: number
  height: number
  icon: string
}

// Wider than this and the logo shrinks to nothing in a 56px-tall header.
const MAX_RATIO = 6.2

export async function composeLogo(spec: LogoSpec, load: FontLoader = googleFontLoader): Promise<ComposedLogo> {
  let out = await composeOnce(spec, load)
  // Too wide: tighten the letter-spacing a step at a time.
  for (let i = 0; i < 6 && out.width / out.height > MAX_RATIO; i++) {
    const t = spec.name.tracking ?? 0
    const tt = spec.tagline?.tracking ?? 0.2
    if (t <= 0 && tt <= 0.1) break
    spec = { ...spec, name: { ...spec.name, tracking: Math.max(0, t - 0.05) }, ...(spec.tagline ? { tagline: { ...spec.tagline, tracking: Math.max(0.1, tt - 0.06) } } : {}) }
    out = await composeOnce(spec, load)
  }
  // A two-weight name that's too wide: stack the accent words underneath.
  if (out.width / out.height > MAX_RATIO && spec.name.accent && !spec.tagline) {
    const { accent, ...name } = spec.name
    out = await composeOnce({ ...spec, name, tagline: { text: accent.text, font: spec.name.font, weight: Math.max(accent.weight, 500), case: 'upper', tracking: 0.34 }, taglineStyle: spec.taglineStyle ?? 'plain', colors: { ...spec.colors, tagline: spec.colors.accent ?? spec.colors.tagline } }, load)
    return out
  }
  // Still too wide and no tagline: put the last word(s) on a smaller second
  // line, e.g. "SALT & STONE" over "STUDIO".
  const words = spec.name.text.trim().split(/\s+/)
  if (out.width / out.height > MAX_RATIO && !spec.tagline && !spec.name.accent && words.length >= 2) {
    const cut = Math.max(1, Math.ceil(words.length / 2))
    out = await composeOnce({ ...spec, name: { ...spec.name, text: words.slice(0, cut).join(' ') }, tagline: { text: words.slice(cut).join(' '), font: spec.name.font, weight: spec.name.weight, case: 'upper', tracking: 0.3 }, taglineStyle: 'plain' }, load)
  }
  return out
}

async function composeOnce(spec: LogoSpec, load: FontLoader): Promise<ComposedLogo> {
  const nameText = applyCase(spec.name.text.trim(), spec.name.case).slice(0, 40)
  if (!nameText) throw new SvgError('The name is empty.')
  const nameFamily = checkFont(spec.name.font)
  const nf = await font(load, nameFamily, pickWeight(nameFamily, spec.name.weight), nameText)
  const accentText = spec.name.accent?.text.trim() ? applyCase(spec.name.accent.text.trim(), spec.name.case).slice(0, 30) : ''
  const af = accentText ? await font(load, nameFamily, pickWeight(nameFamily, spec.name.accent!.weight), accentText) : null
  const tag = spec.tagline?.text.trim() ? { ...spec.tagline, text: applyCase(spec.tagline.text.trim(), spec.tagline.case).slice(0, 48) } : null
  const tagFamily = tag ? checkFont(tag.font) : ''
  const tf2 = tag ? await font(load, tagFamily, pickWeight(tagFamily, tag.weight), tag.text) : null

  const nameColor = color(spec.colors.name, '#1b2430')
  const accentColor = color(spec.colors.accent, nameColor)
  const tagColor = color(spec.colors.tagline, nameColor)
  const align = spec.align ?? (spec.layout === 'mark-left' ? 'left' : 'center')
  const frame = spec.layout === 'wordmark' ? (spec.frame ?? 'none') : 'none'

  // Lines are sized by cap height, so every typeface reads the same size.
  const nameCap = tag ? 40 : 50
  const nameSize = nameCap / capRatio(nf)
  const nameTrack = Math.max(-0.06, Math.min(0.5, spec.name.tracking ?? 0))
  const main = outline(nf, nameText, nameSize, nameTrack)
  let accent: Line | null = null
  if (af) {
    const gap = nameSize * 0.26 + nameTrack * nameSize
    accent = outline(af, accentText, nameCap / capRatio(af), nameTrack, main.advance + gap)
  }
  const nameX1 = main.x1
  const nameX2 = accent ? accent.x2 : main.x2
  const nameW = nameX2 - nameX1
  const nameBottom = Math.max(main.y2, accent?.y2 ?? 0) // below the baseline (descenders)

  let tagLine: Line | null = null
  let tagCap = 0
  if (tag && tf2) {
    const track = Math.max(0, Math.min(0.6, tag.tracking ?? 0.2))
    tagCap = nameCap * 0.3
    let t = outline(tf2, tag.text, tagCap / capRatio(tf2), track)
    const room = spec.taglineStyle === 'flanked' ? nameW * 0.72 : nameW
    if (t.x2 - t.x1 > room) {
      const k = Math.max(room / (t.x2 - t.x1), 9 / tagCap)
      tagCap *= k
      t = outline(tf2, tag.text, tagCap / capRatio(tf2), track)
    }
    tagLine = t
  }

  // Vertical rhythm: name caps from y = 0 to its baseline at nameCap; the
  // tagline's caps start one gap below the lowest ink of the name.
  const parts: string[] = []
  const blockW = Math.max(nameW, tagLine ? tagLine.x2 - tagLine.x1 : 0)
  const nameOffsetX = align === 'center' ? (blockW - nameW) / 2 : 0
  parts.push(`<path d="${main.d}" transform="translate(${r(nameOffsetX - nameX1)} ${r(nameCap)})" fill="${nameColor}"/>`)
  if (accent) parts.push(`<path d="${accent.d}" transform="translate(${r(nameOffsetX - nameX1)} ${r(nameCap)})" fill="${accentColor}"/>`)
  let bottom = nameCap + Math.max(0, nameBottom)
  if (tagLine) {
    const style = spec.taglineStyle ?? 'plain'
    const gap = nameCap * (style === 'rule' ? 0.5 : 0.32)
    const tagTop = nameCap + Math.max(nameBottom * 0.6, 0) + gap
    const tagW = tagLine.x2 - tagLine.x1
    const centred = align === 'center' || style === 'flanked'
    const tagX = (centred ? (blockW - tagW) / 2 : 0) - tagLine.x1
    const line = Math.max(1.4, nameCap * 0.04)
    if (style === 'rule') {
      const ry = nameCap + Math.max(nameBottom * 0.6, 0) + gap / 2
      parts.push(`<rect x="${r(nameOffsetX)}" y="${r(ry - line / 2)}" width="${r(nameW)}" height="${r(line)}" fill="${tagColor}"/>`)
    }
    if (style === 'flanked') {
      const cy = tagTop + tagCap / 2
      const pad = tagCap * 0.9
      const left = (blockW - tagW) / 2
      if (left - pad > tagCap) {
        parts.push(`<rect x="${r(nameOffsetX)}" y="${r(cy - line / 2)}" width="${r(left - pad - nameOffsetX)}" height="${r(line)}" fill="${tagColor}"/>`)
        parts.push(`<rect x="${r(left + tagW + pad)}" y="${r(cy - line / 2)}" width="${r(left - pad - nameOffsetX)}" height="${r(line)}" fill="${tagColor}"/>`)
      }
    }
    parts.push(`<path d="${tagLine.d}" transform="translate(${r(tagX)} ${r(tagTop + tagCap)})" fill="${tagColor}"/>`)
    bottom = tagTop + tagCap + Math.max(0, tagLine.y2)
  }

  let body = parts.join('')
  let x0 = 0
  let y0 = Math.min(0, Math.min(main.y1, accent?.y1 ?? 0) + nameCap) // ascenders above cap height
  let x1 = blockW
  let y1 = bottom
  // A frame around a wordmark.
  if (frame !== 'none') {
    const padY = nameCap * 0.55
    const padX = frame === 'pill' ? nameCap * 1.1 : nameCap * 0.75
    const fx = x0 - padX
    const fy = y0 - padY
    const fw = x1 - x0 + padX * 2
    const fh = y1 - y0 + padY * 2
    const sw = Math.max(1.8, nameCap * 0.05)
    body += `<rect x="${r(fx)}" y="${r(fy)}" width="${r(fw)}" height="${r(fh)}" rx="${r(frame === 'pill' ? fh / 2 : sw)}" fill="none" stroke="${tagColor}" stroke-width="${r(sw)}"/>`
    x0 = fx - sw
    y0 = fy - sw
    x1 = fx + fw + sw
    y1 = fy + fh + sw
  }
  // A mark to the left, centred on the text block.
  if (spec.layout === 'mark-left' && spec.mark.kind !== 'none') {
    const h = y1 - y0
    const size = Math.max(h * 1.2, 58)
    const gap = size * 0.24
    const my = y0 + h / 2 - size / 2
    body = `${await drawMark(spec.mark, load, spec.colors, -size - gap, my, size)}${body}`
    x0 = -size - gap
    y0 = Math.min(y0, my)
    y1 = Math.max(y1, my + size)
  }
  const pad = 4
  const width = x1 - x0 + pad * 2
  const height = y1 - y0 + pad * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x0 - pad)} ${r(y0 - pad)} ${r(width)} ${r(height)}">${body}</svg>`

  // The square icon: the mark on a solid shape, or a monogram of the first letter.
  const first = [...nameText.replace(/^the\s+/i, '')][0] ?? 'S'
  const iconMark: MarkSpec =
    spec.mark.kind === 'none'
      ? { kind: 'monogram', letters: first, shape: 'rounded', style: 'solid', font: nameFamily, weight: spec.name.weight }
      : spec.mark.kind === 'monogram'
        ? { ...spec.mark, style: 'solid' }
        : spec.mark.kind === 'icon'
          ? { ...spec.mark, shape: spec.mark.shape === 'none' ? 'rounded' : spec.mark.shape, style: 'solid' }
          : spec.mark
  const iconColors = spec.mark.kind === 'none' ? { ...spec.colors, mark: nameColor } : spec.colors
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${await drawMark(iconMark, load, iconColors, 3, 3, 58)}</svg>`

  // Final safety pass over both files.
  const clean = sanitizeSvg(svg, 150_000)
  const cleanIcon = sanitizeSvg(icon, 60_000)
  return { svg: clean.svg, width: clean.width, height: clean.height, icon: cleanIcon.svg }
}

// ---------------------------------------------------------------------------
// The flat form Sofie fills in (flat fields are easier to get right).
// ---------------------------------------------------------------------------

const FONT_NAMES = Object.keys(LOGO_FONTS)
const CASES = ['as-is', 'upper', 'lower']
export const LOGO_SPEC_PROPERTIES = {
  layout: { type: 'string', enum: ['wordmark', 'mark-left'], description: 'wordmark: the name (and tagline) only, optionally framed. mark-left: a mark to the left of the name.' },
  name_text: { type: 'string', description: 'The main word(s) of the name, e.g. "Rivertown".' },
  name_accent_text: { type: 'string', description: 'Optional further words on the SAME line in a contrasting weight, e.g. "Plumbing" (bold "Rivertown" + light "Plumbing"). "" for none.' },
  name_font: { type: 'string', enum: FONT_NAMES },
  name_weight: { type: 'integer', description: 'Nearest available weight is used.' },
  name_accent_weight: { type: 'integer', description: 'Weight of the accent words; contrast it strongly with name_weight (e.g. 800 vs 300).' },
  name_case: { type: 'string', enum: CASES },
  name_tracking: { type: 'number', description: 'Letter-spacing in em. Lowercase/mixed display: -0.03 to 0.01. Uppercase: 0.04 to 0.18.' },
  tagline_text: { type: 'string', description: 'Short second line (trade, town, "Est. 2019") or "" for none.' },
  tagline_font: { type: 'string', enum: FONT_NAMES },
  tagline_weight: { type: 'integer' },
  tagline_case: { type: 'string', enum: CASES },
  tagline_tracking: { type: 'number', description: 'Uppercase taglines: 0.18 to 0.4.' },
  tagline_style: { type: 'string', enum: ['plain', 'rule', 'flanked'], description: 'rule: a line between name and tagline. flanked: short lines either side of a centred tagline.' },
  align: { type: 'string', enum: ['left', 'center'] },
  frame: { type: 'string', enum: ['none', 'box', 'pill'], description: 'Wordmark only: a thin border around it, like a badge.' },
  mark_kind: { type: 'string', enum: ['none', 'monogram', 'icon', 'symbol'], description: 'icon: a professionally drawn icon from the list (preferred over symbol).' },
  mark_icon: { type: 'string', enum: LOGO_ICONS, description: 'Icon name, for mark_kind icon.' },
  mark_letters: { type: 'string', description: 'Monogram: one or two letters.' },
  mark_shape: { type: 'string', enum: [...MARK_SHAPES, 'none'], description: 'The shape the monogram or icon sits in ("none" for a bare icon).' },
  mark_style: { type: 'string', enum: ['solid', 'outline'], description: 'Solid shape with light letters/icon, or an outlined shape.' },
  mark_font: { type: 'string', enum: FONT_NAMES },
  mark_weight: { type: 'integer' },
  symbol_svg: { type: 'string', description: 'Only if no icon fits: your own simple drawing, one <svg viewBox="0 0 64 64"> of a few bold filled shapes.' },
  name_color: { type: 'string', description: '#rrggbb' },
  accent_color: { type: 'string', description: '#rrggbb for the accent words ("" = same as name)' },
  tagline_color: { type: 'string', description: '#rrggbb (also used for rules and frames)' },
  mark_color: { type: 'string', description: '#rrggbb, the shape colour' },
  mark_ink_color: { type: 'string', description: '#rrggbb, the letters or icon on a solid shape' },
} as const
export const LOGO_SPEC_REQUIRED = ['layout', 'name_text', 'name_font', 'name_weight', 'name_case', 'mark_kind', 'name_color', 'mark_color', 'mark_ink_color'] as const

export function specFromInput(i: Record<string, unknown>): LogoSpec {
  const str = (k: string, d = '') => (typeof i[k] === 'string' && (i[k] as string).length ? (i[k] as string) : d)
  const num = (k: string, d: number) => (typeof i[k] === 'number' && Number.isFinite(i[k]) ? (i[k] as number) : d)
  const tcase = (k: string) => (CASES.includes(str(k)) ? (str(k) as TextCase) : 'as-is')
  const shapeIn = str('mark_shape', 'circle')
  const shape = (MARK_SHAPES as readonly string[]).includes(shapeIn) ? (shapeIn as Shape) : null
  const kind = str('mark_kind', 'none')
  const style = str('mark_style') === 'outline' ? 'outline' : 'solid'
  const mark: MarkSpec =
    kind === 'monogram'
      ? { kind, letters: str('mark_letters', str('name_text').charAt(0)), shape: shape ?? 'circle', style, font: str('mark_font', str('name_font')), weight: num('mark_weight', num('name_weight', 700)) }
      : kind === 'icon'
        ? { kind, icon: str('mark_icon'), shape: shape ?? 'none', style }
        : kind === 'symbol'
          ? { kind, svg: str('symbol_svg'), shape: shape ?? 'none' }
          : { kind: 'none' }
  const frame = str('frame')
  const tStyle = str('tagline_style')
  return {
    layout: str('layout') === 'mark-left' && kind !== 'none' ? 'mark-left' : 'wordmark',
    name: {
      text: str('name_text'),
      font: str('name_font'),
      weight: num('name_weight', 700),
      case: tcase('name_case'),
      tracking: num('name_tracking', 0),
      ...(str('name_accent_text').trim() ? { accent: { text: str('name_accent_text'), weight: num('name_accent_weight', 300) } } : {}),
    },
    ...(str('tagline_text').trim()
      ? { tagline: { text: str('tagline_text'), font: str('tagline_font', str('name_font')), weight: num('tagline_weight', 600), case: tcase('tagline_case'), tracking: num('tagline_tracking', 0.24) } }
      : {}),
    taglineStyle: tStyle === 'rule' || tStyle === 'flanked' ? tStyle : 'plain',
    align: str('align') === 'left' ? 'left' : str('align') === 'center' ? 'center' : undefined,
    frame: frame === 'box' || frame === 'pill' ? frame : 'none',
    mark,
    colors: { name: str('name_color'), accent: str('accent_color') || undefined, tagline: str('tagline_color') || undefined, mark: str('mark_color'), markInk: str('mark_ink_color') },
  }
}

export const LOGO_CRAFT = `How to design a logo that looks professionally made:
- Start from a proven structure and make it specific. Good structures:
  • Classic wordmark: the name in a characterful typeface, centred, with a small tracked uppercase tagline, often "flanked" by short lines (bakeries, cafes, barbers, restaurants).
  • Framed badge: an uppercase wordmark in a thin box or pill frame with a tagline (heritage trades, coffee, barbers, breweries).
  • Two-weight name: first word heavy, second word light on the same line, e.g. RIVERTOWN (800) Plumbing (300), same typeface (trades, studios, consultants).
  • Icon lockup: a professionally drawn icon of the trade (bread, wrench, drop, scissors, tooth, paw-print, leaf, house-line…) in a solid circle or rounded square, left of the name, with a short tagline (almost any local business).
  • Monogram lockup: one or two letters in a shape (arch for bakeries and florists, shield for trades and security, circle or rounded for clinics) beside the name.
- Typography does the work. Pick the typeface for the business's character, then commit: weight, case and letter-spacing are the design. Uppercase needs air (0.04 to 0.18); lowercase and mixed case sits tight (-0.03 to 0.01). Never track lowercase wide.
- A tagline is small, calm, uppercase and tracked 0.18 to 0.4, in a plain sans (Manrope, Archivo, Figtree, Josefin Sans) or the same family. One to four words. Leave it out if the name is long.
- At most two typefaces. Contrast comes from weight, size and case, not from many fonts.
- Marks: prefer a drawn icon from the list over your own symbol. Icons read best in a solid shape with light ink. One idea only.
- Colour: the name in a deep, near-black version of the brand colour; mark, accent word, tagline and rules in the brand accent. Two or three colours in total, with strong contrast.
- Proportion: the whole logo roughly 2.5:1 to 5:1 wide; it is shown 56px tall. Long names: no mark or a compact one, no tagline or a very short one.
- Avoid: generic combinations (plain sans + circle with a letter), clip-art feel, gradients, more than one idea at once, and anything imitating a well-known brand.`
