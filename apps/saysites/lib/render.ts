// Renders a validated SaySites page into a complete, lean HTML document.
//
// Output rules that keep every page fast and SEO-clean by construction:
//   - No client JavaScript. The only <script> is JSON-LD structured data.
//   - CSS is generated per page and contains only rules for elements that
//     exist on it, inlined in <head> (no render-blocking stylesheet request).
//   - System font stacks: no font download.
//   - Images carry intrinsic width/height (no layout shift) and lazy-load,
//     except one optional priority image for the hero.
//   - Every text value is HTML-escaped; the tree can never inject markup.

import {
  BREAKPOINT_MAX_WIDTH,
  COLOR_TOKENS,
  FONT_STACKS,
  pagePath,
  siteOrigin,
  type Breakpoint,
  type ColorValue,
  type Container,
  type Element,
  type ElementStyle,
  type GlobalStyles,
  type Page,
  type Responsive,
  type Site,
  type Widget,
} from './schema'
import { structuredData } from './seo'

export interface RenderedPage {
  html: string
  css: string
}

export function renderPage(site: Site, page: Page, allPages: readonly Page[] = [page]): RenderedPage {
  const css = buildCss(site.globals, page.body)
  const origin = siteOrigin(site)
  const url = origin + pagePath(page)
  const jsonLd = structuredData(site, page, allPages)

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.seo.title)}</title>`,
    `<meta name="description" content="${esc(page.seo.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    page.seo.noindex ? '<meta name="robots" content="noindex">' : '',
    `<link rel="icon" href="${esc(favicon(site))}">`,
    `<meta name="theme-color" content="${esc(site.globals.colors.primary)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(page.seo.title)}">`,
    `<meta property="og:description" content="${esc(page.seo.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:site_name" content="${esc(site.business.name)}">`,
    page.seo.ogImage ? `<meta property="og:image" content="${esc(absolute(origin, page.seo.ogImage))}">` : '',
    ...jsonLd.map((d) => `<script type="application/ld+json">${jsonForScript(d)}</script>`),
    `<style>${css}</style>`,
  ].filter(Boolean)

  const body = [
    renderHeader(site, page),
    `<main>${page.body.map(renderElement).join('')}</main>`,
    renderFooter(site),
  ].join('')

  const html = `<!doctype html><html lang="${esc(site.language)}"><head>${head.join('')}</head><body>${body}</body></html>`
  return { html, css }
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

function renderElement(el: Element): string {
  return el.type === 'container' ? renderContainer(el) : renderWidget(el)
}

function renderContainer(c: Container): string {
  const tag = c.tag ?? 'div'
  const inner = c.children.map(renderElement).join('')
  // Boxed: the element spans full width (background bleeds); content sits in
  // an inner box capped at the global container width.
  return c.boxed
    ? `<${tag} class="${cls(c.id)} bx"><div class="${cls(c.id)}-in">${inner}</div></${tag}>`
    : `<${tag} class="${cls(c.id)}">${inner}</${tag}>`
}

function renderWidget(w: Widget): string {
  const c = cls(w.id)
  switch (w.type) {
    case 'heading':
      return `<h${w.level} class="${c}">${esc(w.text)}</h${w.level}>`
    case 'text': {
      const paras = paragraphs(w.text)
      return paras.length === 1
        ? `<p class="${c}">${paras[0]}</p>`
        : `<div class="${c} tx">${paras.map((p) => `<p>${p}</p>`).join('')}</div>`
    }
    case 'image': {
      const loading = w.priority ? 'fetchpriority="high"' : 'loading="lazy"'
      return `<img class="${c}" src="${esc(w.src)}" alt="${esc(w.alt)}" width="${w.width}" height="${w.height}" ${loading} decoding="async">`
    }
    case 'button':
      return `<a class="btn btn-${w.variant} ${c}" href="${esc(w.href)}">${esc(w.label)}</a>`
    case 'faq':
      // <details> gives open/close with zero JavaScript.
      return `<div class="faq ${c}">${w.items
        .map((i) => `<details><summary>${esc(i.question)}</summary><div>${paragraphs(i.answer).map((p) => `<p>${p}</p>`).join('')}</div></details>`)
        .join('')}</div>`
  }
}

function renderHeader(site: Site, page: Page): string {
  const current = pagePath(page)
  const links = site.nav
    .map((n) => `<a href="${esc(n.href)}"${n.href === current ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`)
    .join('')
  return `<header class="sh"><div class="sh-in"><a class="sh-brand" href="/">${esc(site.business.name)}</a>${links ? `<nav aria-label="Main">${links}</nav>` : ''}</div></header>`
}

function renderFooter(site: Site): string {
  const b = site.business
  const parts: string[] = [`<strong>${esc(b.name)}</strong>`]
  if (b.address) parts.push(`<span>${esc(`${b.address.street}, ${b.address.city}, ${b.address.region} ${b.address.postalCode}`)}</span>`)
  if (b.phone) parts.push(`<a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${esc(b.phone)}</a>`)
  if (b.email) parts.push(`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`)
  return `<footer class="sf"><div class="sf-in">${parts.join('')}</div></footer>`
}

// The business logo when there is one; otherwise an inline SVG monogram in
// the brand color, so there is never a missing-favicon request.
function favicon(site: Site): string {
  if (site.business.logo) return site.business.logo
  const letter = esc(site.business.name.trim().charAt(0).toUpperCase() || 'S')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${site.globals.colors.primary}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="${site.globals.colors.background}">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => esc(p).replace(/\n/g, '<br>'))
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

type Decls = Record<string, string>
type Rules = Map<string, Decls> // selector -> declarations

export function buildCss(g: GlobalStyles, body: readonly Container[]): string {
  const base = baseCss(g)
  const byBp: Record<Breakpoint, Rules> = { desktop: new Map(), tablet: new Map(), mobile: new Map() }
  const used = new Set<string>()

  const visit = (el: Element) => {
    used.add(el.type === 'container' ? 'container' : el.type)
    if (el.type === 'container') {
      containerRules(el, byBp)
      el.children.forEach(visit)
    } else {
      if (el.type === 'button') used.add(`btn-${el.variant}`)
    }
    if (el.style) styleRules(`.${cls(el.id)}`, el.style, byBp)
  }
  body.forEach(visit)

  return [
    base,
    widgetCss(used),
    emit(byBp.desktop),
    media('tablet', byBp.tablet),
    media('mobile', byBp.mobile),
  ].join('')
}

function baseCss(g: GlobalStyles): string {
  const vars = [
    ...COLOR_TOKENS.map((t) => `--c-${t}:${g.colors[t]}`),
    `--f-h:${FONT_STACKS[g.fonts.heading]}`,
    `--f-b:${FONT_STACKS[g.fonts.body]}`,
    `--r:${g.radius}px`,
    `--w:${g.containerWidth}px`,
  ].join(';')
  // Heading sizes step up the modular scale from the base size (h6 = base).
  const steps = [4, 3, 2, 1, 0.5, 0]
  const sizes = steps.map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** n)}px}`).join('')
  // Large headings step down one notch on phones so long words don't wrap badly.
  const mobile = steps.slice(0, 3).map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** (n - 1))}px}`).join('')
  return (
    `:root{${vars}}*,*::before,*::after{box-sizing:border-box}` +
    `body{margin:0;font-family:var(--f-b);font-size:${g.baseFontSize}px;line-height:1.6;color:var(--c-text);background:var(--c-background)}` +
    `h1,h2,h3,h4,h5,h6{font-family:var(--f-h);line-height:1.2;margin:0 0 .5em}${sizes}` +
    `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){${mobile}}` +
    `p{margin:0 0 1em}img{max-width:100%;height:auto;display:block}a{color:var(--c-primary)}` +
    `.sh,.sf{padding:16px}.sh-in,.sf-in{max-width:var(--w);margin:0 auto;display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center}` +
    `.sh-brand{font-family:var(--f-h);font-weight:700;font-size:1.25em;color:var(--c-text);text-decoration:none;margin-right:auto}` +
    `.sh nav{display:flex;flex-wrap:wrap;gap:8px 20px}.sh nav a{color:var(--c-text);text-decoration:none}.sh nav a[aria-current]{color:var(--c-primary);font-weight:600}` +
    `.sf{background:var(--c-surface);color:var(--c-muted);font-size:.9em}.sf-in{gap:8px 24px}.sf a{color:inherit}`
  )
}

function widgetCss(used: Set<string>): string {
  let css = ''
  if (used.has('button')) {
    css += `.btn{display:inline-block;padding:.75em 1.5em;border-radius:var(--r);font-weight:600;text-decoration:none;border:2px solid transparent;line-height:1.2}`
    if (used.has('btn-primary')) css += `.btn-primary{background:var(--c-primary);color:var(--c-background)}`
    if (used.has('btn-secondary')) css += `.btn-secondary{background:var(--c-secondary);color:var(--c-background)}`
    if (used.has('btn-outline')) css += `.btn-outline{border-color:currentColor;color:var(--c-primary)}`
  }
  if (used.has('text')) css += `.tx p:last-child{margin-bottom:0}`
  if (used.has('faq')) {
    css +=
      `.faq details{border-bottom:1px solid var(--c-surface);padding:12px 0}` +
      `.faq summary{cursor:pointer;font-weight:600}.faq details>div{padding-top:8px}`
  }
  return css
}

const ALIGN: Record<NonNullable<Container['align']>, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
const JUSTIFY: Record<NonNullable<Container['justify']>, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' }

function containerRules(c: Container, byBp: Record<Breakpoint, Rules>) {
  const self = `.${cls(c.id)}`
  // Layout goes on the inner box when boxed, on the element itself otherwise.
  const layoutSel = c.boxed ? `${self}-in` : self
  if (c.boxed) add(byBp.desktop, `${self}-in`, { 'max-width': 'var(--w)', margin: '0 auto' })

  const layout: Decls = { display: c.layout }
  if (c.align) layout['align-items'] = ALIGN[c.align]
  if (c.justify) layout['justify-content'] = JUSTIFY[c.justify]
  add(byBp.desktop, layoutSel, layout)

  if (c.layout === 'grid') {
    const cols = c.columns ?? { desktop: 1 }
    eachBp(cols, (bp, n) => add(byBp[bp], layoutSel, { 'grid-template-columns': `repeat(${n},minmax(0,1fr))` }))
  } else {
    const dir = c.direction ?? { desktop: 'column' }
    eachBp(dir, (bp, d) => {
      add(byBp[bp], layoutSel, { 'flex-direction': d })
      // Rows share width equally; columns size children to their content.
      // Buttons keep their natural width in both directions.
      add(byBp[bp], `${layoutSel}>:not(.btn)`, d === 'row' ? { flex: '1 1 0', 'min-width': '0' } : { flex: '0 0 auto' })
    })
  }
  // Gap applies to the layout box, not the outer boxed element.
  if (c.style?.gap) eachBp(c.style.gap, (bp, v) => add(byBp[bp], layoutSel, { gap: `${v}px` }))
}

function styleRules(sel: string, s: ElementStyle, byBp: Record<Breakpoint, Rules>) {
  const d = byBp.desktop
  if (s.padding) eachBp(s.padding, (bp, v) => add(byBp[bp], sel, { padding: box(v) }))
  if (s.margin) eachBp(s.margin, (bp, v) => add(byBp[bp], sel, { margin: box(v) }))
  if (s.fontSize) eachBp(s.fontSize, (bp, v) => add(byBp[bp], sel, { 'font-size': `${v}px` }))
  if (s.textAlign) eachBp(s.textAlign, (bp, v) => add(byBp[bp], sel, { 'text-align': v }))
  if (s.background) add(d, sel, { background: color(s.background) })
  if (s.color) add(d, sel, { color: color(s.color) })
  if (s.fontWeight) add(d, sel, { 'font-weight': String(s.fontWeight) })
  if (s.borderRadius !== undefined) add(d, sel, { 'border-radius': `${s.borderRadius}px` })
  if (s.maxWidth !== undefined) add(d, sel, { 'max-width': `${s.maxWidth}px` })
}

function eachBp<T>(r: Responsive<T>, fn: (bp: Breakpoint, v: T) => void) {
  fn('desktop', r.desktop)
  if (r.tablet !== undefined) fn('tablet', r.tablet)
  if (r.mobile !== undefined) fn('mobile', r.mobile)
}

function add(rules: Rules, sel: string, decls: Decls) {
  rules.set(sel, { ...(rules.get(sel) ?? {}), ...decls })
}

function emit(rules: Rules): string {
  let out = ''
  for (const [sel, decls] of rules) out += `${sel}{${Object.entries(decls).map(([k, v]) => `${k}:${v}`).join(';')}}`
  return out
}

function media(bp: Exclude<Breakpoint, 'desktop'>, rules: Rules): string {
  return rules.size ? `@media (max-width:${BREAKPOINT_MAX_WIDTH[bp]}px){${emit(rules)}}` : ''
}

function color(v: ColorValue): string {
  return v.startsWith('#') ? v : `var(--c-${v})`
}

function box(v: { top: number; right: number; bottom: number; left: number }): string {
  return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function cls(id: string): string {
  return `e-${id}`
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

function absolute(origin: string, src: string): string {
  return /^https?:\/\//.test(src) ? src : origin + (src.startsWith('/') ? src : `/${src}`)
}

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// JSON inside <script> must not be able to close the tag.
function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
