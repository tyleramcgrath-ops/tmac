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
  // The header's call-to-action is a button even when the page has none.
  const css = buildCss(site.globals, page.body, [...(site.header?.cta ? ['button', 'btn-primary'] : []), ...(site.header?.topbar ? ['topbar'] : [])])
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
  const bg = c.backgroundImage
  // A background photo is a real <img> (sized, responsive, lazy unless it is
  // the hero) under a tint layer, rather than CSS background-image, so it
  // gets srcset and never blocks rendering.
  const photo = bg
    ? `<img class="bgi" src="${esc(bg.src)}"${srcset(bg.src, bg.width)} sizes="100vw" alt="" width="${bg.width}" height="${bg.height}" ${bg.priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${bg.position ? ` style="object-position:${esc(bg.position)}"` : ''}><span class="bgt bgt-${bg.overlayStyle ?? 'full'}" style="--o:${bg.overlay}"></span>`
    : ''
  const classes = `${cls(c.id)}${c.boxed ? ' bx' : ''}${bg ? ' hasbg' : ''}`
  // Boxed: the element spans full width (background bleeds); content sits in
  // an inner box capped at the global container width.
  return c.boxed
    ? `<${tag} class="${classes}">${photo}<div class="${cls(c.id)}-in">${inner}</div></${tag}>`
    : `<${tag} class="${classes}">${photo}${bg ? `<div class="bgc">${inner}</div>` : inner}</${tag}>`
}

// Unsplash (and any imgix-style host) resizes on the fly, so give the browser
// a few widths to choose from. Other sources are served as uploaded.
function srcset(src: string, width: number): string {
  if (!/^https:\/\/images\.unsplash\.com\//.test(src)) return ''
  const base = src.replace(/([?&])w=\d+&?/, '$1').replace(/[?&]$/, '')
  const join = base.includes('?') ? '&' : '?'
  const widths = [480, 800, 1200, 1600, 2000].filter((w) => w <= Math.max(width, 480))
  return ` srcset="${widths.map((w) => `${esc(`${base}${join}w=${w}`)} ${w}w`).join(', ')}"`
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
      const crop = w.aspect ? ' crop' : ''
      return `<img class="${c}${crop}" src="${esc(w.src)}"${srcset(w.src, w.width)} sizes="(max-width: 640px) 100vw, 50vw" alt="${esc(w.alt)}" width="${w.width}" height="${w.height}" ${loading} decoding="async"${w.aspect ? ` style="aspect-ratio:${w.aspect}"` : ''}>`
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
  const h = site.header
  const phone = site.business.phone
  const top = h?.topbar
    ? `<div class="stb"><div class="stb-in"><span>${esc(h.topbar)}</span>${phone ? `<a href="${esc(tel(phone))}">${esc(phone)}</a>` : ''}</div></div>`
    : ''
  const cta = h?.cta ? `<a class="btn btn-primary sh-cta" href="${esc(h.cta.href)}">${esc(h.cta.label)}</a>` : ''
  return `<header class="sh">${top}<div class="sh-in"><a class="sh-brand" href="/">${esc(site.business.name)}</a>${links ? `<nav aria-label="Main">${links}</nav>` : ''}${cta}</div></header>`
}

// Days in schema.org openingHours order, for the footer's hours list.
const DAY: Record<string, string> = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' }

function renderFooter(site: Site): string {
  const b = site.business
  const year = new Date(site.updatedAt).getUTCFullYear() || new Date().getUTCFullYear()
  const cols: string[] = [`<div><strong class="sf-brand">${esc(b.name)}</strong>${site.tagline ? `<p>${esc(site.tagline)}</p>` : ''}</div>`]
  const contact: string[] = []
  if (b.phone) contact.push(`<a href="${esc(tel(b.phone))}">${esc(b.phone)}</a>`)
  if (b.email) contact.push(`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`)
  if (b.address) contact.push(`<span>${esc(`${b.address.street}, ${b.address.city}, ${b.address.region} ${b.address.postalCode}`)}</span>`)
  if (contact.length) cols.push(`<div><h2 class="sf-h">Contact</h2>${contact.join('')}</div>`)
  if (b.hours?.length) {
    const rows = b.hours.map((line) => esc(line.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAY[d]).replace(/-(?=[A-Z])/, '–')))
    cols.push(`<div><h2 class="sf-h">Hours</h2>${rows.map((r) => `<span>${r}</span>`).join('')}</div>`)
  }
  const pages = site.nav.filter((n) => n.href.startsWith('/'))
  if (pages.length) cols.push(`<div><h2 class="sf-h">Pages</h2><a href="/">Home</a>${pages.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('')}</div>`)
  return `<footer class="sf"><div class="sf-in">${cols.join('')}</div><div class="sf-base">© ${year} ${esc(b.name)}</div></footer>`
}

function tel(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
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

export function buildCss(g: GlobalStyles, body: readonly Container[], alsoUsed: readonly string[] = []): string {
  const base = baseCss(g)
  const byBp: Record<Breakpoint, Rules> = { desktop: new Map(), tablet: new Map(), mobile: new Map() }
  const used = new Set<string>(alsoUsed)

  const visit = (el: Element) => {
    used.add(el.type === 'container' ? 'container' : el.type)
    if (el.type === 'container') {
      if (el.backgroundImage) used.add('bg')
      containerRules(el, byBp)
      el.children.forEach(visit)
    } else {
      if (el.type === 'button') used.add(`btn-${el.variant}`)
      if (el.type === 'image' && el.aspect) used.add('crop')
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
    `--rb:${g.buttonShape === 'pill' ? '999px' : g.buttonShape === 'square' ? '2px' : `${Math.min(g.radius, 12)}px`}`,
    `--w:${g.containerWidth}px`,
  ].join(';')
  // Heading sizes step up the modular scale from the base size (h6 = base).
  const steps = [4, 3, 2, 1, 0.5, 0]
  const sizes = steps.map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** n)}px}`).join('')
  // Large headings step down one notch on phones so long words don't wrap badly.
  const mobile = steps.slice(0, 3).map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** (n - 1))}px}`).join('')
  const btnCase = g.buttonCase === 'upper' ? '.btn{text-transform:uppercase;letter-spacing:.08em;font-size:.85em}' : ''
  return (
    btnCase +
    `:root{${vars}}*,*::before,*::after{box-sizing:border-box}` +
    `body{margin:0;font-family:var(--f-b);font-size:${g.baseFontSize}px;line-height:1.6;color:var(--c-text);background:var(--c-background)}` +
    `h1,h2,h3,h4,h5,h6{font-family:var(--f-h);line-height:1.2;margin:0 0 .5em}${sizes}` +
    `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){${mobile}}` +
    `p{margin:0 0 1em}img{max-width:100%;height:auto;display:block}a{color:var(--c-primary)}` +
    `h1,h2,h3{font-weight:${g.headingWeight ?? 700};letter-spacing:${g.headingTracking ?? -0.01}em${g.headingCase === 'upper' ? ';text-transform:uppercase' : ''}}` +
    `.sh{background:var(--c-background);border-bottom:1px solid color-mix(in srgb,var(--c-text) 10%,transparent)}` +
    `.sh-in{max-width:var(--w);margin:0 auto;padding:16px 24px;display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center}` +
    `.sh-brand{font-family:var(--f-h);font-weight:${g.headingWeight ?? 700};letter-spacing:${g.headingTracking ?? -0.01}em;font-size:1.3em;color:var(--c-text);text-decoration:none;margin-right:auto${g.headingCase === 'upper' ? ';text-transform:uppercase' : ''}}` +
    `.sh nav{display:flex;flex-wrap:wrap;gap:8px 22px}.sh nav a{color:var(--c-muted);text-decoration:none;font-weight:500}.sh nav a:hover,.sh nav a[aria-current]{color:var(--c-text)}` +
    `.sh-cta{padding:.6em 1.2em}` +
    `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.sh nav{order:3;width:100%}}` +
    `.sf{background:var(--c-secondary);color:color-mix(in srgb,var(--c-background) 72%,transparent);font-size:.95em}` +
    `.sf-in{max-width:var(--w);margin:0 auto;padding:56px 24px 32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px}` +
    `.sf-in>div{display:flex;flex-direction:column;gap:6px}.sf-in p{margin:4px 0 0;max-width:320px}.sf a{color:inherit;text-decoration:none}.sf a:hover{color:var(--c-background)}` +
    `.sf-brand{font-family:var(--f-h);font-size:1.3em;color:var(--c-background);font-weight:${g.headingWeight ?? 700}}` +
    `.sf-h{font-family:var(--f-b);font-size:.78em;letter-spacing:.1em;text-transform:uppercase;color:var(--c-background);margin:0 0 6px;font-weight:600}` +
    `.sf-base{max-width:var(--w);margin:0 auto;padding:18px 24px 28px;border-top:1px solid color-mix(in srgb,var(--c-background) 14%,transparent);font-size:.85em}`
  )
}

function widgetCss(used: Set<string>): string {
  let css = ''
  if (used.has('button')) {
    css += `.btn{display:inline-block;padding:.8em 1.6em;border-radius:var(--rb);font-weight:600;text-decoration:none;border:1.5px solid transparent;line-height:1.2;text-align:center}`
    if (used.has('btn-primary')) css += `.btn-primary{background:var(--c-primary);color:var(--c-background)}`
    if (used.has('btn-secondary')) css += `.btn-secondary{background:var(--c-secondary);color:var(--c-background)}`
    if (used.has('btn-outline')) css += `.btn-outline{border-color:currentColor;color:inherit}`
  }
  if (used.has('text')) css += `.tx p:last-child{margin-bottom:0}`
  if (used.has('topbar'))
    css +=
      `.stb{background:var(--c-secondary);color:color-mix(in srgb,var(--c-background) 78%,transparent);font-size:.82em}.stb-in{max-width:var(--w);margin:0 auto;padding:7px 24px;display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:space-between}.stb a{color:var(--c-background);font-weight:700;text-decoration:none}` +
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.stb-in>span{display:none}}`
  if (used.has('crop')) css += `img.crop{width:100%;height:auto;object-fit:cover}`
  if (used.has('bg'))
    css +=
      `.hasbg{position:relative;overflow:hidden;isolation:isolate}.bgi{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;z-index:-2}` +
      `.bgt{position:absolute;inset:0;z-index:-1;pointer-events:none}.bgt-full{background:rgb(0 0 0/var(--o))}` +
      `.bgt-side{background:linear-gradient(90deg,rgb(0 0 0/var(--o)) 0%,rgb(0 0 0/calc(var(--o)*.72)) 45%,rgb(0 0 0/0) 80%)}` +
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.bgt-side{background:rgb(0 0 0/calc(var(--o)*.85))}}.bgc{position:relative}`
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
  if (s.letterSpacing !== undefined) add(d, sel, { 'letter-spacing': `${s.letterSpacing}em` })
  if (s.textTransform) add(d, sel, { 'text-transform': s.textTransform })
  if (s.fontFamily) add(d, sel, { 'font-family': s.fontFamily === 'heading' ? 'var(--f-h)' : 'var(--f-b)' })
  if (s.border) add(d, sel, { border: `1px solid ${color(s.border)}` })
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

// Serve a rendered page under a path prefix (the dashboard's /preview/<site>
// view) by re-pointing every internal link. Absolute URLs — canonical, og:url,
// external links — and image sources are left alone.
export function withBasePath(html: string, basePath: string): string {
  return html.replaceAll('href="/', `href="${basePath}/`)
}
