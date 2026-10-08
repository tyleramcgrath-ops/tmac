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

import { intakeSet, type IntakeQuestion, type IntakeSet } from './intake'
import { EVENTS_CSS, eventsHtml, upcomingEvents } from './events'
import { photoKeysOn } from './photo-rules'
import { WORDS, wordsFor, type SiteWords } from './site-words'
import { vibeCheck } from './vibe'
import {
  BREAKPOINT_MAX_WIDTH,
  COLOR_TOKENS,
  FONT_STACKS,
  HEADING_FONTS,
  flairOf,
  headingFont,
  type Flair,
  pagePath,
  siteOrigin,
  type Breakpoint,
  type ColorValue,
  type Container,
  type Element,
  type ElementStyle,
  type GlobalStyles,
  FORM_FIELDS,
  type Page,
  type Responsive,
  type Site,
  type Widget,
  walk,
} from './schema'
import { promoActive } from './promote'
import { breadcrumbs, structuredData } from './seo'

export interface RenderedPage {
  html: string
  css: string
}

export function renderPage(site: Site, page: Page, allPages: readonly Page[] = [page]): RenderedPage {
  t = wordsFor(site.language)
  // Question sets are written in English, so only English sites show them.
  intake = site.language === 'es' ? undefined : intakeSet(site.intake?.[page.id])
  // The header's call-to-action is a button even when the page has none.
  const bar = callBar(site)
  // Upcoming events show on the home page, after the owner's own sections.
  const events = page.slug === '' ? eventsHtml(upcomingEvents(site), t) : ''
  const css = (events ? EVENTS_CSS : '') + buildCss(site.globals, page.body, [...(site.header?.cta ? ['button', 'btn-primary'] : []), ...(site.header?.topbar ? ['topbar'] : []), ...(promoActive(site) ? ['promo'] : []), ...(bar ? ['callbar'] : []), ...(site.nav.some((n) => n.children?.length) ? ['navdd'] : []), ...(site.business.sameAs?.length ? ['social'] : []), ...(site.chat ? ['chat'] : []), ...(page.slug.includes('/') ? ['bc'] : [])]) + headerColors(site)
  const origin = siteOrigin(site)
  const url = origin + pagePath(page)
  const jsonLd = structuredData(site, page, allPages)

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.seo.title)}</title>`,
    `<meta name="description" content="${esc(page.seo.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    // Held out of Google until it passes the originality check (lib/vibe.ts).
    page.seo.noindex || !vibeCheck(site, page, allPages).indexable ? '<meta name="robots" content="noindex">' : '',
    page.slug === '' && site.verification?.google ? `<meta name="google-site-verification" content="${esc(site.verification.google)}">` : '',
    page.slug === '' && site.verification?.bing ? `<meta name="msvalidate.01" content="${esc(site.verification.bing)}">` : '',
    `<link rel="icon" href="${esc(favicon(site))}">`,
    `<meta name="theme-color" content="${esc(site.globals.colors.primary)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(page.seo.title)}">`,
    `<meta property="og:description" content="${esc(page.seo.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:site_name" content="${esc(site.business.name)}">`,
    `<meta property="og:image" content="${esc(shareImage(site, page))}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    fontPreload(site.globals),
    ...jsonLd.map((d) => `<script type="application/ld+json">${jsonForScript(d)}</script>`),
    `<style>${css}</style>`,
  ].filter(Boolean)

  store = site.store
  posts = allPages.filter((p) => p.post && p.status === 'published').sort((a, b) => b.post!.date.localeCompare(a.post!.date))
  const body = [
    renderHeader(site, page),
    `<main>${crumbBar(site, page, allPages)}${page.body.map(renderElement).join('')}${events}</main>`,
    renderFooter(site, photoKeysOn(page.body)),
    chatButton(site),
    bar,
  ].join('')

  const html = `<!doctype html><html lang="${esc(site.language)}"><head>${head.join('')}</head><body>${body}</body></html>`
  return { html, css }
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

// The site's products, for the products widget. Set per render; rendering is
// synchronous, so this can't leak between pages.
let store: Site['store']
let t: SiteWords = WORDS.en
let posts: Page[] = []
// The intake questions for the page being rendered (lib/intake), if any.
let intake: IntakeSet | undefined

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
  // Hooks for the shared polish: rows of items (g) and cards (cd).
  const row = c.layout === 'grid' || c.direction?.desktop === 'row'
  const card = !!c.style?.background && !!c.style.borderRadius
  const classes = `${cls(c.id)}${c.boxed ? ' bx' : ''}${bg ? ' hasbg' : ''}${row && !c.boxed ? ' g' : ''}${card ? ' cd' : ''}`
  // Boxed: the element spans full width (background bleeds); content sits in
  // an inner box capped at the global container width.
  return c.boxed
    ? `<${tag} class="${classes}">${photo}<div class="${cls(c.id)}-in bi${row ? ' g' : ''}">${inner}</div></${tag}>`
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
      // <details> gives open/close with zero JavaScript. Each question is a
      // real heading inside its summary, so search and answer engines read it
      // as a question the page answers.
      return `<div class="faq ${c}">${w.items
        .map((i) => `<details><summary><h3>${esc(i.question)}</h3></summary><div>${paragraphs(i.answer).map((p) => `<p>${p}</p>`).join('')}</div></details>`)
        .join('')}</div>`
    case 'form':
      return renderForm(w)
    case 'products':
      return renderProducts(w)
    case 'posts':
      return renderPosts(w)
    case 'gallery': {
      const cols = w.columns ?? 3
      return `<div class="gal gal-${cols} ${c}">${w.images
        .map((i) => `<figure><img src="${esc(i.src)}"${srcset(i.src, i.width)} sizes="(max-width: 640px) 100vw, ${Math.round(100 / cols)}vw" alt="${esc(i.alt)}" width="${i.width}" height="${i.height}" loading="lazy" decoding="async">${i.caption ? `<figcaption>${esc(i.caption)}</figcaption>` : ''}</figure>`)
        .join('')}</div>`
    }
    case 'ticker': {
      // The list twice, end to end, so the strip loops without a seam; the
      // copy is hidden from screen readers.
      const list = `<li>${w.items.map(esc).join('</li><li>')}</li>`
      return `<div class="tk ${c}"><div class="tk-t"><ul>${list}</ul><ul aria-hidden="true">${list}</ul></div></div>`
    }
    case 'testimonials':
      return `<div class="tst ${c}">${w.items
        .map((q) => `<figure>${q.stars ? `<span class="tst-stars" role="img" aria-label="${esc(t.stars(q.stars))}">${'★'.repeat(q.stars)}${'☆'.repeat(5 - q.stars)}</span>` : ''}<blockquote>${esc(q.quote)}</blockquote><figcaption><strong>${esc(q.name)}</strong>${q.detail ? `<span>${esc(q.detail)}</span>` : ''}</figcaption></figure>`)
        .join('')}</div>`
  }
}

// Accepts a day ("2026-09-28") or a full timestamp.
export function formatDate(iso: string, locale = 'en-US'): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function renderPosts(w: Extract<Widget, { type: 'posts' }>): string {
  const list = posts.slice(0, w.limit ?? 50)
  if (!list.length) return `<p class="po-none">${esc(t.noPosts)}</p>`
  const cards = list.map((p) => {
    const href = pagePath(p)
    const img = p.post!.image
      ? `<a href="${esc(href)}" tabindex="-1" aria-hidden="true"><img class="po-img" src="${esc(p.post!.image.src)}"${srcset(p.post!.image.src, 1200)} sizes="(max-width: 640px) 100vw, 33vw" alt="" width="1200" height="800" loading="lazy" decoding="async"></a>`
      : ''
    return `<article class="po">${img}<time datetime="${esc(p.post!.date)}">${esc(formatDate(p.post!.date, t.locale))}</time><h3 class="po-t"><a href="${esc(href)}">${esc(p.post!.title)}</a></h3><p>${esc(p.post!.excerpt)}</p><a class="po-more" href="${esc(href)}">${esc(t.readMore)}</a></article>`
  })
  return `<div class="pos ${cls(w.id)}">${cards.join('')}</div>`
}

const SYMBOL: Record<string, string> = { USD: '$', CAD: 'CA$', AUD: 'A$', GBP: '£', EUR: '€' }

export function formatPrice(cents: number, currency: string): string {
  const whole = cents % 100 === 0
  return `${SYMBOL[currency] ?? ''}${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`
}

function renderProducts(w: Extract<Widget, { type: 'products' }>): string {
  const products = (store?.products ?? []).slice(0, w.limit ?? 100)
  if (!products.length) return ''
  const cur = store?.currency ?? 'USD'
  const cards = products.map((p) => {
    const img = p.image
      ? `<img class="pr-img" src="${esc(p.image.src)}"${srcset(p.image.src, 800)} sizes="(max-width: 640px) 100vw, 33vw" alt="${esc(p.image.alt)}" width="800" height="800" loading="lazy" decoding="async">`
      : `<div class="pr-img pr-none" aria-hidden="true">${esc(p.name.charAt(0))}</div>`
    const buy = p.soldOut
      ? `<span class="pr-out">${esc(t.soldOut)}</span>`
      : p.buyUrl
        ? `<a class="btn btn-primary pr-buy" href="${esc(p.buyUrl)}" rel="noopener">${esc(t.buyNow)}</a>`
        : `<a class="btn btn-outline pr-buy" href="/contact">${esc(t.askAboutThis)}</a>`
    return `<article class="pr">${img}<div class="pr-body"><h3 class="pr-name">${esc(p.name)}</h3>${p.description ? `<p class="pr-desc">${esc(p.description)}</p>` : ''}<div class="pr-foot"><p class="pr-price">${esc(formatPrice(p.price, cur))}</p>${buy}</div></div></article>`
  })
  return `<div class="prs ${cls(w.id)}">${cards.join('')}</div>`
}

const FIELD: Record<(typeof FORM_FIELDS)[number], { label: (w: SiteWords) => string; input: string }> = {
  name: { label: (w) => w.yourName, input: '<input name="name" autocomplete="name" required maxlength="120">' },
  email: { label: (w) => w.email, input: '<input name="email" type="email" autocomplete="email" required maxlength="200">' },
  phone: { label: (w) => w.phone, input: '<input name="phone" type="tel" autocomplete="tel" maxlength="40">' },
  message: { label: (w) => w.howCanWeHelp, input: '<textarea name="message" rows="5" required maxlength="5000"></textarea>' },
}

// A plain HTML form: no script. The server answers a post with a redirect to
// "#sent", which reveals the thank-you note through :target, so the cached
// page never changes. "website" is a honeypot field people never see.
function renderForm(w: Extract<Widget, { type: 'form' }>): string {
  const field = (f: (typeof FORM_FIELDS)[number]) => `<label><span>${esc(FIELD[f].label(t))}${f === 'phone' ? ` <em>(${esc(t.optional)})</em>` : ''}</span>${FIELD[f].input}</label>`
  // Intake questions go just before the message box, all optional.
  const questions = intake ? (intake.note ? `<p class="sform-note">${esc(intake.note)}</p>` : '') + intake.questions.map(intakeField).join('') : ''
  const fields = w.fields.map((f) => (f === 'message' ? questions + field(f) : field(f))).join('') + (w.fields.includes('message') ? '' : questions)
  return (
    `<form class="sform ${cls(w.id)}" method="post" action="/__form">` +
    `<p class="sform-ok" id="sent" role="status">${esc(w.thanks ?? t.thanks)}</p>` +
    `<input type="hidden" name="form" value="${esc(w.id)}">` +
    `<label class="sform-hp" aria-hidden="true">${esc(t.leaveEmpty)}<input name="website" tabindex="-1" autocomplete="off"></label>` +
    fields +
    `<button class="btn btn-primary" type="submit">${esc(w.submitLabel)}</button></form>`
  )
}

function intakeField(q: IntakeQuestion): string {
  const name = `q_${q.id}`
  const label = `<span>${esc(q.label)} <em>(${esc(t.optional)})</em></span>`
  if (q.kind === 'text') return `<label>${label}<input name="${name}" maxlength="300"></label>`
  if (q.kind === 'date') return `<label>${label}<input name="${name}" type="date"></label>`
  const options = q.kind === 'yesno' ? [['yes', 'Yes'], ['no', 'No']] : (q.options ?? []).map((o) => [o, o])
  return `<label>${label}<select name="${name}"><option value="">Choose…</option>${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`
}

function renderHeader(site: Site, page: Page): string {
  const current = pagePath(page)
  // An item with its own pages opens a short list on hover or keyboard
  // focus; tapping it on a phone goes to its page, which lists them all.
  const links = site.nav
    .map((n) => {
      const here = n.href === current || !!n.children?.some((c) => c.href === current)
      const a = `<a href="${esc(n.href)}"${here ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`
      if (!n.children?.length) return a
      return `<div class="nv-dd">${a}<div class="nv-sub">${n.children.map((c) => `<a href="${esc(c.href)}"${c.href === current ? ' aria-current="page"' : ''}>${esc(c.label)}</a>`).join('')}</div></div>`
    })
    .join('')
  const h = site.header
  const phone = site.business.phone
  const top = h?.topbar
    ? `<div class="stb"><div class="stb-in"><span>${esc(h.topbar)}</span>${phone ? `<a href="${esc(tel(phone))}">${esc(phone)}</a>` : ''}</div></div>`
    : ''
  const cta = h?.cta ? `<a class="btn btn-primary sh-cta" href="${esc(h.cta.href)}">${esc(h.cta.label)}</a>` : ''
  const brand = site.business.logo
    ? `<img class="sh-logo" src="${esc(site.business.logo)}" alt="${esc(site.business.name)}" width="252" height="56" loading="lazy" decoding="async">`
    : esc(site.business.name)
  const promo = promoActive(site) && site.promo ? promoBar(site.promo) : ''
  return `<header class="sh">${promo}${top}<div class="sh-in"><a class="sh-brand" href="/">${brand}</a>${links ? `<nav aria-label="${esc(t.mainNav)}">${links}</nav>` : ''}${cta}</div></header>`
}

// The header's own colours, set after the base styles so they win.
function headerColors(site: Site): string {
  const c = site.header?.colors
  if (!c) return ''
  const hex = (v: string) => (/^#[0-9a-f]{3,6}$/i.test(v) ? v : '')
  const bg = hex(c.background)
  const fg = hex(c.text)
  let css = bg && fg ? `.sh{background:${bg};border-bottom-color:transparent}.sh-brand,.sh nav a:hover,.sh nav a[aria-current]{color:${fg}}.sh nav a{color:color-mix(in srgb,${fg} 78%,transparent)}` : ''
  const tb = c.topbarBackground && hex(c.topbarBackground)
  const tt = c.topbarText && hex(c.topbarText)
  if (tb && tt) css += `.stb{background:${tb};color:${tt}}.stb a{color:${tt}}`
  return css
}

function promoBar(p: NonNullable<Site['promo']>): string {
  const text = esc(p.text)
  if (!p.href) return `<div class="spb"><p>${text}</p></div>`
  const ext = p.href.startsWith('http') ? ' rel="noopener"' : ''
  return `<div class="spb"><p><a href="${esc(p.href)}"${ext}>${text}</a></p></div>`
}

// On phones, the two things local customers want most, one thumb away:
// call, and either the header's button (book, quote) or directions.
function callBar(site: Site): string {
  const phone = site.business.phone
  if (!phone || site.header?.callBar === false) return ''
  const cta = site.header?.cta
  const a = site.business.address
  const second =
    cta && !cta.href.startsWith('tel:')
      ? `<a class="scb-go" href="${esc(cta.href)}">${esc(cta.label)}</a>`
      : a
        ? `<a class="scb-go" href="https://www.google.com/maps/dir/?api=1&amp;destination=${esc(encodeURIComponent(`${a.street}, ${a.city}, ${a.region} ${a.postalCode}`))}" rel="noopener">${esc(t.directions)}</a>`
        : ''
  const icon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>'
  return `<nav class="scb" aria-label="${esc(t.quickContact)}"><a class="scb-call" href="${esc(tel(phone))}">${icon}${esc(t.call)}</a>${second}</nav>`
}


// Social profiles the owner added, as small icons. Known networks get their
// own mark; anything else a plain link icon.
const SOCIAL: [RegExp, string, string][] = [
  [/facebook\.com|fb\.com/, 'Facebook', 'M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z'],
  [/instagram\.com/, 'Instagram', 'M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM16.5 2h-9A5.5 5.5 0 0 0 2 7.5v9A5.5 5.5 0 0 0 7.5 22h9a5.5 5.5 0 0 0 5.5-5.5v-9A5.5 5.5 0 0 0 16.5 2zm3.7 14.5a3.7 3.7 0 0 1-3.7 3.7h-9a3.7 3.7 0 0 1-3.7-3.7v-9a3.7 3.7 0 0 1 3.7-3.7h9a3.7 3.7 0 0 1 3.7 3.7z'],
  [/linkedin\.com/, 'LinkedIn', 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z'],
  [/youtube\.com|youtu\.be/, 'YouTube', 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z'],
  [/tiktok\.com/, 'TikTok', 'M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.2 6.2 0 1 0 5.3 6.2V8.8a7.6 7.6 0 0 0 4.4 1.4V6.9a4.4 4.4 0 0 1-4.4-4.4z'],
  [/(^|\.)x\.com|twitter\.com/, 'X', 'M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z'],
  [/yelp\.com/, 'Yelp', 'M12.4 2.2c-.4-.3-5.4 1-6 1.6-.4.4-.4.9-.2 1.3l4.9 7.9c.5.8 1.8.5 1.8-.5l.1-9.4c0-.4-.2-.7-.6-.9zM20 12.6l-4.4 1.2c-.9.2-1 1.5-.1 1.9l4.1 2c.5.2 1-.1 1.2-.6.3-1 .3-2.6.1-3.6-.2-.6-.6-.9-.9-.9zm-3.3 4.9c-.6-.7-1.8-.3-1.8.6v4.6c0 .5.5.9 1 .8 1-.2 2.5-1 3.2-1.8.3-.3.3-.8 0-1.2zM10 14.5l-4.4-1.6c-.5-.2-1 .2-1.1.7-.1 1 .1 2.6.5 3.5.2.5.8.7 1.2.4l3.9-2.2c.8-.4.7-1.5-.1-1.8z'],
  [/pinterest\.com/, 'Pinterest', 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.8 0 1.2.6 1.2 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.5 2.1-4.5 4.4 0 .9.3 1.8.8 2.3l.1.4-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.2 2.4-6.2 6.8-6.2 3.6 0 6.4 2.6 6.4 6 0 3.6-2.2 6.4-5.4 6.4-1 0-2-.5-2.4-1.2l-.6 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2z'],
]
const LINK_ICON = 'M10.6 13.4a1 1 0 0 1 0-1.4l3.4-3.4a3 3 0 0 1 4.2 4.2l-2.1 2.1a1 1 0 1 1-1.4-1.4l2.1-2.1a1 1 0 0 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4L10 15.4a3 3 0 0 1-4.2-4.2l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a1 1 0 0 0 1.4 1.4L12 10.6a1 1 0 0 1 1.4 0z'

function socialLinks(urls: string[]): string {
  return urls
    .filter((u) => /^https:\/\//.test(u))
    .slice(0, 8)
    .map((u) => {
      const host = (() => {
        try {
          return new URL(u).hostname.replace(/^www\./, '')
        } catch {
          return ''
        }
      })()
      const [, name, path] = SOCIAL.find(([re]) => re.test(host)) ?? [null, host || 'Link', LINK_ICON]
      return `<a href="${esc(u)}" rel="noopener me" aria-label="${esc(name)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg></a>`
    })
    .join('')
}

function crumbBar(site: Site, page: Page, allPages: readonly Page[]): string {
  const c = breadcrumbs(site, page, allPages)
  if (c.length < 2) return ''
  return `<nav class="bc" aria-label="${esc(t.breadcrumb)}"><ol>${c.map((x, i) => (i === c.length - 1 ? `<li aria-current="page">${esc(x.label)}</li>` : `<li><a href="${esc(x.href)}">${esc(x.label)}</a></li>`)).join('')}</ol></nav>`
}

// The chat button: a text, WhatsApp or Messenger conversation with the
// owner, opened by an ordinary link. Sits above the phone call bar.
function chatButton(site: Site): string {
  const c = site.chat
  if (!c) return ''
  const digits = c.to.replace(/[^\d+]/g, '')
  const href =
    c.kind === 'sms' ? `sms:${digits}` : c.kind === 'whatsapp' ? `https://wa.me/${digits.replace(/^\+/, '')}` : `https://m.me/${encodeURIComponent(c.to.replace(/^@/, ''))}`
  const label = c.kind === 'sms' ? t.chatText : c.kind === 'whatsapp' ? t.chatWhatsapp : t.chatMessenger
  const icon = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.3 21l3.9-2c1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>'
  return `<a class="sct" href="${esc(href)}" aria-label="${esc(label)}"${c.kind === 'sms' ? '' : ' rel="noopener"'}>${icon}<span>${esc(label)}</span></a>`
}

function renderFooter(site: Site, onPage: Set<string> = new Set()): string {
  const b = site.business
  const year = new Date(site.updatedAt).getUTCFullYear() || new Date().getUTCFullYear()
  const cols: string[] = [`<div><strong class="sf-brand">${esc(b.name)}</strong>${site.tagline ? `<p>${esc(site.tagline)}</p>` : ''}</div>`]
  const contact: string[] = []
  if (b.phone) contact.push(`<a href="${esc(tel(b.phone))}">${esc(b.phone)}</a>`)
  if (b.email) contact.push(`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`)
  if (b.address) contact.push(`<span>${esc(`${b.address.street}, ${b.address.city}, ${b.address.region} ${b.address.postalCode}`)}</span>`)
  if (b.reviewUrl) contact.push(`<a href="/review" rel="nofollow">${esc(t.leaveReview)}</a>`)
  if (contact.length) cols.push(`<div><h2 class="sf-h">${esc(t.contact)}</h2>${contact.join('')}</div>`)
  if (b.hours?.length) {
    const rows = b.hours.map((line) =>
      esc(
        line
          .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => t.days[d])
          .replace(/-(?=[A-Z])/, '-')
          .replace(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/, (_m, h1, m1, h2, m2) => `${t.clock(+h1, m1)} ${t.to} ${t.clock(+h2, m2)}`)
      )
    )
    cols.push(`<div><h2 class="sf-h">${esc(t.hours)}</h2>${rows.map((r) => `<span>${r}</span>`).join('')}</div>`)
  }
  const pages = site.nav.filter((n) => n.href.startsWith('/'))
  if (pages.length) cols.push(`<div><h2 class="sf-h">${esc(t.pages)}</h2><a href="/">${esc(t.home)}</a>${pages.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('')}<a href="/privacy">${esc(t.privacy)}</a></div>`)
  // Every service page, listed: visitors find them, and so does Google.
  for (const n of site.nav.filter((x) => x.children?.length)) cols.push(`<div><h2 class="sf-h">${esc(n.label)}</h2>${n.children!.map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a>`).join('')}</div>`)
  const note = site.footerNote ? `<p class="sf-note">${esc(site.footerNote)}</p>` : ''
  // Credit for the stock photos on this page, as Unsplash asks.
  const shown = (site.credits ?? []).filter((c) => onPage.has(c.photo))
  const people = [...new Map(shown.map((c) => [c.url, c])).values()]
  const utm = (u: string) => `${u}${u.includes('?') ? '&' : '?'}utm_source=saysites&utm_medium=referral`
  const credit = people.length
    ? `<p class="sf-note">${esc(t.photosBy)} ${people.map((c) => `<a href="${esc(utm(c.url))}" rel="nofollow noopener">${esc(c.name)}</a>`).join(', ')} ${esc(t.onUnsplash)} <a href="${esc(utm('https://unsplash.com/'))}" rel="nofollow noopener">Unsplash</a></p>`
    : ''
  const social = socialLinks(b.sameAs ?? [])
  if (social) cols[0] = cols[0].replace(/<\/div>$/, `<div class="sf-so">${social}</div></div>`)
  return `<footer class="sf"><div class="sf-in">${cols.join('')}</div><div class="sf-base">${note}${credit}© ${year} ${esc(b.name)}</div></footer>`
}


function tel(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

// The business logo when there is one; otherwise an inline SVG monogram in
// the brand color, so there is never a missing-favicon request.
function favicon(site: Site): string {
  if (site.business.icon) return site.business.icon
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
      if (el.type === 'form') used.add('button').add('btn-primary')
      if (el.type === 'products') used.add('button').add('btn-primary').add('btn-outline')
    }
    if (el.style) styleRules(`.${cls(el.id)}`, el.style, byBp)
  }
  body.forEach(visit)

  return [
    base,
    widgetCss(used),
    polishCss(g, used),
    emit(byBp.desktop),
    media('tablet', byBp.tablet),
    media('mobile', byBp.mobile),
  ].join('')
}

function fontPreload(g: GlobalStyles): string {
  const f = headingFont(g)
  return f ? `<link rel="preload" href="${HEADING_FONTS[f].file}" as="font" type="font/woff2" crossorigin>` : ''
}

function baseCss(g: GlobalStyles): string {
  const font = headingFont(g)
  const face = font ? `@font-face{font-family:"${HEADING_FONTS[font].family}";src:url(${HEADING_FONTS[font].file}) format("woff2");font-weight:100 900;font-display:optional}` : ''
  const vars = [
    ...COLOR_TOKENS.map((t) => `--c-${t}:${g.colors[t]}`),
    `--f-h:${font ? `"${HEADING_FONTS[font].family}",` : ''}${FONT_STACKS[g.fonts.heading]}`,
    `--f-b:${FONT_STACKS[g.fonts.body]}`,
    `--r:${g.radius}px`,
    `--rb:${g.buttonShape === 'pill' ? '999px' : g.buttonShape === 'square' ? '2px' : `${Math.min(g.radius, 12)}px`}`,
    `--w:${g.containerWidth}px`,
    `--hw:${g.headingWeight ?? 700}`,
  ].join(';')
  // Heading sizes step up the modular scale from the base size (h6 = base).
  const steps = [4, 3, 2, 1, 0.5, 0]
  const sizes = steps.map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** n)}px}`).join('')
    // The page's one h1 grows with the screen, up to a confident display size.
    + `h1{font-size:clamp(${round(g.baseFontSize * g.typeScale ** 3)}px,3.4vw + 1rem,${round(g.baseFontSize * g.typeScale ** 4.7)}px);line-height:1.06}h2{line-height:1.12}`
  // Large headings step down one notch on phones so long words don't wrap badly.
  const mobile = steps.slice(0, 3).map((n, i) => `h${i + 1}{font-size:${round(g.baseFontSize * g.typeScale ** (n - 1))}px}`).join('')
  const btnCase = g.buttonCase === 'upper' ? '.btn{text-transform:uppercase;letter-spacing:.08em;font-size:.85em}' : ''
  return (
    face +
    btnCase +
    `:root{${vars}}*,*::before,*::after{box-sizing:border-box}` +
    `body{margin:0;font-family:var(--f-b);font-size:${g.baseFontSize}px;line-height:1.6;color:var(--c-text);background:var(--c-background);-webkit-font-smoothing:antialiased}h1,h2,h3{text-wrap:balance}` +
    `h1,h2,h3,h4,h5,h6{font-family:var(--f-h);line-height:1.2;margin:0 0 .5em}${sizes}` +
    `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){${mobile}}` +
    `p{margin:0 0 1em}img{max-width:100%;height:auto;display:block}a{color:var(--c-primary)}` +
    `h1,h2,h3{font-weight:${g.headingWeight ?? 700};letter-spacing:${g.headingTracking ?? -0.01}em${g.headingCase === 'upper' ? ';text-transform:uppercase' : ''}}` +
    `.sh{background:var(--c-background);border-bottom:1px solid color-mix(in srgb,var(--c-text) 10%,transparent)}` +
    `.sh-in{max-width:var(--w);margin:0 auto;padding:16px 24px;display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center}` +
    `.sh-brand{font-family:var(--f-h);font-weight:${g.headingWeight ?? 700};letter-spacing:${g.headingTracking ?? -0.01}em;font-size:1.3em;color:var(--c-text);text-decoration:none;margin-right:auto${g.headingCase === 'upper' ? ';text-transform:uppercase' : ''}}` +
    `.sh nav{display:flex;flex-wrap:wrap;gap:8px 22px}.sh nav a{color:var(--c-muted);text-decoration:none;font-weight:500}.sh nav a:hover,.sh nav a[aria-current]{color:var(--c-text)}` +
    `.sh-cta{padding:.6em 1.2em}.sh-logo{height:56px;width:auto;max-width:280px;object-fit:contain}` +
    `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.sh-in{padding:12px 18px;gap:10px 14px}.sh-brand{font-size:1.08em;max-width:62%}.sh-logo{height:44px;max-width:200px}.sh-cta{padding:.55em .95em;font-size:.88em}.sh nav{order:3;width:100%;flex-wrap:nowrap;overflow-x:auto;gap:18px;scrollbar-width:none;padding-bottom:2px}.sh nav a{white-space:nowrap}}` +
    `.sf{background:var(--c-secondary);color:color-mix(in srgb,var(--c-background) 72%,transparent);font-size:.95em}` +
    `.sf-in{max-width:var(--w);margin:0 auto;padding:56px 24px 32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px}` +
    `.sf-in>div{display:flex;flex-direction:column;gap:6px}.sf-in p{margin:4px 0 0;max-width:320px}.sf a{color:inherit;text-decoration:none}.sf a:hover{color:var(--c-background)}` +
    `.sf-brand{font-family:var(--f-h);font-size:1.3em;color:var(--c-background);font-weight:${g.headingWeight ?? 700}}` +
    `.sf-h{font-family:var(--f-b);font-size:.78em;letter-spacing:.1em;text-transform:uppercase;color:var(--c-background);margin:0 0 6px;font-weight:600}` +
    `.sf-base{max-width:var(--w);margin:0 auto;padding:18px 24px 28px;border-top:1px solid color-mix(in srgb,var(--c-background) 14%,transparent);font-size:.85em}.sf-note{margin:0 0 10px;max-width:760px;line-height:1.55}`
  )
}

function widgetCss(used: Set<string>): string {
  let css = ''
  if (used.has('button')) {
    css += `.btn{display:inline-block;padding:.9em 1.75em;border-radius:var(--rb);font-weight:600;text-decoration:none;border:1.5px solid transparent;line-height:1.2;text-align:center;transition:transform .2s}.btn:hover{transform:translateY(-1px)}`
    if (used.has('btn-primary')) css += `.btn-primary{background:var(--c-primary);color:var(--c-background)}`
    if (used.has('btn-secondary')) css += `.btn-secondary{background:var(--c-secondary);color:var(--c-background)}`
    if (used.has('btn-outline')) css += `.btn-outline{border-color:currentColor;color:inherit}`
  }
  if (used.has('text')) css += `.tx p:last-child{margin-bottom:0}`
  if (used.has('topbar'))
    css +=
      `.stb{background:var(--c-secondary);color:color-mix(in srgb,var(--c-background) 78%,transparent);font-size:.82em}.stb-in{max-width:var(--w);margin:0 auto;padding:7px 24px;display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:space-between}.stb a{color:var(--c-background);font-weight:700;text-decoration:none}` +
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.stb-in>span{display:none}}`
  if (used.has('promo'))
    css += `.spb{background:var(--c-primary);color:var(--c-background);font-size:.88em;text-align:center}.spb p{max-width:var(--w);margin:0 auto;padding:9px 20px;line-height:1.4}.spb a{color:inherit;text-decoration:none;font-weight:600}.spb a:hover span{margin-left:3px}`
  if (used.has('callbar'))
    css +=
      `.scb{display:none}@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){body{padding-bottom:76px}` +
      `.scb{display:flex;gap:10px;position:fixed;left:0;right:0;bottom:0;z-index:50;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--c-background);border-top:1px solid color-mix(in srgb,var(--c-text) 12%,transparent)}` +
      `.scb a{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:var(--rb);font-weight:700;text-decoration:none}` +
      `.scb-call{background:var(--c-primary);color:var(--c-background)}.scb-go{border:1.5px solid color-mix(in srgb,var(--c-text) 25%,transparent);color:var(--c-text)}}`
  if (used.has('crop')) css += `img.crop{width:100%;height:auto;object-fit:cover}`
  if (used.has('bg'))
    css +=
      `.hasbg{position:relative;overflow:hidden;isolation:isolate}.bgi{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;z-index:-2}` +
      `.bgt{position:absolute;inset:0;z-index:-1;pointer-events:none}.bgt-full{background:rgb(0 0 0/var(--o))}` +
      `.bgt-side{background:linear-gradient(90deg,rgb(0 0 0/var(--o)) 0%,rgb(0 0 0/calc(var(--o)*.72)) 45%,rgb(0 0 0/0) 80%)}` +
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.bgt-side{background:rgb(0 0 0/calc(var(--o)*.85))}}.bgc{position:relative}`
  if (used.has('gallery'))
    css +=
      `.gal{display:grid;gap:14px}.gal-2{grid-template-columns:repeat(2,minmax(0,1fr))}.gal-3{grid-template-columns:repeat(3,minmax(0,1fr))}.gal-4{grid-template-columns:repeat(4,minmax(0,1fr))}` +
      `.gal figure{margin:0}.gal img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}.gal figcaption{font-size:.9em;color:var(--c-muted);margin-top:6px}` +
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){.gal-3,.gal-4{grid-template-columns:repeat(2,minmax(0,1fr))}}`
  if (used.has('testimonials'))
    css +=
      `.tst{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}.tst figure{margin:0;padding:26px;border-radius:var(--r);background:var(--c-surface);display:flex;flex-direction:column;gap:14px}` +
      `.tst blockquote{margin:0;font-family:var(--f-h);font-size:1.15em;line-height:1.5;color:var(--c-text)}.tst figcaption{display:flex;flex-direction:column;font-size:.92em;margin-top:auto}.tst figcaption span{color:var(--c-muted)}.tst-stars{color:var(--c-accent);letter-spacing:.12em}`
  if (used.has('posts'))
    css +=
      `.pos{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:36px 28px}.po{display:flex;flex-direction:column;gap:8px}` +
      `.po-img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:var(--r);margin-bottom:8px}.po time{font-size:.85em;color:var(--c-muted);font-weight:600;letter-spacing:.02em}` +
      `.po-t{font-size:1.35em;margin:0}.po-t a{color:var(--c-text);text-decoration:none}.po-t a:hover{color:var(--c-primary)}.po p{margin:0;color:var(--c-muted)}.po-more{font-weight:600;text-decoration:none;margin-top:4px}.po-none{color:var(--c-muted)}`
  if (used.has('products'))
    css +=
      `.prs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px}.pr{display:flex;flex-direction:column;gap:14px;background:var(--c-surface);border-radius:var(--r);padding:10px 10px 14px}` +
      `.pr-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:calc(var(--r) * .7);background:var(--c-background)}.pr-none{display:grid;place-items:center;font:600 3em var(--f-h);color:var(--c-muted)}` +
      `.pr-body{display:flex;flex-direction:column;gap:4px;flex:1;padding:0 6px}.pr-name{font-size:1.1em;margin:0}.pr-desc{margin:0;color:var(--c-muted);font-size:.92em}` +
      `.pr-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:auto;padding-top:12px}.pr-price{margin:0;font-weight:700;color:var(--c-text)}` +
      `.pr-buy{padding:.55em 1.1em;font-size:.9em;white-space:nowrap}.pr-out{padding:.5em 1em;font-size:.88em;font-weight:600;color:var(--c-muted);border:1.5px solid color-mix(in srgb,var(--c-muted) 45%,transparent);border-radius:var(--rb)}`
  if (used.has('form'))
    css +=
      `.sform{display:grid;gap:14px;max-width:560px;width:100%}.sform label{display:grid;gap:6px;font-weight:600;font-size:.95em}.sform em{font-weight:400;font-style:normal;color:var(--c-muted)}` +
      `.sform input,.sform textarea,.sform select{font:inherit;font-weight:400;padding:.75em .9em;border:1.5px solid color-mix(in srgb,var(--c-text) 18%,transparent);border-radius:min(var(--r),10px);background:var(--c-background);color:var(--c-text);width:100%}` +
      `.sform-note{margin:0;font-size:.9em;color:var(--c-muted)}.sform input:focus,.sform textarea:focus,.sform select:focus{outline:2px solid var(--c-primary);outline-offset:1px;border-color:var(--c-primary)}.sform .btn{justify-self:start;cursor:pointer;font:inherit;font-weight:600}` +
      `.sform-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}` +
      `.sform-ok{display:none;margin:0;padding:14px 16px;border-radius:min(var(--r),10px);background:color-mix(in srgb,var(--c-primary) 12%,var(--c-background));font-weight:600}.sform-ok:target{display:block}`
  if (used.has('ticker'))
    css +=
      `.tk{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}` +
      `.tk-t{display:flex;width:max-content}.tk ul{display:flex;margin:0;padding:0;list-style:none}` +
      `.tk li{font-family:var(--f-h);font-weight:min(var(--hw),700);font-size:clamp(1.5em,2.6vw,2.4em);line-height:1.2;white-space:nowrap;display:flex;align-items:center}` +
      `.tk li::after{content:"";width:.32em;height:.32em;border-radius:50%;background:var(--c-primary);margin:0 .9em;opacity:.7}` +
      `@media (prefers-reduced-motion:no-preference){.tk-t{animation:tk 48s linear infinite}.tk:hover .tk-t{animation-play-state:paused}@keyframes tk{to{transform:translateX(-50%)}}}` +
      `@media (prefers-reduced-motion:reduce){.tk{-webkit-mask-image:none;mask-image:none}.tk-t,.tk ul{flex-wrap:wrap;width:auto}.tk ul[aria-hidden]{display:none}}`
  if (used.has('faq')) {
    css +=
      `.faq details{border-bottom:1px solid var(--c-surface);padding:12px 0}` +
      `.faq summary{cursor:pointer;font-weight:600}.faq summary h3{display:inline;font:inherit;margin:0;letter-spacing:inherit;text-transform:none}.faq details>div{padding-top:8px}`
  }
  return css
}

// The finish every site shares: a glassy header that stays in reach, buttons
// and cards that answer the pointer, and (unless turned off) sections that
// rise in as they scroll into view and photos that drift a little. All CSS;
// scroll effects only where the browser supports them natively, and never
// for visitors who ask for less motion. Content is never hidden at rest.
function polishCss(g: GlobalStyles, used: Set<string>): string {
  const phone = BREAKPOINT_MAX_WIDTH.mobile
  let css =
    `body{overflow-x:clip}h1,h2,h3{text-wrap:balance}p{text-wrap:pretty}::selection{background:color-mix(in srgb,var(--c-primary) 24%,transparent)}` +
    `a:focus-visible,.btn:focus-visible{outline:2px solid var(--c-primary);outline-offset:3px}` +
    `@media (min-width:${phone + 1}px){.sh{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--c-background) 94%,transparent);-webkit-backdrop-filter:saturate(1.4) blur(14px);backdrop-filter:saturate(1.4) blur(14px)}` +
    `.sh nav a{position:relative}.sh nav a::after{content:"";position:absolute;left:0;right:0;bottom:-5px;height:1.5px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.2,.7,.2,1)}.sh nav a:hover::after,.sh nav a[aria-current]::after{transform:scaleX(1)}}` +
    `.cd{transition:transform .4s cubic-bezier(.2,.7,.2,1),box-shadow .4s}.cd:hover{transform:translateY(-4px);box-shadow:0 24px 44px -30px rgb(0 0 0/.4)}`
  if (used.has('button'))
    css +=
      `.btn{transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s,background-color .2s,color .2s}.btn:hover{transform:translateY(-2px)}` +
      `.btn-primary:hover{box-shadow:0 14px 28px -16px var(--c-primary)}`
  if (used.has('gallery')) css += `.gal figure{overflow:hidden;border-radius:var(--r)}.gal img{transition:transform .8s cubic-bezier(.2,.7,.2,1)}.gal figure:hover img{transform:scale(1.04)}`
  if (used.has('navdd')) css +=
    `.nv-dd{position:relative;display:inline-flex;align-items:center}.nv-dd>a{padding-right:15px}.nv-dd>a::before{content:"";position:absolute;right:1px;top:50%;width:6px;height:6px;margin-top:-5px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(45deg);opacity:.7}` +
    `.nv-sub{position:absolute;top:100%;left:-14px;margin-top:12px;min-width:250px;padding:8px;display:none;flex-direction:column;gap:2px;background:var(--c-background);border:1px solid color-mix(in srgb,var(--c-text) 10%,transparent);border-radius:min(var(--r),12px);box-shadow:0 22px 44px -24px rgb(0 0 0/.4);z-index:45}` +
    `.nv-sub::before{content:"";position:absolute;left:0;right:0;top:-14px;height:14px}.nv-dd:hover .nv-sub,.nv-dd:focus-within .nv-sub{display:flex}` +
    `.sh .nv-sub a{color:var(--c-text);padding:9px 12px;border-radius:8px;white-space:nowrap;font-weight:500}.sh .nv-sub a:hover,.sh .nv-sub a[aria-current]{background:var(--c-surface);color:var(--c-text)}.sh .nv-sub a::after{display:none}` +
    `@media (max-width:${phone}px){.nv-sub{display:none!important}.nv-dd>a{padding-right:0}.nv-dd>a::before{display:none}}`
  if (used.has('social')) css +=
    `.sf-so{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.sf-so a{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid color-mix(in srgb,var(--c-background) 25%,transparent)}.sf-so a:hover{background:color-mix(in srgb,var(--c-background) 12%,transparent)}`
  if (used.has('chat')) css +=
    `.sct{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:55;display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;background:var(--c-primary);color:var(--c-background);font-weight:600;text-decoration:none;box-shadow:0 16px 34px -14px rgb(0 0 0/.5);transition:transform .25s}.sct:hover{transform:translateY(-2px)}` +
    `@media (max-width:${phone}px){.scb~.sct,.sct{bottom:calc(88px + env(safe-area-inset-bottom));right:14px;padding:12px}.sct span{display:none}}`
  if (used.has('bc')) css +=
    `.bc{max-width:var(--w);margin:0 auto;padding:14px 24px;font-size:.88em;color:var(--c-muted)}.bc ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}.bc li+li::before{content:"/";margin-right:6px;opacity:.5}.bc a{color:inherit;text-decoration:none}.bc a:hover{color:var(--c-text)}`
  const flair = FLAIR_CSS[flairOf(g)]
  css += flair.still
  if (g.motion === false) return css
  const rise = (sel: string, range: string) => `${sel}{animation:sr linear both;animation-timeline:view();animation-range:${range}}`
  return (
    css +
    `@media (prefers-reduced-motion:no-preference){` +
    `.hasbg>.bgi[fetchpriority]{animation:sk 2.4s cubic-bezier(.2,.7,.2,1) both}@keyframes sk{from{transform:scale(1.07)}}` +
    `@supports (animation-timeline:view()){` +
    `@media (min-width:${phone + 1}px){.sh{animation:sd linear both;animation-timeline:scroll();animation-range:0 140px}@keyframes sd{to{box-shadow:0 12px 32px -22px rgb(0 0 0/.45)}}}` +
    rise(':where(.bi)>*:not(.g)', 'entry 0% entry 55%') +
    rise('.g>*', 'entry 0% entry 60%') +
    rise('.g>:nth-child(3n+2)', 'entry 6% entry 68%') +
    rise('.g>:nth-child(3n)', 'entry 12% entry 76%') +
    `@keyframes sr{from{opacity:var(--ro,0);transform:translate3d(var(--rx,0),var(--ry,34px),0) scale(var(--rs,1));filter:blur(var(--rbl,0))}}` +
    `.hasbg>.bgi:not([fetchpriority]){top:-10%;height:120%;animation:sp linear both;animation-timeline:view()}@keyframes sp{from{transform:translateY(-7%)}to{transform:translateY(7%)}}` +
    flair.moving +
    `}}`
  )
}

// What each personality adds: `still` always, `moving` only where scroll
// animations run. Drawn from well-made small-business sites: numbered
// sections and image wipes (editorial law and dental sites), framed photos
// and a reading bar (restaurants, boutique practices), arches and soft
// rises (salons, bakeries), a diagonal hero and side-on entrances (trades),
// photos that turn from black and white to colour (studios, barbers).
const PROGRESS = `body::before{content:"";position:fixed;top:0;left:0;right:0;height:3px;background:var(--c-primary);transform-origin:0 50%;transform:scaleX(0);z-index:60;pointer-events:none;animation:pg linear both;animation-timeline:scroll(root)}@keyframes pg{to{transform:scaleX(1)}}`
const PHOTOS = 'main .bi img:not(.bgi)'
const FLAIR_CSS: Record<Flair, { still: string; moving: string }> = {
  editorial: {
    still:
      `main>section~section h2::before{content:"";display:block;width:36px;height:2px;background:var(--c-primary);margin:0 var(--al,0) .9em}` +
      `main>section+section:not(.hasbg){border-top:1px solid color-mix(in srgb,var(--c-text) 9%,transparent)}`,
    moving: `${PHOTOS}{animation:ew linear both;animation-timeline:view();animation-range:entry 0% cover 40%}@keyframes ew{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}`,
  },
  luxe: {
    still:
      `${PHOTOS},.gal img{outline:1px solid color-mix(in srgb,var(--c-primary) 60%,transparent);outline-offset:-14px}` +
      `main h2::before{content:"";display:block;width:44px;height:1px;background:var(--c-primary);margin:0 var(--al,0) 1.1em}`,
    moving: `:root{--ry:16px;--rbl:2px}${PROGRESS}`,
  },
  soft: {
    still: `${PHOTOS}{border-radius:28px}main img[style*="aspect-ratio:0."]{border-radius:999px 999px 28px 28px}.cd.cd{border-radius:26px}.gal img{border-radius:22px}`,
    moving: `:root{--ry:22px;--rs:.96;--rbl:6px}`,
  },
  bold: {
    still:
      `main>section.hasbg:first-child{z-index:2;clip-path:polygon(0 0,100% 0,100% calc(100% - 3.5vw),0 100%);margin-bottom:-3.5vw}main>section.hasbg:first-child+*{border-top:3.5vw solid transparent}` +
      `main h2::after{content:"";display:block;width:56px;height:5px;border-radius:3px;background:var(--c-primary);margin:.4em var(--al,0) 0}`,
    moving: `${PROGRESS}.g>:nth-child(odd){--rx:-40px;--ry:0}.g>:nth-child(even){--rx:40px;--ry:0}`,
  },
  studio: {
    still: `${PHOTOS}{border-radius:0}main h2{text-transform:uppercase;letter-spacing:-.01em}.tk li{text-transform:uppercase}`,
    moving: `:root{--ry:48px}${PHOTOS}{animation:sg linear both;animation-timeline:view();animation-range:entry 20% cover 55%}@keyframes sg{from{filter:grayscale(1) contrast(1.06)}}`,
  },
  clean: {
    still: '',
    moving: `:root{--ry:18px}.hasbg>.bgi:not([fetchpriority]){animation:none;top:0;height:100%}`,
  },
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
      // In a column, a button keeps its own width instead of stretching.
      if (d === 'column') add(byBp[bp], `${layoutSel}>.btn`, { 'align-self': c.align && c.align !== 'stretch' ? ALIGN[c.align] : 'flex-start' })
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
  // --al lets decorations (a rule above a heading) centre with the text.
  if (s.textAlign) eachBp(s.textAlign, (bp, v) => add(byBp[bp], sel, { 'text-align': v, '--al': v === 'center' ? 'auto' : '0' }))
  if (s.background) add(d, sel, { background: color(s.background) })
  if (s.color) add(d, sel, { color: color(s.color) })
  if (s.fontWeight) add(d, sel, { 'font-weight': String(s.fontWeight) })
  if (s.borderRadius !== undefined) add(d, sel, { 'border-radius': `${s.borderRadius}px` })
  if (s.maxWidth !== undefined) add(d, sel, { 'max-width': `${s.maxWidth}px` })
  if (s.letterSpacing !== undefined) add(d, sel, { 'letter-spacing': `${s.letterSpacing}em` })
  if (s.textTransform) add(d, sel, { 'text-transform': s.textTransform })
  if (s.fontFamily) add(d, sel, { 'font-family': s.fontFamily === 'heading' ? 'var(--f-h)' : 'var(--f-b)' })
  if (s.border) add(d, sel, { border: `1px solid ${color(s.border)}` })
  // Doubled class: beats the parent row's equal-share rule on desktop; the
  // phone layout (stacked) still wins there.
  if (s.grow) add(d, `${sel}${sel}`, { flex: `${s.grow} 1 0` })
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

// The picture shown when a page is shared on Facebook, iMessage, Slack...
// The owner's choice, else the post's or page's first photo, else a card
// drawn from the site's name and colours (/__og).
export const SHARE_CARD_PATH = '__og'
export function shareImage(site: Site, page: Page): string {
  const origin = siteOrigin(site)
  // The first photo on the page, whether an image or a section's background.
  const photo = [...walk(page.body)].map((el) => (el.type === 'image' ? el.src : el.type === 'container' ? el.backgroundImage?.src : undefined)).find(Boolean)
  const first = page.seo.ogImage ?? page.post?.image?.src ?? photo
  if (!first) return `${origin}/${SHARE_CARD_PATH}?p=${encodeURIComponent(pagePath(page))}`
  // Stock photos come cropped to the 1200 x 630 shape share previews use.
  if (first.startsWith('https://images.unsplash.com/')) {
    const u = new URL(first)
    u.searchParams.set('w', '1200')
    u.searchParams.set('h', '630')
    u.searchParams.set('fit', 'crop')
    return u.toString()
  }
  return absolute(origin, first)
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
  // Uploads (/u/…) and shared media are served at the same address on every
  // host, so only page links and form actions move under the base path.
  return html.replace(/href="\/(?!u\/|media\/|_next\/)/g, `href="${basePath}/`).replaceAll('action="/', `action="${basePath}/`)
}
