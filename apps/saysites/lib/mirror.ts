// "Your site, as it is": a page of the owner's current website rebuilt on
// SaySites section by section, in their order, with their words, photos,
// colours, fonts and columns. It stays a normal SaySites page (editable,
// no scripts, sized images), so it passes the speed check where the
// original often doesn't. Read from the markup and stylesheets only; no
// browser runs and no AI.

import { Styles, toHex, type Look } from './css-lite'
import { ancestors, classes, descendants, find, findAll, isEl, parseHtml, textOf, type El } from './dom'
import { fullSize, luminance } from './lookalike'
import type { Container, Element, ElementStyle, GlobalStyles, Widget } from './schema'

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'iframe', 'template', 'nav', 'button', 'select', 'input', 'textarea', 'label', 'canvas', 'video', 'audio', 'object', 'embed', 'head', 'link', 'meta', 'title', 'map', 'dialog'])
const SKIP_CLASS = /(^|[\s_-])(screen-reader|sr-only|visually-hidden|skip-link|cookie|gdpr|popup|modal|mfp-hide|lightbox|offcanvas|off-canvas|mobile-menu|breadcrumbs?|share|sharing|social|pagination|wpcf7-response|av-desktop-hide|hide-desktop|hide-on-desktop|elementor-hidden-desktop|visible-xs|visible-sm|hidden-lg|hidden-md|d-lg-none|d-md-none|ls-tn|slideshow-controls|slideshow-dots|slideshow-arrows|scroll-top|back-to-top)([\s_-]|$)/i
const HEADER = /(^|[\s_-])(site-header|main-header|header-wrap|masthead|elementor-location-header|fusion-header-wrapper|et-l--header|top-header|header_main)([\s_-]|$)|^header$/i
const FOOTER = /(^|[\s_-])(site-footer|footer-wrap|colophon|socket|elementor-location-footer|fusion-footer|et-l--footer|main-footer)([\s_-]|$)|^footer$/i
const SIDEBAR = /(^|[\s_-])(sidebar|widget-area|secondary)([\s_-]|$)/i
const SECTION = /(^|[\s_-])(section|slider|slideshow|hero|banner|band|strip|container_wrap|fullwidth|full-width|wp-block-cover|wp-block-group|vc_row|fl-row|et_pb_section|elementor-section|e-parent|fusion-fullwidth|avia-section|av-layout-grid-container|row)([\s_-]|$)/i
const COLUMN = /(^|[\s_-])(flex_column|et_pb_column|elementor-column|e-child|wp-block-column|fl-col|vc_column|wpb_column|fusion-layout-column|col-(?:xs|sm|md|lg|xl)-\d+|col-\d+|av_one_\w+|av_two_\w+|av_three_\w+|av_four_\w+|one_half|one_third|two_third|one_fourth|three_fourth|column)([\s_-]|$)/i
const INLINE = new Set(['a', 'span', 'strong', 'b', 'em', 'i', 'u', 'small', 'mark', 'sup', 'sub', 'abbr', 'cite', 'code', 'time', 'font', 'q', 'del', 'ins', 's', 'br', 'wbr'])
// Slides after the first, in any slider: only the first shows on arrival.
const SLIDE = /(^|[\s_-])(ls-slide|slide|swiper-slide|carousel-item|rev-slide|n2-ss-slide|slick-slide|avia-slideshow-slide)([\s_-]|$)/i
// Photos used as a box's background (a slider's or a cover block's).
const BG_IMG = /(^|[\s_-])(ls-bg|rev-slidebg|slide-bg|bg-img|bg-image|background-image|hero-bg|wp-block-cover__image-background|elementor-background-slideshow__slide__image)([\s_-]|$)/i
const NOT_PHOTO = /logo|icon|sprite|avatar|badge|seal|award|placeholder|blank|spacer|pixel|loader|arrow|emoji|gravatar|\.svg(\?|$)|\.gif(\?|$)/i

export interface Chrome {
  logo?: string
  nav: { label: string; href: string }[]
  topbar?: string
  cta?: { label: string; href: string }
  colors?: { background: string; text: string; topbarBackground?: string; topbarText?: string }
  footerNote?: string
}

export interface MirrorContext {
  url: string
  name: string
  styles: Styles
  idBase: string
  // Old address → new page address, for links and buttons.
  link: (href: string) => string | undefined
  // Photos already used elsewhere on the site, so each shows once.
  used: Set<string>
}

export interface MirroredPage {
  body: Container[]
  h1?: string
}

// ---------------------------------------------------------------------------
// Regions: header, footer and the page's own content between them
// ---------------------------------------------------------------------------

const key = (el: El) => `${el.tag} ${el.attrs.id ?? ''} ${el.attrs.class ?? ''} ${el.attrs.role ?? ''}`
const matchKey = (re: RegExp, el: El) => re.test(el.tag) || re.test(el.attrs.id ?? '') || classes(el).some((c) => re.test(c)) || (re === HEADER && el.attrs.role === 'banner') || (re === FOOTER && el.attrs.role === 'contentinfo')

export function regions(root: El): { body: El; header?: El; footers: El[] } {
  const body = find(root, (e) => e.tag === 'body') ?? root
  const header = find(body, (e) => matchKey(HEADER, e) && !ancestors(e).some((a) => matchKey(HEADER, a)) && !!find(e, (d) => d.tag === 'img' || d.tag === 'a'))
  const footers = findAll(body, (e) => matchKey(FOOTER, e) && !ancestors(e).some((a) => matchKey(FOOTER, a)) && e !== body)
  return { body, header, footers }
}

function skipped(el: El, st: Styles, cut: Set<El>): boolean {
  if (cut.has(el) || SKIP_TAGS.has(el.tag)) return true
  if (el.attrs['aria-hidden'] === 'true' || el.attrs.hidden !== undefined || el.attrs.role === 'navigation' || el.attrs.role === 'dialog') return true
  if (SKIP_CLASS.test(el.attrs.class ?? '') || SKIP_CLASS.test(el.attrs.id ?? '')) return true
  if (SLIDE.test(el.attrs.class ?? '') && el.parent) {
    const sibs = el.parent.children.filter(isEl).filter((s) => SLIDE.test(s.attrs.class ?? ''))
    if (sibs.length > 1 && sibs[0] !== el) return true
  }
  if (el.tag === 'aside' || SIDEBAR.test(el.attrs.id ?? '') || classes(el).some((c) => SIDEBAR.test(c) && c !== 'secondary')) return true
  // Hidden by the site's styles: phone-only copies, menus and pop-ups stay
  // out; slides, tabs and accordions (shown by a script) stay in.
  const hidden = st.look(el).hidden
  return hidden === 'inline' ? !/slide|tab|panel|accordion|toggle/i.test(el.attrs.class ?? '') : hidden === 'sheet' && /mobile|phone|tablet|small|mini|(^|[\s_-])(xs|sm)([\s_-]|$)|hide|hidden|modal|popup|dropdown|sub-?menu|mega|overlay|search/i.test(`${el.attrs.class ?? ''} ${el.attrs.id ?? ''}`)
}

// ---------------------------------------------------------------------------
// Blocks: the page's content in reading order
// ---------------------------------------------------------------------------

type Block =
  | { kind: 'h'; level: number; text: string; look: Look }
  | { kind: 'p'; text: string; look: Look; list?: boolean }
  | { kind: 'img'; src: string; alt: string; width: number; height: number }
  | { kind: 'btn'; label: string; href: string }
  | { kind: 'form'; label: string }
  | { kind: 'cols'; key: El; cols: { el: El; frac?: number; first: boolean; blocks: Block[]; bg?: string }[] }

function imgSrc(el: El, base: string): string | undefined {
  const set = el.attrs['data-srcset'] || el.attrs.srcset || ''
  // The largest file in the srcset, else the plain source.
  const best = set
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter((p) => p[0] && /^\d+w$/.test(p[1] ?? ''))
    .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))[0]?.[0]
  const raw = el.attrs['data-src'] || el.attrs['data-lazy-src'] || el.attrs['data-original'] || (el.attrs.src?.startsWith('data:') ? '' : el.attrs.src) || best || ''
  if (!raw) return undefined
  try {
    const u = new URL(raw, base)
    if (u.protocol === 'http:') u.protocol = 'https:'
    return u.protocol === 'https:' ? u.href : undefined
  } catch {
    return undefined
  }
}

function frac(el: El): number | undefined {
  const c = el.attrs.class ?? ''
  const words: Record<string, number> = { one_full: 1, one_half: 1 / 2, one_third: 1 / 3, two_third: 2 / 3, one_fourth: 1 / 4, three_fourth: 3 / 4, one_fifth: 1 / 5, two_fifth: 2 / 5, three_fifth: 3 / 5, four_fifth: 4 / 5 }
  const tokens = classes(el)
  for (const [w, f] of Object.entries(words)) if (tokens.includes(w) || tokens.includes(`av_${w}`)) return f
  const grid = c.match(/\bcol-(?:md|lg|sm|xl)-(\d+)\b/) ?? c.match(/\bcol-(\d+)\b/) ?? c.match(/\bvc_col-sm-(\d+)\b/)
  if (grid) return +grid[1] / 12
  const el2 = c.match(/\belementor-col-(\d+)\b/)
  if (el2) return +el2[1] / 100
  const divi = c.match(/\bet_pb_column_(\d)_(\d)\b/)
  if (divi) return +divi[1] / +divi[2]
  const basis = (el.attrs.style ?? '').match(/(?:flex-basis|width)\s*:\s*([\d.]+)%/)
  if (basis) return +basis[1] / 100
  return undefined
}

const isColumn = (el: El) => COLUMN.test(el.attrs.class ?? '')
const isSection = (el: El) => el.tag === 'section' || SECTION.test(el.attrs.class ?? '') || /^(hero|banner|slider)/i.test(el.attrs.id ?? '')

class Reader {
  constructor(private ctx: MirrorContext, private cut: Set<El>) {}

  skip = (el: El) => skipped(el, this.ctx.styles, this.cut)

  // Reading order, with columns kept together.
  blocks(el: El, inColumn = false): Block[] {
    const out: Block[] = []
    let run: (El | string)[] = []
    const flush = () => {
      if (!run.length) return
      const wrap: El = { tag: 'span', attrs: {}, children: run, parent: el }
      run = []
      // Inline images and buttons inside a run still count.
      for (const n of wrap.children) if (isEl(n)) this.inline(n, out)
      const text = textOf(wrap, (e) => this.skip(e) || this.isButton(e))
      if (text.replace(/\s/g, '').length >= 2) out.push({ kind: 'p', text, look: this.ctx.styles.look(el) })
    }
    const kids = el.children
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i]
      if (!isEl(n)) {
        run.push(n)
        continue
      }
      if (this.skip(n)) continue
      if (INLINE.has(n.tag) && !this.isButton(n) && !find(n, (d) => !INLINE.has(d.tag) && d.tag !== 'img')) {
        run.push(n)
        continue
      }
      flush()
      // A group of columns: siblings marked as columns.
      if (!inColumn && isColumn(n)) {
        const group: El[] = []
        for (let j = i; j < kids.length; j++) {
          const k = kids[j]
          if (!isEl(k)) continue
          if (this.skip(k)) continue
          if (!isColumn(k)) break
          group.push(k)
          i = j
        }
        const cols = group.map((c) => ({ el: c, frac: frac(c), first: /(^|\s)first(\s|$)/.test(c.attrs.class ?? ''), blocks: this.blocks(c, true), bg: this.boxColor(c) })).filter((c) => c.blocks.length)
        if (cols.length === 1) out.push(...cols[0].blocks)
        else if (cols.length) out.push({ kind: 'cols', key: n, cols })
        continue
      }
      this.block(n, out, inColumn)
    }
    flush()
    return out
  }

  // A column drawn as a box: its own background colour, or its first
  // wrapper's.
  private boxColor(el: El): string | undefined {
    const st = this.ctx.styles
    const own = st.look(el).background
    if (own) return own
    const kids = el.children.filter(isEl).filter((k) => !this.skip(k))
    return kids.length === 1 ? st.look(kids[0]).background : undefined
  }

  private isButton(el: El): boolean {
    return el.tag === 'a' && (/(^|[\s_-])(btn|button|cta)([\s_-]|$)/i.test(el.attrs.class ?? '') || el.attrs.role === 'button')
  }

  private inline(el: El, out: Block[]) {
    if (el.tag === 'img') this.image(el, out)
    else if (this.isButton(el)) this.button(el, out)
    else for (const d of descendants(el)) if (d.tag === 'img') this.image(d, out)
  }

  private button(el: El, out: Block[]) {
    const label = textOf(el).replace(/\s+/g, ' ').trim()
    const href = this.ctx.link(el.attrs.href ?? '')
    if (label.length >= 2 && label.length <= 60 && href) out.push({ kind: 'btn', label, href })
  }

  private image(el: El, out: Block[]) {
    const src = imgSrc(el, this.ctx.url)
    if (!src || NOT_PHOTO.test(src) || NOT_PHOTO.test(el.attrs.class ?? '') || BG_IMG.test(el.attrs.class ?? '')) return
    const w = Number(el.attrs.width) || 0
    const h = Number(el.attrs.height) || 0
    if ((w && w < 120) || (h && h < 90)) return
    const full = w && h ? src : fullSize(src)
    if (this.ctx.used.has(full)) return
    this.ctx.used.add(full)
    const alt = (el.attrs.alt || el.attrs.title || '').replace(/\s+/g, ' ').trim()
    out.push({ kind: 'img', src: full, alt: alt.slice(0, 200) || this.ctx.name, width: w && h ? w : 1200, height: w && h ? h : 800 })
  }

  private block(el: El, out: Block[], inColumn: boolean) {
    const st = this.ctx.styles
    const tag = el.tag
    if (/^h[1-6]$/.test(tag)) {
      const text = textOf(el, this.skip).replace(/\s+/g, ' ').trim()
      if (text) out.push({ kind: 'h', level: +tag[1], text: text.slice(0, 300), look: st.look(el) })
      for (const d of descendants(el)) if (d.tag === 'img') this.image(d, out)
      return
    }
    if (tag === 'img') return this.image(el, out)
    if (tag === 'form') {
      if (find(el, (d) => d.tag === 'textarea' || /email/i.test(d.attrs.type ?? '') || /email/i.test(d.attrs.name ?? ''))) {
        const submit = find(el, (d) => (d.tag === 'button' || (d.tag === 'input' && /submit/i.test(d.attrs.type ?? ''))))
        const label = (submit ? (submit.tag === 'input' ? submit.attrs.value : textOf(submit)) : '')?.trim() || 'Send'
        out.push({ kind: 'form', label: label.slice(0, 40) })
      }
      return
    }
    if (this.isButton(el)) return this.button(el, out)
    if (tag === 'ul' || tag === 'ol') {
      const items = el.children.filter(isEl).filter((li) => li.tag === 'li' && !this.skip(li))
      const texts = items.map((li) => textOf(li, this.skip).replace(/\s+/g, ' ').trim()).filter((t) => t.length >= 2)
      // Lists of links that look like a menu stay out.
      const links = items.filter((li) => li.children.filter(isEl).length === 1 && li.children.filter(isEl)[0].tag === 'a').length
      if (texts.length && !(links === items.length && items.length > 6 && texts.every((t) => t.length < 30))) out.push({ kind: 'p', text: texts.map((t) => `• ${t}`).join('\n'), look: st.look(el), list: true })
      for (const li of items) for (const d of descendants(li)) if (d.tag === 'img') this.image(d, out)
      return
    }
    // A short line that is all bold is a heading in disguise ("<p><strong>
    // Our Process</strong></p>"); it keeps its own colour.
    // Big words in a plain box (slider layers, builder text) read as a heading.
    if ((tag === 'div' || tag === 'p' || tag === 'span') && !find(el, (d) => !INLINE.has(d.tag))) {
      const look = st.look(el)
      const text = textOf(el, this.skip).replace(/\s+/g, ' ').trim()
      if (look.fontSize && look.fontSize >= 26 && text.length >= 3 && text.length <= 90) {
        out.push({ kind: 'h', level: 2, text, look })
        return
      }
    }
    if (tag === 'p' || tag === 'div') {
      const kids = el.children.filter((c) => isEl(c) || c.trim())
      const only = kids.length === 1 && isEl(kids[0]) ? kids[0] : undefined
      const strong = only && /^(strong|b)$/.test(only.tag) ? only : only && only.tag === 'span' && only.children.filter((c) => isEl(c) || c.trim()).length === 1 ? (only.children.find((c) => isEl(c) && /^(strong|b)$/.test(c.tag)) as El | undefined) : undefined
      const text = strong ? textOf(strong).replace(/\s+/g, ' ').trim() : ''
      if (strong && text.length >= 3 && text.length <= 90 && !/[.,;:]$/.test(text) && !find(el, (d) => d.tag === 'img')) {
        const look = { ...st.look(strong), fontWeight: 700 }
        out.push({ kind: 'h', level: 3, text, look: { ...look, fontSize: look.fontSize && look.fontSize > 18 ? look.fontSize : undefined } })
        return
      }
    }
    if (tag === 'p' || tag === 'blockquote' || tag === 'address' || tag === 'pre' || tag === 'dd' || tag === 'dt' || tag === 'figcaption') {
      for (const d of descendants(el)) {
        if (d.tag === 'img') this.image(d, out)
        else if (this.isButton(d)) this.button(d, out)
      }
      const text = textOf(el, (e) => this.skip(e) || this.isButton(e))
      if (text.replace(/\s/g, '').length >= 2) out.push({ kind: 'p', text: text.slice(0, 5000), look: st.look(el) })
      return
    }
    if (tag === 'table') {
      const rows = findAll(el, (d) => d.tag === 'tr').map((tr) => tr.children.filter(isEl).map((td) => textOf(td).replace(/\s+/g, ' ').trim()).filter(Boolean).join(' · ')).filter(Boolean)
      if (rows.length) out.push({ kind: 'p', text: rows.join('\n'), look: st.look(el) })
      return
    }
    // Any other box: what's inside it, in order.
    out.push(...this.blocks(el, inColumn))
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function hasContent(el: El, skip: (e: El) => boolean): boolean {
  if (skip(el)) return false
  if (textOf(el, skip).replace(/\s/g, '').length > 0) return true
  return !!find(el, (d) => d.tag === 'img' && !skip(d)) || el.tag === 'img'
}

// The page's sections, outermost first; a wrapper holding several sections
// is opened up.
function sections(el: El, skip: (e: El) => boolean, columnAbove = false): El[] {
  const out: El[] = []
  for (const n of el.children) {
    if (!isEl(n) || !hasContent(n, skip)) continue
    const col = columnAbove || isColumn(n)
    const inner = col ? [] : sectionLike(n, skip)
    if (isSection(n) && !col && inner.length < 2) out.push(n)
    else if (!col && inner.length) out.push(...sections(n, skip))
    else if (out.length && !isSection(out[out.length - 1]) && out[out.length - 1].parent === n.parent) {
      // Loose content next to loose content: one section, in a wrapper.
      const last = out[out.length - 1]
      const wrap: El = last.attrs['data-mirror'] ? last : { tag: 'div', attrs: { 'data-mirror': '1' }, children: [last], parent: last.parent }
      if (wrap !== last) out[out.length - 1] = wrap
      wrap.children.push(n)
    } else out.push(n)
  }
  return out
}

// Section-like boxes inside a box (not inside its columns).
function sectionLike(el: El, skip: (e: El) => boolean): El[] {
  const out: El[] = []
  const go = (n: El) => {
    for (const c of n.children) {
      if (!isEl(c) || skip(c) || isColumn(c)) continue
      if (isSection(c) && hasContent(c, skip)) out.push(c)
      else go(c)
    }
  }
  go(el)
  return out
}

interface Bg {
  color?: string
  image?: string
  text?: string
}

// A section's background: on the box itself or on an empty layer inside it
// (overlays, parallax and lazy-loaded backgrounds).
function background(sec: El, st: Styles, base: string): Bg {
  const out: Bg = {}
  const chain: El[] = [sec]
  for (let n = sec; ; ) {
    const kids = n.children.filter(isEl)
    const layers = kids.filter((k) => !textOf(k).trim() && !find(k, (d) => d.tag === 'img'))
    chain.push(...layers)
    const content = kids.filter((k) => !layers.includes(k))
    if (content.length !== 1 || chain.length > 12) break
    n = content[0]
    chain.push(n)
  }
  for (const el of chain) {
    const l = st.look(el)
    const lazy = el.attrs['data-bg'] || el.attrs['data-background'] || el.attrs['data-bg-image'] || el.attrs['data-src-bg'] || el.attrs['data-background-image']
    const img = l.backgroundImage ?? (lazy ? (() => { try { return new URL(lazy.replace(/^url\(['"]?|['"]?\)$/g, ''), base).href } catch { return undefined } })() : undefined)
    if (img && !out.image && !NOT_PHOTO.test(img)) {
      if (l.repeat || /pattern|texture|leather|paper|linen|noise|grain|dots|stripe/i.test(img)) out.color ??= /white|light|paper|leather|linen/i.test(img) ? '#efefef' : undefined
      else out.image = img.replace(/^http:/, 'https:')
    }
    if (l.background && !out.color) out.color = l.background
  }
  // A photo laid behind the content as an <img> (sliders, cover blocks).
  if (!out.image) {
    const slide = find(sec, (d) => d.tag === 'img' && BG_IMG.test(d.attrs.class ?? '') && !ancestors(d).some((a) => a !== sec && SLIDE.test(a.attrs.class ?? '') && a.parent && a.parent.children.filter(isEl).filter((x) => SLIDE.test(x.attrs.class ?? ''))[0] !== a))
    const src = slide && imgSrc(slide, base)
    if (src) out.image = src
  }
  // Nothing of its own: the colour behind it shows through.
  if (!out.color && !out.image) for (const a of ancestors(sec)) {
    if (a.tag === 'body' || a.tag === 'html') break
    const c = st.look(a).background
    if (c) {
      out.color = c
      break
    }
  }
  out.text = st.look(sec).color
  return out
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)))

class Builder {
  private n = 0
  private h1 = false
  // The current section's background, so a column the same colour isn't boxed.
  sectionBg?: string
  // How the words just before a button are aligned.
  private align?: string
  h1Text?: string
  constructor(private ctx: MirrorContext, private textColor: string) {}

  id(kind: string) {
    return `${this.ctx.idBase}-${kind}${++this.n}`.slice(0, 64)
  }

  widgets(blocks: Block[], color: string | undefined): Element[] {
    const out: Element[] = []
    let para: { text: string; look: Look }[] = []
    const flush = () => {
      if (!para.length) return
      const style = this.textStyle(para[0].look, color)
      out.push({ id: this.id('t'), type: 'text', text: para.map((p) => p.text).join('\n\n').slice(0, 20000), ...(style ? { style } : {}) })
      para = []
    }
    for (const b of blocks) {
      if (b.kind === 'p' || b.kind === 'h') this.align = b.look.textAlign
      if (b.kind === 'p') {
        if (para.length && (para[0].look.textAlign !== b.look.textAlign || para[0].look.color !== b.look.color)) flush()
        para.push(b)
        continue
      }
      flush()
      if (b.kind === 'h') out.push(this.heading(b, color))
      else if (b.kind === 'img') out.push({ id: this.id('i'), type: 'image', src: b.src, alt: b.alt, width: b.width, height: b.height })
      else if (b.kind === 'btn') {
        const btn: Widget = { id: this.id('b'), type: 'button', label: b.label, href: b.href, variant: 'primary' }
        // Buttons side by side, as they were.
        const last = out[out.length - 1]
        if (last?.type === 'button') out[out.length - 1] = { id: this.id('br'), type: 'container', layout: 'flex', direction: { desktop: 'row' }, justify: this.align === 'center' ? 'center' : 'start', style: { gap: { desktop: 14 } }, children: [last, btn] }
        else if (last?.type === 'container' && last.id.includes('-br')) last.children.push(btn)
        else out.push(btn)
      }
      else if (b.kind === 'form') out.push({ id: this.id('f'), type: 'form', fields: ['name', 'email', 'phone', 'message'], submitLabel: b.label })
      else if (b.kind === 'cols') out.push(...this.columns(b, color))
    }
    flush()
    return out
  }

  private columns(b: Extract<Block, { kind: 'cols' }>, color: string | undefined): Element[] {
    // Rows: a new row when the widths add past one, or a column is marked first.
    const rows: (typeof b.cols)[] = []
    let sum = 0
    for (const c of b.cols) {
      const f = c.frac ?? 0
      if (!rows.length || (c.first && rows[rows.length - 1].length) || (c.frac !== undefined && sum + f > 1.02)) {
        rows.push([])
        sum = 0
      }
      rows[rows.length - 1].push(c)
      sum += f
    }
    const out: Element[] = []
    for (const row of rows) {
      const kids = row.map((c) => {
        const box = c.bg && c.bg !== this.sectionBg ? c.bg : undefined
        const ink = box ? (luminance(box) < 0.35 ? '#ffffff' : this.textColor) : color
        const inner = this.widgets(c.blocks, ink)
        const grow = c.frac && row.every((x) => x.frac) ? clamp(c.frac * 12, 1, 12) : undefined
        const style: ElementStyle = { gap: { desktop: 12 }, ...(grow ? { grow } : {}), ...(box ? { background: box, padding: { desktop: { top: 32, right: 32, bottom: 32, left: 32 }, mobile: { top: 24, right: 20, bottom: 24, left: 20 } }, ...(ink && ink !== color ? { color: ink } : {}) } : {}) }
        return { id: this.id('c'), type: 'container' as const, layout: 'flex' as const, style, children: inner }
      })
      if (kids.length === 1 && !kids[0].style.background) {
        out.push(...kids[0].children)
        continue
      }
      const many = kids.length > 4 || row.some((c) => c.frac === undefined) && kids.length > 3
      out.push(
        many
          ? { id: this.id('g'), type: 'container', layout: 'grid', columns: { desktop: Math.min(kids.length, 3), tablet: 2, mobile: 1 }, style: { gap: { desktop: 28, mobile: 20 } }, children: kids }
          : { id: this.id('r'), type: 'container', layout: 'flex', direction: { desktop: 'row', mobile: 'column' }, style: { gap: { desktop: 36, mobile: 22 } }, children: kids }
      )
    }
    return out
  }

  private heading(b: Extract<Block, { kind: 'h' }>, color: string | undefined): Widget {
    // One main heading per page; the rest step down to H2.
    let level = b.level
    if (level === 1) {
      if (this.h1) level = 2
      else {
        this.h1 = true
        this.h1Text = b.text
      }
    }
    const style: ElementStyle = {}
    const size = b.look.fontSize
    if (size && size >= 14) style.fontSize = { desktop: clamp(size, 14, 72), ...(size > 30 ? { mobile: clamp(size * 0.72, 22, 44) } : {}) }
    if (b.look.textAlign === 'center' || b.look.textAlign === 'right') style.textAlign = { desktop: b.look.textAlign }
    if (b.look.color && b.look.color !== (color ?? this.textColor)) style.color = b.look.color
    if (b.look.upper) style.textTransform = 'uppercase'
    return { id: this.id('h'), type: 'heading', level, text: b.text, ...(Object.keys(style).length ? { style } : {}) }
  }

  private textStyle(look: Look, color: string | undefined): ElementStyle | undefined {
    const style: ElementStyle = {}
    if (look.textAlign === 'center' || look.textAlign === 'right') style.textAlign = { desktop: look.textAlign }
    if (look.color && look.color !== (color ?? this.textColor)) style.color = look.color
    return Object.keys(style).length ? style : undefined
  }

  // The finishing touches: a page always has exactly one H1, and headings
  // never jump levels.
  finish(body: Container[], fallbackH1: string): Container[] {
    const all: Widget[] = []
    const visit = (els: Element[]) => els.forEach((e) => (e.type === 'container' ? visit(e.children) : all.push(e)))
    visit(body)
    const heads = all.filter((w): w is Extract<Widget, { type: 'heading' }> => w.type === 'heading')
    if (!heads.some((h) => h.level === 1)) {
      const first = heads[0]
      if (first && first.text.length >= 8) {
        first.level = 1
        this.h1Text = first.text
      } else if (body[0]) {
        body[0].children.unshift({ id: this.id('h'), type: 'heading', level: 1, text: fallbackH1.slice(0, 300) })
        this.h1Text = fallbackH1
      }
    }
    let prev = 1
    for (const h of all.filter((w): w is Extract<Widget, { type: 'heading' }> => w.type === 'heading')) {
      if (h.level === 1) {
        prev = 1
        continue
      }
      if (h.level > prev + 1) h.level = prev + 1
      prev = h.level
    }
    // Only the first photo loads right away.
    const firstImg = all.find((w) => w.type === 'image') as Extract<Widget, { type: 'image' }> | undefined
    const firstBg = body.find((c) => c.backgroundImage)
    if (firstBg && body.indexOf(firstBg) === 0) firstBg.backgroundImage!.priority = true
    else if (firstImg && body.indexOf(body.find((c) => JSON.stringify(c).includes(firstImg.id))!) === 0) firstImg.priority = true
    return body
  }
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

export function mirrorPage(html: string, ctx: MirrorContext, textColor: string, fallbackH1: string, root = parseHtml(html)): MirroredPage {
  const st = ctx.styles
  const { body, header, footers } = regions(root)
  const cut = new Set<El>([...(header ? [header] : []), ...footers])
  const reader = new Reader(ctx, cut)
  const build = new Builder(ctx, textColor)
  const out: Container[] = []
  for (const sec of sections(body, reader.skip)) {
    const blocks = reader.blocks(sec)
    if (!blocks.length) continue
    const bg = background(sec, st, ctx.url)
    const onPhoto = !!bg.image
    // Text on a photo is light unless their own styles say otherwise.
    const color = bg.text && bg.text !== textColor ? bg.text : onPhoto ? '#ffffff' : bg.color && luminance(bg.color) < 0.25 ? '#ffffff' : undefined
    const darkText = color ? luminance(color) < 0.4 : luminance(textColor) < 0.4
    build.sectionBg = bg.color
    const children = build.widgets(blocks, color)
    if (!children.length) continue
    // A section that is only photos (a slider): the first photo, full width.
    const onlyImages = children.every((c) => c.type === 'image')
    if (onlyImages && !out.length && children[0].type === 'image') {
      out.push({ id: build.id('hero'), type: 'container', tag: 'section', layout: 'flex', children: [{ ...children[0], style: { maxWidth: 2000 } } as Element] })
      continue
    }
    // The opening photo gets room to show, as a hero does.
    const hero = onPhoto && !out.length
    const style: ElementStyle = {
      padding: hero ? { desktop: { top: 150, right: 24, bottom: 150, left: 24 }, mobile: { top: 90, right: 20, bottom: 90, left: 20 } } : { desktop: { top: 64, right: 24, bottom: 64, left: 24 }, mobile: { top: 44, right: 20, bottom: 44, left: 20 } },
      gap: { desktop: 14 },
      ...(bg.color && !onPhoto ? { background: bg.color } : {}),
      ...(color ? { color } : {}),
    }
    out.push({
      id: build.id('s'),
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      ...(onPhoto ? { backgroundImage: { src: bg.image!, width: 1920, height: 1080, overlay: darkText ? 0 : out.length ? 0.5 : 0.35 } } : {}),
      style,
      children,
    })
  }
  const done = build.finish(out, fallbackH1)
  return { body: done.slice(0, 100), h1: build.h1Text }
}

// ---------------------------------------------------------------------------
// Header, footer and site-wide look
// ---------------------------------------------------------------------------

export function readChrome(root: El, st: Styles, base: string, name: string, link: (href: string) => string | undefined): Chrome {
  const { header, footers } = regions(root)
  const chrome: Chrome = { nav: [] }
  if (header) {
    const imgs = findAll(header, (e) => e.tag === 'img')
    const logo = imgs.find((i) => /logo/i.test(`${i.attrs.src ?? ''} ${i.attrs.class ?? ''} ${i.attrs.alt ?? ''} ${ancestors(i).slice(0, 3).map(key).join(' ')}`)) ?? imgs[0]
    const logoSrc = logo && imgSrc(logo, base)
    if (logoSrc) chrome.logo = logoSrc
    // The main menu: the first list of links in the header's nav.
    // The main menu: the list of links with the most top-level entries
    // (not the small menu in a top bar).
    const lists = findAll(header, (e) => e.tag === 'ul' && !ancestors(e).some((a) => a.tag === 'li') && e.children.filter(isEl).filter((li) => li.tag === 'li' && !!find(li, (a) => a.tag === 'a')).length >= 2 && !/social/i.test(e.attrs.class ?? ''))
    const score = (ul: El) => ul.children.filter(isEl).filter((li) => li.tag === 'li').length + (/main|primary/i.test(`${ul.attrs.class ?? ''} ${ul.attrs.id ?? ''} ${ancestors(ul).slice(0, 3).map(key).join(' ')}`) ? 10 : 0) - (ancestors(ul).some((a) => /top-?bar|header_meta|sub_menu|secondary|utility/i.test(key(a))) ? 10 : 0)
    const list = lists.sort((a, b) => score(b) - score(a))[0]
    if (list) {
      for (const li of list.children.filter(isEl)) {
        if (li.tag !== 'li') continue
        const a = li.children.filter(isEl).find((c) => c.tag === 'a') ?? find(li, (e) => e.tag === 'a')
        if (!a) continue
        const label = textOf(a, (e) => e.tag === 'ul' || /hidden|sr-only|screen-reader/i.test(e.attrs.class ?? '')).replace(/\s+/g, ' ').trim()
        const href = link(a.attrs.href ?? '')
        if (!label || label.length > 40 || !href) continue
        if (/(^|[\s_-])(button|btn|cta)([\s_-]|$)/i.test(`${li.attrs.class ?? ''} ${a.attrs.class ?? ''}`)) chrome.cta ??= { label, href }
        else if (!chrome.nav.some((n) => n.label === label)) chrome.nav.push({ label, href })
      }
    }
    // A slim bar above the menu ("Call 24/7", an announcement).
    const bar = find(header, (e) => /(^|[\s_-])(top-?bar|header_meta|header-top|top-header|topheader|phone-info|announcement|utility|pre-header)([\s_-]|$)/i.test(`${e.attrs.class ?? ''} ${e.attrs.id ?? ''}`))
    if (bar) {
      // Its own words, without menus or the phone number (shown beside it).
      const text = textOf(bar, (e) => /hidden|sr-only|screen-reader/i.test(e.attrs.class ?? '') || e.tag === 'ul' || e.tag === 'nav')
        .replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}/g, (m) => (/call|phone|cell/i.test(textOf(bar)) ? m : ''))
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length >= 6 && text.length <= 120 && /[a-z]{3}/i.test(text)) chrome.topbar = text
    }
    // Colours: the header's own background, or its main bar's.
    const bgOf = (el: El): string | undefined => st.look(el).background ?? el.children.filter(isEl).map((c) => st.look(c).background).find(Boolean)
    const main = find(header, (e) => /header_main|main-header|header-main|navbar|site-header/i.test(`${e.attrs.class ?? ''} ${e.attrs.id ?? ''}`)) ?? header
    const hb = bgOf(main) ?? bgOf(header) ?? (/dark/i.test(header.attrs.class ?? '') ? '#111111' : undefined)
    if (hb) {
      const linkColor = list ? st.look(find(list, (e) => e.tag === 'a') ?? list).color : undefined
      const text = linkColor && Math.abs(luminance(linkColor) - luminance(hb)) > 0.35 ? linkColor : luminance(hb) < 0.35 ? '#ffffff' : '#1a1a1a'
      chrome.colors = { background: hb, text }
      if (bar) {
        const tb = bgOf(bar) ?? st.look(bar).background
        const tt = st.look(bar).color ?? st.look(find(bar, (e) => e.tag === 'a') ?? bar).color
        if (tb) chrome.colors.topbarBackground = tb
        if (tb) chrome.colors.topbarText = tt && Math.abs(luminance(tt) - luminance(tb)) > 0.25 ? tt : luminance(tb) < 0.4 ? '#ffffff' : '#1a1a1a'
      }
    }
  }
  // Small print in the footer (a law firm's disclaimer).
  for (const f of footers) {
    const note = findAll(f, (e) => e.tag === 'p' || e.tag === 'div').map((e) => textOf(e).replace(/\s+/g, ' ').trim()).find((t) => /disclaimer|attorney advertising|not (legal|medical) advice|no attorney-client|past results/i.test(t) && t.length >= 40 && t.length <= 600)
    if (note) {
      chrome.footerNote = note
      break
    }
  }
  void name
  return chrome
}

// Fonts we can name the family of: serif faces, by name.
const SERIF = /serif(?!-?sans)|georgia|times|garamond|baskerville|playfair|merriweather|lora|cinzel|cormorant|crimson|prata|bodoni|didot|libre caslon|caslon|domine|spectral|frank ruhl|noto serif|pt serif|source serif|roboto slab|slab|arvo|zilla|bitter|vollkorn|alegreya(?! sans)|eb garamond|abril|dm serif|marcellus|trajan|optima/i

export function readGlobals(root: El, st: Styles, base: GlobalStyles, brand?: string): { globals: GlobalStyles; text: string } {
  const body = find(root, (e) => e.tag === 'body') ?? root
  const content = find(body, (e) => e.tag === 'main' || /^(main|content|primary)$/i.test(e.attrs.id ?? '')) ?? body
  const p = find(content, (e) => e.tag === 'p' && textOf(e).length > 60) ?? find(body, (e) => e.tag === 'p')
  const h = find(content, (e) => e.tag === 'h1') ?? find(content, (e) => e.tag === 'h2') ?? find(body, (e) => /^h[1-3]$/.test(e.tag))
  const pl = p ? st.look(p) : st.look(body)
  const hl = h ? st.look(h) : pl
  const bodyBg = st.look(body).background ?? st.look(content).background ?? '#ffffff'
  const bg = luminance(bodyBg) > 0.6 ? bodyBg : '#ffffff'
  const text = pl.color && luminance(pl.color) < 0.4 ? pl.color : '#222222'
  const link = find(content, (e) => e.tag === 'a' && textOf(e).length > 3 && !/btn|button/i.test(e.attrs.class ?? ''))
  const linkColor = link ? st.look(link).color : undefined
  const primary = brand && /^#[0-9a-f]{6}$/i.test(brand) ? brand : linkColor && linkColor !== text ? linkColor : base.colors.primary
  const footer = regions(root).footers[0]
  const fbg = footer ? st.look(footer).background ?? footer.children.filter(isEl).map((c) => st.look(c).background).find(Boolean) : undefined
  const secondary = fbg && luminance(fbg) < 0.3 ? fbg : '#1d1f22'
  const weight = hl.fontWeight ? ([400, 500, 600, 700, 800, 900] as const).reduce((a, b) => (Math.abs(b - hl.fontWeight!) < Math.abs(a - hl.fontWeight!) ? b : a)) : 700
  const globals: GlobalStyles = {
    ...base,
    colors: {
      primary,
      accent: primary,
      secondary,
      text,
      muted: mix(text, bg, 0.35),
      background: bg,
      surface: mix(text, bg, 0.94),
    },
    fonts: { heading: hl.fontFamily && SERIF.test(hl.fontFamily) ? 'serif' : 'sans', body: pl.fontFamily && SERIF.test(pl.fontFamily) ? 'serif' : 'sans' },
    baseFontSize: clamp(pl.fontSize ?? 17, 15, 20),
    typeScale: 1.25,
    containerWidth: 1180,
    headingWeight: weight,
    headingTracking: 0,
    // Capitals are set heading by heading, as their site does.
    headingCase: 'none',
  }
  return { globals, text }
}

function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('')
}

export { toHex }
