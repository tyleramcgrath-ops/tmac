// Builds finished logos from a designer's spec. Sofie art-directs (typeface,
// weight, spacing, layout, mark, colours); this file does the craft that is
// hard to do blind: real typefaces turned into vector outlines (so the logo
// looks the same on every device, with proper kerning), exact measuring,
// optical centring and even spacing. The output is plain SVG shapes.

import * as opentype from 'opentype.js'
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
  'Roboto Slab': { style: 'sturdy slab serif (builders, auto, trades)', weights: [500, 600, 700, 800] },
  Manrope: { style: 'modern, clean sans (clinics, studios, consultants)', weights: [500, 600, 700, 800] },
  Sora: { style: 'geometric, crisp sans (tech, cleaning, modern services)', weights: [500, 600, 700, 800] },
  Outfit: { style: 'round geometric friendly sans', weights: [500, 600, 700, 800] },
  Archivo: { style: 'sturdy grotesque sans, dependable (trades, logistics)', weights: [600, 700, 800, 900] },
  Figtree: { style: 'friendly, open sans', weights: [600, 700, 800, 900] },
  Oswald: { style: 'strong condensed sans (plumbers, roofers, gyms)', weights: [500, 600, 700] },
  'Barlow Condensed': { style: 'industrial condensed sans (electricians, mechanics)', weights: [600, 700, 800] },
  'Bebas Neue': { style: 'tall all-caps condensed display, punchy', weights: [400] },
  Nunito: { style: 'rounded, soft and friendly (childcare, pets, dentists)', weights: [700, 800, 900] },
  'Josefin Sans': { style: 'vintage geometric sans, elegant caps (barbers, boutiques)', weights: [400, 600, 700] },
  Unbounded: { style: 'wide, modern display sans (bold modern brands)', weights: [500, 700, 900] },
}

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
  // A symbol Sofie draws herself in a 0 0 64 64 box; optionally on a filled shape.
  | { kind: 'symbol'; svg: string; shape?: Shape | 'none' }
export interface LogoSpec {
  layout: 'wordmark' | 'mark-left'
  name: TextSpec
  tagline?: TextSpec
  mark: MarkSpec
  colors: { name: string; tagline?: string; mark: string; markInk: string }
  // A thin line between the name and the tagline.
  rule?: boolean
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
  const key = `${family}|${weight}|${text}`
  let f = cache.get(key)
  if (!f) {
    f = load(family, weight, text).then((buf) => opentype.parse(buf))
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

interface Ink {
  d: string
  x1: number
  y1: number
  x2: number
  y2: number
}

// A line of text as one outline path, laid out glyph by glyph with the
// font's kerning plus tracking. Baseline at y = 0, starting at x = 0.
function outline(f: opentype.Font, text: string, size: number, tracking: number): Ink {
  const glyphs = f.stringToGlyphs(text)
  const scale = size / f.unitsPerEm
  let x = 0
  const path = new opentype.Path()
  glyphs.forEach((g, i) => {
    const p = g.getPath(x, 0, size)
    path.extend(p)
    const kern = i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) : 0
    x += ((g.advanceWidth ?? 0) + kern) * scale + (i < glyphs.length - 1 ? tracking * size : 0)
  })
  const b = path.getBoundingBox()
  return { d: path.toPathData(1), x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 }
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

// How much of each shape a centred letter can safely fill.
const INNER: Record<Shape, number> = { circle: 0.5, square: 0.6, rounded: 0.58, hexagon: 0.5, diamond: 0.38, shield: 0.5, arch: 0.52 }

const tf = (x: number, y: number, s: number) => `translate(${r(x)} ${r(y)}) scale(${r(s * 10000) / 10000})`

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
    const shape = `<path d="${shapePath(mark.shape)}" transform="${tf(x, y, size / 100)}" ${solid ? `fill="${markColor}"` : `fill="none" stroke="${markColor}" stroke-width="5"`}/>`
    // Scale the letters so their ink fits the shape's inner area, then centre the ink optically.
    const probe = outline(f, letters, 100, 0.02)
    const w = probe.x2 - probe.x1
    const h = probe.y2 - probe.y1
    const room = size * INNER[mark.shape] * (solid ? 1 : 0.92)
    const s = Math.min(room / w, room / h) * 100
    const t = outline(f, letters, s, 0.02)
    const cx = x + size / 2
    const cy = y + size * (mark.shape === 'arch' ? 0.58 : mark.shape === 'shield' ? 0.46 : 0.5)
    const dx = cx - (t.x1 + t.x2) / 2
    const dy = cy - (t.y1 + t.y2) / 2
    return `${shape}<path d="${t.d}" transform="translate(${r(dx)} ${r(dy)})" fill="${solid ? ink : markColor}"/>`
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
    back = `<path d="${shapePath(mark.shape)}" transform="${tf(x, y, size / 100)}" fill="${markColor}"/>`
    box = size * INNER[mark.shape] * 1.25
    bx = x + (size - box) / 2
    by = y + (size - box) / 2
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
  // Too wide: tighten the letter-spacing a step at a time before giving up.
  for (let i = 0; i < 6 && out.width / out.height > MAX_RATIO; i++) {
    const t = spec.name.tracking ?? 0
    const tt = spec.tagline?.tracking ?? 0.18
    if (t <= 0 && tt <= 0.1) break
    spec = { ...spec, name: { ...spec.name, tracking: Math.max(0, t - 0.05) }, ...(spec.tagline ? { tagline: { ...spec.tagline, tracking: Math.max(0.1, tt - 0.06) } } : {}) }
    out = await composeOnce(spec, load)
  }
  // Still too wide and no tagline: put the last word(s) on a smaller second
  // line, e.g. "SALT & STONE" over "STUDIO".
  const words = spec.name.text.trim().split(/\s+/)
  if (out.width / out.height > MAX_RATIO && !spec.tagline && words.length >= 2) {
    const cut = Math.max(1, Math.ceil(words.length / 2))
    out = await composeOnce({ ...spec, name: { ...spec.name, text: words.slice(0, cut).join(' ') }, tagline: { text: words.slice(cut).join(' '), font: spec.name.font, weight: spec.name.weight, case: 'upper', tracking: 0.3 } }, load)
  }
  return out
}

async function composeOnce(spec: LogoSpec, load: FontLoader): Promise<ComposedLogo> {
  const nameText = applyCase(spec.name.text.trim(), spec.name.case).slice(0, 40)
  if (!nameText) throw new SvgError('The name is empty.')
  const nameFamily = checkFont(spec.name.font)
  const nf = await font(load, nameFamily, pickWeight(nameFamily, spec.name.weight), nameText)
  const tag = spec.tagline?.text.trim() ? { ...spec.tagline, text: applyCase(spec.tagline.text.trim(), spec.tagline.case).slice(0, 48) } : null
  const tf2 = tag ? await font(load, checkFont(tag.font), pickWeight(tag.font, tag.weight), tag.text) : null

  // Everything is measured on a 100-unit-tall canvas, then cropped to its ink.
  const nameTrack = Math.max(-0.06, Math.min(0.5, spec.name.tracking ?? 0))
  const tagTrack = Math.max(0, Math.min(0.6, tag?.tracking ?? 0.18))
  const probe = outline(nf, nameText, 100, nameTrack)
  const nameInkH = tag ? 44 : 58
  const nameSize = (100 * nameInkH) / (probe.y2 - probe.y1)
  const name = outline(nf, nameText, nameSize, nameTrack)
  let tagInk: Ink | null = null
  if (tag && tf2) {
    const tp = outline(tf2, tag.text, 100, tagTrack)
    // Tagline cap height about a third of the name's, but never wider than the name.
    let size = (100 * nameInkH * 0.3) / (tp.y2 - tp.y1)
    const nameW = name.x2 - name.x1
    if ((tp.x2 - tp.x1) * (size / 100) > nameW) size = (100 * nameW) / (tp.x2 - tp.x1)
    tagInk = outline(tf2, tag.text, size, tagTrack)
  }

  const gap = tag ? nameInkH * (spec.rule ? 0.5 : 0.3) : 0
  const tagH = tagInk ? tagInk.y2 - tagInk.y1 : 0
  const blockH = nameInkH + (tagInk ? gap + tagH : 0)
  const hasMark = spec.layout === 'mark-left' && spec.mark.kind !== 'none'
  const markSize = hasMark ? Math.max(blockH * 1.15, 64) : 0
  const H = Math.max(blockH, markSize)
  const textX = hasMark ? markSize + markSize * 0.24 : 0
  const top = (H - blockH) / 2

  const parts: string[] = []
  const nameColor = color(spec.colors.name, '#1b2430')
  const tagColor = color(spec.colors.tagline, nameColor)
  // Name: left edge of ink at textX, top of ink at `top`.
  const nx = textX - name.x1
  const ny = top - name.y1
  parts.push(`<path d="${name.d}" transform="translate(${r(nx)} ${r(ny)})" fill="${nameColor}"/>`)
  const nameW = name.x2 - name.x1
  if (tagInk) {
    const ty = top + nameInkH + gap - tagInk.y1
    const tagW = tagInk.x2 - tagInk.x1
    // Centre the tagline under the name when it's much narrower; else align left.
    const tx = textX + (tagW < nameW * 0.8 ? (nameW - tagW) / 2 : 0) - tagInk.x1
    if (spec.rule) {
      const ry = top + nameInkH + gap / 2
      parts.push(`<rect x="${r(textX)}" y="${r(ry - 0.9)}" width="${r(nameW)}" height="1.8" fill="${tagColor}"/>`)
    }
    parts.push(`<path d="${tagInk.d}" transform="translate(${r(tx)} ${r(ty)})" fill="${tagColor}"/>`)
  }
  if (hasMark) parts.unshift(await drawMark(spec.mark, load, spec.colors, 0, (H - markSize) / 2, markSize))

  const pad = 4
  const W = textX + Math.max(nameW, tagInk ? tagInk.x2 - tagInk.x1 : 0)
  const width = W + pad * 2
  const height = H + pad * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(-pad)} ${r(-pad)} ${r(width)} ${r(height)}">${parts.join('')}</svg>`

  // The square icon: the mark, or a monogram of the first letter.
  const iconMark: MarkSpec =
    spec.mark.kind === 'none'
      ? { kind: 'monogram', letters: [...nameText.replace(/^the\s+/i, '')][0] ?? 'S', shape: 'rounded', style: 'solid', font: nameFamily, weight: spec.name.weight }
      : spec.mark.kind === 'symbol' && (!spec.mark.shape || spec.mark.shape === 'none')
        ? spec.mark
        : spec.mark.kind === 'monogram'
          ? { ...spec.mark, style: 'solid' }
          : spec.mark
  const iconColors = spec.mark.kind === 'none' ? { ...spec.colors, mark: nameColor, markInk: color(spec.colors.markInk, '#ffffff') } : spec.colors
  const iconBody = await drawMark(iconMark, load, iconColors, 4, 4, 56)
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${iconBody}</svg>`

  // Final safety pass over both files.
  const clean = sanitizeSvg(svg, 120_000)
  const cleanIcon = sanitizeSvg(icon, 60_000)
  return { svg: clean.svg, width: clean.width, height: clean.height, icon: cleanIcon.svg }
}

// ---------------------------------------------------------------------------
// The flat form Sofie fills in (flat fields are easier to get right).
// ---------------------------------------------------------------------------

const FONT_NAMES = Object.keys(LOGO_FONTS)
export const LOGO_SPEC_PROPERTIES = {
  layout: { type: 'string', enum: ['wordmark', 'mark-left'], description: 'wordmark: the name (and tagline) only. mark-left: a mark to the left of the name.' },
  name_text: { type: 'string', description: 'The business name as it should read, e.g. "Juniper" with tagline "Bakehouse", or the full name.' },
  name_font: { type: 'string', enum: FONT_NAMES },
  name_weight: { type: 'integer', description: 'Nearest available weight is used.' },
  name_case: { type: 'string', enum: ['as-is', 'upper', 'lower'] },
  name_tracking: { type: 'number', description: 'Letter-spacing in em. Lowercase display: -0.02 to 0.02. Uppercase: 0.04 to 0.2.' },
  tagline_text: { type: 'string', description: 'Short second line (trade, town or both) or "" for none.' },
  tagline_font: { type: 'string', enum: FONT_NAMES },
  tagline_weight: { type: 'integer' },
  tagline_case: { type: 'string', enum: ['as-is', 'upper', 'lower'] },
  tagline_tracking: { type: 'number', description: 'Uppercase taglines look best tracked 0.18 to 0.4.' },
  rule: { type: 'boolean', description: 'A thin line between the name and the tagline.' },
  mark_kind: { type: 'string', enum: ['none', 'monogram', 'symbol'] },
  mark_letters: { type: 'string', description: 'Monogram: one or two letters.' },
  mark_shape: { type: 'string', enum: [...MARK_SHAPES, 'none'], description: 'The shape the monogram or symbol sits in.' },
  mark_style: { type: 'string', enum: ['solid', 'outline'], description: 'Monogram: filled shape with light letters, or an outlined shape.' },
  mark_font: { type: 'string', enum: FONT_NAMES },
  mark_weight: { type: 'integer' },
  symbol_svg: { type: 'string', description: 'Symbol only: your own simple drawing, one <svg viewBox="0 0 64 64"> of a few bold filled shapes. On a shape, draw it in the mark ink colour.' },
  name_color: { type: 'string', description: '#rrggbb' },
  tagline_color: { type: 'string', description: '#rrggbb' },
  mark_color: { type: 'string', description: '#rrggbb, the shape colour' },
  mark_ink_color: { type: 'string', description: '#rrggbb, the letters or symbol on a solid shape' },
} as const
export const LOGO_SPEC_REQUIRED = ['layout', 'name_text', 'name_font', 'name_weight', 'name_case', 'mark_kind', 'name_color', 'mark_color', 'mark_ink_color'] as const

export function specFromInput(i: Record<string, unknown>): LogoSpec {
  const str = (k: string, d = '') => (typeof i[k] === 'string' ? (i[k] as string) : d)
  const num = (k: string, d: number) => (typeof i[k] === 'number' && Number.isFinite(i[k]) ? (i[k] as number) : d)
  const tcase = (k: string) => (['as-is', 'upper', 'lower'].includes(str(k)) ? (str(k) as TextCase) : 'as-is')
  const shape = str('mark_shape', 'circle')
  const kind = str('mark_kind', 'none')
  const mark: MarkSpec =
    kind === 'monogram'
      ? { kind, letters: str('mark_letters', str('name_text').charAt(0)), shape: (MARK_SHAPES as readonly string[]).includes(shape) ? (shape as Shape) : 'circle', style: str('mark_style') === 'outline' ? 'outline' : 'solid', font: str('mark_font', str('name_font')), weight: num('mark_weight', num('name_weight', 700)) }
      : kind === 'symbol'
        ? { kind, svg: str('symbol_svg'), shape: (MARK_SHAPES as readonly string[]).includes(shape) ? (shape as Shape) : 'none' }
        : { kind: 'none' }
  return {
    layout: str('layout') === 'mark-left' && kind !== 'none' ? 'mark-left' : 'wordmark',
    name: { text: str('name_text'), font: str('name_font'), weight: num('name_weight', 700), case: tcase('name_case'), tracking: num('name_tracking', 0) },
    ...(str('tagline_text').trim()
      ? { tagline: { text: str('tagline_text'), font: str('tagline_font', str('name_font')), weight: num('tagline_weight', 600), case: tcase('tagline_case'), tracking: num('tagline_tracking', 0.24) } }
      : {}),
    rule: i.rule === true,
    mark,
    colors: { name: str('name_color'), tagline: str('tagline_color') || undefined, mark: str('mark_color'), markInk: str('mark_ink_color') },
  }
}

export const LOGO_CRAFT = `How to design a logo that looks professionally made:
- Typography first. Most great small-business logos are the name, beautifully set. Pick the typeface for the business's character (see the list), then commit: weight, case and letter-spacing are the design.
- Uppercase needs air: track it 0.04 to 0.2 (condensed faces 0.02 to 0.08). Lowercase and mixed-case display type sits tight: -0.02 to 0.02. Never track lowercase wide.
- A tagline is small, calm and usually uppercase, tracked 0.18 to 0.4, in a quieter colour or a simple sans. Keep it to one to four words. Leave it out if the name is long.
- Pair at most two typefaces: a characterful one for the name and a plain one for the tagline (or the same family).
- Marks are optional and simple: a one- or two-letter monogram in a shape (circle, rounded square, arch, shield, hexagon, diamond), solid or outlined. Draw a symbol only if a simple, bold idea clearly fits (a loaf, a drop, a leaf, a house gable, a spanner): 2 to 6 filled shapes on a 64 grid, no thin lines, no detail.
- Colour: the name in a deep, near-black version of the brand colour; the mark and tagline in the brand accent. Two or three colours total. Check contrast: light ink on a dark shape.
- Proportion: the whole logo should be roughly 2.5:1 to 6:1 wide. Long names: no mark or a compact monogram, no tagline or a very short one.
- Avoid: clip-art, swooshes, globes, lightbulbs, gradients, more than one idea at once, and anything that imitates a well-known brand.`
