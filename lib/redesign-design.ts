// The free redesign's own designs: hand-made pages (raw HTML and CSS, no
// scripts) built around what makes the firm convincing on its current site:
// its real photos, attorneys, published results, clients' reviews and
// awards (lib/redesign-assets). Three looks, each with two type pairings and
// the firm's brand colour (calmed), so no two firms come out the same:
//
//   noir     dark and quiet, their photo full-bleed, brass-like accent
//   gazette  light editorial: a big serif headline, numbered index, ledger
//   atelier  modern and bright: rounded photo, cards, a colour band
//
// Pages are stored like kept pages (page.classic), so they're served with
// scripts blocked and their words can be changed by Sofie (replace_words).
// Nothing here is invented: every fact, number and quote comes from them.

import type { SiteAssets, SitePhoto } from './redesign-assets'

export type Look = 'noir' | 'gazette' | 'atelier'
export const LOOKS: Look[] = ['noir', 'gazette', 'atelier']

export interface NavLink {
  label: string
  href: string
  children?: { label: string; href: string }[]
}
export interface ShowcaseFirm {
  look: Look
  // 0 or 1: which type pairing the look uses.
  pairing: number
  name: string
  // "Personal injury lawyers", for the eyebrow.
  kind: string
  headline: string
  // Their own slogan, set large when they have one (the headline then
  // stays the page's H1, small above it).
  slogan?: string
  lede?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  region?: string
  postalCode?: string
  hours?: string[]
  freeConsult: boolean
  // Their brand colour (hex), when their site has one.
  brand?: string
  nav: NavLink[]
  services: { name: string; href: string; summary: string; photo?: SitePhoto }[]
  about?: { heading: string; paragraphs: string[]; href?: string }
  team: { name: string; role: string; href?: string; photo?: string }[]
  hero?: SitePhoto
  // A second photo of them, for the firm section.
  portrait?: SitePhoto
  assets: SiteAssets
  // Questions they answer on their own pages, for the home page's FAQ.
  faq?: { q: string; a: string }[]
  // Their profiles elsewhere (Google, Facebook, Avvo), for Google.
  sameAs?: string[]
  // Where forms post (the site's form handler).
  formAction: string
  schemaType: string
  url?: string
}

export interface ShowcasePage {
  path: string
  kicker: string
  title: string
  intro?: string
  blocks: { kind: 'h2' | 'h3' | 'p' | 'li'; text: string }[]
  faq?: { q: string; a: string }[]
  // A photo for the page's opening, when one of theirs fits.
  photo?: SitePhoto
  // People shown as a grid (the attorneys page).
  people?: ShowcaseFirm['team']
  contact?: boolean
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const attr = esc

// ---------------------------------------------------------------- colour

function hsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
function hex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
// Their colour, calmed to suit the look: never loud, always readable.
export function accentFor(look: Look, brand?: string): { accent: string; soft: string; deep: string; glow: string } {
  const [h, s0] = brand && /^#[0-9a-f]{6}$/i.test(brand) ? hsl(brand) : look === 'noir' ? [38, 0.38, 0] : look === 'gazette' ? [158, 0.36, 0] : [208, 0.55, 0]
  const s = Math.min(Math.max(s0, 0.22), look === 'atelier' ? 0.62 : 0.48)
  // glow: the colour on the dark heroes, light enough to read there.
  const glow = hex(h, Math.min(s + 0.08, 0.6), 0.7)
  if (look === 'noir') return { accent: hex(h, s, 0.66), soft: hex(h, s * 0.6, 0.2), deep: hex(h, s, 0.5), glow }
  if (look === 'gazette') return { accent: hex(h, s, 0.3), soft: hex(h, s * 0.5, 0.93), deep: hex(h, s, 0.22), glow }
  return { accent: hex(h, s, 0.38), soft: hex(h, s * 0.55, 0.95), deep: hex(h, s, 0.24), glow }
}

// ---------------------------------------------------------------- type

const FONTS: Record<Look, [string, string, string][]> = {
  // [display family, body family, Google Fonts query]
  noir: [
    ['"Libre Caslon Display", "Libre Caslon Text", Georgia, serif', '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif', 'family=Libre+Caslon+Display&family=Hanken+Grotesk:wght@400;500;600'],
    ['"Prata", "Didot", Georgia, serif', '"Figtree", "Helvetica Neue", Arial, sans-serif', 'family=Prata&family=Figtree:wght@400;500;600'],
  ],
  gazette: [
    ['"Newsreader", Georgia, serif', '"Instrument Sans", "Helvetica Neue", Arial, sans-serif', 'family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Instrument+Sans:wght@400;500;600'],
    ['"Gloock", Georgia, serif', '"Albert Sans", "Helvetica Neue", Arial, sans-serif', 'family=Gloock&family=Albert+Sans:wght@400;500;600&family=Newsreader:ital,opsz@1,6..72'],
  ],
  atelier: [
    ['"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif', '"Onest", "Helvetica Neue", Arial, sans-serif', 'family=Schibsted+Grotesk:wght@500;700;800&family=Onest:wght@400;500;600&family=Newsreader:ital,opsz@1,6..72'],
    ['"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', '"Figtree", "Helvetica Neue", Arial, sans-serif', 'family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600&family=Newsreader:ital,opsz@1,6..72'],
  ],
}

// ---------------------------------------------------------------- parts

const ARROW = '<svg class="ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5 9 3l2 4.6-2 1.4a12 12 0 0 0 6 6l1.4-2 4.6 2-.5 2.4A3 3 0 0 1 17.6 20 14.6 14.6 0 0 1 4 6.4a3 3 0 0 1 2.6-2.9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
const QUOTE = '<svg class="qm" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V22C0 9 7 2 19 0l2 5c-7 2-10 6-10 13h9v18H0Zm27 0V22C27 9 34 2 46 0l2 5c-7 2-10 6-10 13h9v18H27Z" fill="currentColor"/></svg>'

const tel = (phone?: string) => (phone ? `tel:+1${phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')}` : '')
const place = (f: ShowcaseFirm) => [f.city, f.region].filter(Boolean).join(', ')
const address = (f: ShowcaseFirm) => [f.street, [f.city, [f.region, f.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(', ')
// Sized (its real size when measured), so nothing shifts while it loads.
const img = (p: SitePhoto, cls: string, eager = false, sizes = '100vw') =>
  `<img class="${cls}" src="${attr(p.src)}" alt="${attr(p.alt)}" width="${p.width || 1600}" height="${p.height || Math.round((p.width || 1600) * 0.625)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="${sizes}">`

// The firm's name set as a wordmark: the surname part large, any "P.A.",
// "LLC" or "Law Firm" small beneath.
function wordmark(name: string): string {
  const m = name.match(/^(.*?)(?:,?\s+((?:attorneys?|lawyers?)\s+at\s+law|law\s+(?:firm|group|offices?)(?:,?\s*(?:p\.?a\.?|llc|pllc|llp|p\.?c\.?))?|p\.?a\.?|l\.?l\.?c\.?|p\.?l\.?l\.?c\.?|l\.?l\.?p\.?|p\.?c\.?|& associates|and associates))\.?$/i)
  const lead = m?.[1]?.trim()
  const pre = !m && name.match(/^(the law offices? of|law offices? of)\s+(.+)$/i)
  if (pre) return `<span class="wm"><small>${esc(pre[1])}</small><b>${esc(pre[2])}</b></span>`
  if (m && lead && lead.length >= 3) return `<span class="wm"><b>${esc(lead)}</b><small>${esc(m[2])}</small></span>`
  return `<span class="wm"><b>${esc(name)}</b></span>`
}

function header(f: ShowcaseFirm, current: string, over = false): string {
  const items = f.nav
    .map((n) => {
      const on = n.href === current || n.children?.some((c) => c.href === current)
      const sub = n.children?.length ? `<ul>${n.children.map((c) => `<li><a href="${attr(c.href)}"${c.href === current ? ' aria-current="page"' : ''}>${esc(c.label)}</a></li>`).join('')}</ul>` : ''
      return `<li${sub ? ' class="has"' : ''}><a href="${attr(n.href)}"${on ? ' aria-current="page"' : ''}>${esc(n.label)}</a>${sub}</li>`
    })
    .join('')
  const flat = f.nav.flatMap((n) => [n, ...(n.children ?? []).map((c) => ({ ...c, child: true }))]) as (NavLink & { child?: boolean })[]
  const call = f.phone ? `<a class="hcall" href="${tel(f.phone)}">${PHONE_ICON}<span><small>${f.freeConsult ? 'Free consultation' : 'Call us'}</small>${esc(f.phone)}</span></a>` : `<a class="hcall" href="/contact"><span>Contact us</span></a>`
  const many = f.nav.reduce((n, x) => n + x.label.length, 0) > 60
  return `<header class="hd${over ? ' over' : ''}${many ? ' many' : ''}">
<div class="util"><div class="wrap"><span>${esc(f.kind)}${place(f) ? ` · ${esc(place(f))}` : ''}</span>${f.email ? `<a href="mailto:${attr(f.email)}">${esc(f.email)}</a>` : ''}</div></div>
<div class="wrap bar"><a class="brand" href="/" aria-label="${attr(f.name)}, home">${wordmark(f.name)}</a>
<nav class="nav" aria-label="Main"><ul>${items}</ul></nav>${call}
<details class="mnav"><summary aria-label="Menu"><i></i><i></i><i></i></summary><nav aria-label="Menu"><ul>${flat.map((n) => `<li${n.child ? ' class="ch"' : ''}><a href="${attr(n.href)}">${esc(n.label)}</a></li>`).join('')}${f.phone ? `<li class="mc"><a href="${tel(f.phone)}">Call ${esc(f.phone)}</a></li>` : ''}</ul></nav></details></div>
</header>`
}

function footer(f: ShowcaseFirm): string {
  const year = new Date().getFullYear()
  return `<footer class="ft"><div class="wrap">
<div class="fcols">
<div class="fbrand">${wordmark(f.name)}${f.lede ? `<p>${esc(cut(f.lede, 180))}</p>` : ''}</div>
<div><h4>Visit</h4><p>${address(f) ? esc(address(f)) : esc(place(f) || '')}</p>${f.hours?.length ? `<p class="mut">${f.hours.map(esc).join('<br>')}</p>` : ''}</div>
<div><h4>Reach us</h4>${f.phone ? `<p><a href="${tel(f.phone)}">${esc(f.phone)}</a></p>` : ''}${f.email ? `<p><a href="mailto:${attr(f.email)}">${esc(f.email)}</a></p>` : ''}<p><a href="/contact">Send a message</a></p></div>
${f.services.length ? `<div><h4>Practice</h4><ul>${f.services.slice(0, 6).map((s) => `<li><a href="${attr(s.href)}">${esc(s.name)}</a></li>`).join('')}</ul></div>` : ''}
</div>
<div class="fine"><span>© ${year} ${esc(f.name)}</span><span>The information on this website is for general information only and is not legal advice. Contacting us does not create an attorney-client relationship.</span><a href="/privacy">Privacy</a></div>
</div></footer>`
}

function cut(s: string, n: number): string {
  if (s.length <= n) return s
  const t = s.slice(0, n)
  const stop = Math.max(t.lastIndexOf('. '), t.lastIndexOf('? '))
  return stop > n * 0.5 ? t.slice(0, stop + 1) : `${t.slice(0, t.lastIndexOf(' '))}…`
}

function form(f: ShowcaseFirm, id: string): string {
  return `<form class="form" method="post" action="${attr(f.formAction)}" id="${id}">
<input type="hidden" name="form" value="classic">
<div class="hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
<div class="row2"><label><span>Your name</span><input name="name" autocomplete="name" required></label>
<label><span>Phone</span><input name="phone" type="tel" autocomplete="tel"></label></div>
<label><span>Email</span><input name="email" type="email" autocomplete="email"></label>
<label><span>How can we help?</span><textarea name="message" rows="4"></textarea></label>
<button class="btn solid" type="submit">Send to ${esc(shortName(f.name))}${ARROW}</button>
<p class="note">We’ll get back to you${f.phone ? `, or call <a href="${tel(f.phone)}">${esc(f.phone)}</a>` : ''}. Please don’t include confidential details.</p>
</form>`
}

const shortName = (name: string) => name.replace(/,?\s+(p\.?a\.?|l\.?l\.?c\.?|p\.?l\.?l\.?c\.?|l\.?l\.?p\.?|p\.?c\.?)\.?$/i, '').replace(/^the\s+/i, '').trim()

function badges(f: ShowcaseFirm, label: string): string {
  const b = f.assets.badges.slice(0, 6)
  if (b.length < 2) return ''
  return `<section class="awards" aria-label="${attr(label)}"><div class="wrap"><p class="eyebrow">${esc(label)}</p><ul>${b
    .map((x) => `<li${/white|light|wht|rev(erse)?[-_.]/i.test(x.src) ? ' class="dk"' : ''}><img src="${attr(x.src)}" alt="${attr(x.alt)}" width="160" height="80" loading="lazy" decoding="async"></li>`)
    .join('')}</ul></div></section>`
}

const DISCLAIMER = '<p class="disc">Past results do not guarantee a similar outcome. Every case is different.</p>'

function reviewName(n: string) {
  return n && n !== 'A client' ? esc(n) : 'Client review'
}

// ---------------------------------------------------------------- home

export function showcaseHome(f: ShowcaseFirm): string {
  const body = f.look === 'noir' ? noirHome(f) : f.look === 'gazette' ? gazetteHome(f) : atelierHome(f)
  return doc(f, f.headline, body, '/', f.faq?.length ? [faqLd(f.faq)] : [])
}

function noirHome(f: ShowcaseFirm): string {
  const r = f.assets.results
  const v = f.assets.reviews
  return `${header(f, '/', true)}
<main id="main">
${fullHero(f, {
    eyebrow: `<p class="eyebrow">${esc(f.kind)}${place(f) ? ` <span>${esc(place(f))}</span>` : ''}</p>`,
    primary: `Call ${esc(f.phone ?? '')}`,
    secondary: f.freeConsult ? 'Free consultation' : 'Tell us what happened',
    bottom: r.length ? `<dl class="hero-facts">${r.slice(0, 3).map((x) => `<div><dt>${esc(x.amount)}</dt><dd>${esc(cut(x.label, 60))}</dd></div>`).join('')}</dl>${DISCLAIMER}` : '',
  })}
${badges(f, 'Recognized by')}
${ticker(f)}
${practiceList(f, 'What we handle', 'Practice areas')}
${r.length >= 2 ? `<section class="results" id="results"><div class="wrap"><div class="sec-h"><p class="eyebrow">Results</p><h2>Recovered for our clients</h2></div><ul class="rgrid">${r.slice(0, 6).map((x) => `<li><strong>${esc(x.amount)}</strong><span>${esc(cut(x.label, 110))}</span></li>`).join('')}</ul>${DISCLAIMER}</div></section>` : ''}
${firm(f)}
${team(f)}
${v.length ? `<section class="reviews" id="reviews"><div class="wrap"><div class="sec-h"><p class="eyebrow">In their words</p><h2>What clients say</h2></div><figure class="rv-lead">${QUOTE}<blockquote>${esc(cut(v[0].quote, 420))}</blockquote><figcaption>${reviewName(v[0].name)}</figcaption></figure>${v.length > 1 ? `<div class="rv-more">${v.slice(1, 4).map((x) => `<figure><blockquote>${esc(cut(x.quote, 260))}</blockquote><figcaption>${reviewName(x.name)}</figcaption></figure>`).join('')}</div>` : ''}</div></section>` : ''}
${homeFaq(f)}
${talk(f)}
</main>
${footer(f)}`
}

function gazetteHome(f: ShowcaseFirm): string {
  const r = f.assets.results
  const v = f.assets.reviews
  const lead = v[0]
  // The record strip quotes the first review when there are few results.
  const quoteHero = !!lead && r.length < 3
  const hero = `${fullHero(f, {
    eyebrow: `<p class="eyebrow">${esc(f.kind)}${place(f) ? ` — ${esc(place(f))}` : ''}</p>`,
    primary: esc(f.phone ?? ''),
    secondary: f.freeConsult ? 'Book a free consultation' : 'Send us a message',
  })}
${r.length || lead ? `<section class="record"><div class="wrap record-g">${r.slice(0, 3).map((x) => `<div><strong>${esc(x.amount)}</strong><span>${esc(cut(x.label, 70))}</span></div>`).join('')}${lead && r.length < 3 ? `<figure><blockquote>“${esc(cut(lead.quote, 170))}”</blockquote><figcaption>${reviewName(lead.name)}</figcaption></figure>` : ''}</div>${r.length ? `<div class="wrap">${DISCLAIMER}</div>` : ''}</section>` : ''}`
  const rest = r.slice(3)
  return `${header(f, '/', true)}
<main id="main">
${hero}
${badges(f, 'Recognition')}
${ticker(f)}
${practiceList(f, 'The practice', 'Index')}
${rest.length >= 2 ? `<section class="results" id="results"><div class="wrap ledger"><div class="sec-h"><p class="eyebrow">The record</p><h2>More results for our clients</h2>${DISCLAIMER}</div><ol>${rest.slice(0, 6).map((x) => `<li><strong>${esc(x.amount)}</strong><i></i><span>${esc(cut(x.label, 110))}</span></li>`).join('')}</ol></div></section>` : ''}
${firm(f)}
${v.length > (quoteHero ? 1 : 0) ? `<section class="reviews" id="reviews"><div class="wrap"><div class="sec-h"><p class="eyebrow">Letters</p><h2>From the people we’ve represented</h2></div><div class="rv-cols">${v.slice(quoteHero ? 1 : 0, (quoteHero ? 1 : 0) + 3).map((x) => `<figure><blockquote>“${esc(cut(x.quote, 300))}”</blockquote><figcaption>${reviewName(x.name)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
${team(f)}
${homeFaq(f)}
${talk(f)}
</main>
${footer(f)}`
}

function atelierHome(f: ShowcaseFirm): string {
  const r = f.assets.results
  const v = f.assets.reviews
  // The opening quotes their first review when there are no results.
  const shownRv = r.length ? 0 : 1
  const hero = fullHero(f, {
    eyebrow: `<p class="pill">${esc(f.kind)}${place(f) ? ` · ${esc(place(f))}` : ''}</p>`,
    primary: `Call ${esc(f.phone ?? '')}`,
    secondary: f.freeConsult ? 'Free consultation' : 'Get in touch',
    bottom: r.length
      ? `<div class="glass" id="results">${r.slice(0, 3).map((x) => `<div class="stat"><strong>${esc(x.amount)}</strong><span>${esc(cut(x.label, 60))}</span></div>`).join('')}</div>`
      : v[0] ? `<figure class="glass-rv"><blockquote>“${esc(cut(v[0].quote, 150))}”</blockquote><figcaption>${reviewName(v[0].name)}</figcaption></figure>` : '',
  })
  return `${header(f, '/', true)}
<main id="main">
${hero}
${r.length ? `<div class="wrap">${DISCLAIMER}</div>` : ''}
${badges(f, 'Recognized by')}
${ticker(f)}
${practiceCards(f)}
${r.slice(3).length >= 2 ? `<section class="results" id="more-results"><div class="wrap"><div class="sec-h"><p class="eyebrow">Results</p><h2>More results for our clients</h2></div><ul class="rgrid">${r.slice(3).slice(0, 4).map((x) => `<li><strong>${esc(x.amount)}</strong><span>${esc(cut(x.label, 100))}</span></li>`).join('')}</ul>${DISCLAIMER}</div></section>` : ''}
${firm(f)}
${team(f)}
${v.length > shownRv ? `<section class="reviews" id="reviews"><div class="wrap"><div class="sec-h"><p class="eyebrow">Reviews</p><h2>Clients on working with us</h2></div><div class="rv-cards">${v.slice(shownRv, shownRv + 3).map((x) => `<figure>${QUOTE}<blockquote>${esc(cut(x.quote, 280))}</blockquote><figcaption>${reviewName(x.name)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
${homeFaq(f)}
${talk(f)}
</main>
${footer(f)}`
}

// The opening words: their slogan set large with their headline (the H1,
// for search) small above it; without a slogan, the headline itself.
function titleBlock(f: ShowcaseFirm, eyebrow: string): string {
  if (f.slogan) return `<h1 class="kick">${esc(f.headline)}</h1>\n<p class="slogan${sizeClass(f.slogan)}">${esc(f.slogan)}</p>`
  return `${eyebrow}\n<h1 class="${sizeClass(f.headline)}">${esc(f.headline)}</h1>`
}

// Every home page opens on a full, dark hero: their banner edge to edge, or
// a photo of them filling the right side, or (with no photo) a glow of their
// colour behind their initial. Grain, light and a scroll cue give it depth;
// the header sits over it.
function fullHero(f: ShowcaseFirm, o: { eyebrow: string; primary: string; secondary: string; bottom?: string }): string {
  const ph = f.hero ?? (f.portrait?.people ? f.portrait : undefined)
  const mode = ph ? (isWide(ph) ? 'wide' : 'tall') : 'none'
  return `<section class="fh fh-${mode}">
${ph ? `<div class="fh-img" style="--pos:${focus(ph)}">${img(ph, 'cover', true, mode === 'tall' ? '(max-width: 900px) 100vw, 55vw' : '100vw')}</div>` : '<div class="fh-mesh" aria-hidden="true"></div>'}
<div class="fh-grain" aria-hidden="true"></div>
${mode === 'none' ? `<span class="fh-mono" aria-hidden="true">${esc(shortName(f.name).charAt(0))}</span>` : ''}
<div class="wrap fh-in hero-t">
${titleBlock(f, o.eyebrow)}
${f.lede ? `<p class="lede">${esc(cut(f.lede, 230))}</p>` : ''}
<div class="acts">${f.phone ? `<a class="btn solid" href="${tel(f.phone)}">${PHONE_ICON}${o.primary}</a>` : ''}<a class="btn line" href="#talk">${o.secondary}${ARROW}</a></div>
${o.bottom ?? ''}
</div>
<a class="fh-cue" href="#practice" aria-label="See more"><i></i></a>
</section>`
}

// A banner-shaped photo (much wider than tall) is shown full width.
export const isWide = (p: SitePhoto) => !!p.height && p.width / p.height >= 1.6
const sizeClass = (h: string) => (h.length > 60 ? ' long' : h.length > 40 ? ' mid' : '')

// Where a person's face is likely to be, so cropping keeps it.
function focus(p: SitePhoto): string {
  return p.height && p.width / p.height > 2.2 ? '72% 30%' : p.people ? '50% 25%' : '50% 50%'
}

// Their practice areas drifting past in large type: a band of movement
// between the hero and the page. Shown twice over so the loop is seamless;
// hidden from screen readers (the list itself follows).
function ticker(f: ShowcaseFirm): string {
  if (f.services.length < 3) return ''
  const row = f.services.map((s) => `<span>${esc(s.name)}</span><i>✦</i>`).join('')
  return `<div class="ticker" aria-hidden="true"><div class="tk">${row}${row}</div></div>`
}

function practiceList(f: ShowcaseFirm, title: string, eyebrow: string): string {
  if (!f.services.length) return ''
  return `<section class="practice" id="practice"><div class="wrap pr-g">
<div class="sec-h sticky"><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2>${f.phone ? `<p class="mut">Not sure where your situation fits? Call <a href="${tel(f.phone)}">${esc(f.phone)}</a> and we’ll tell you plainly.</p>` : ''}</div>
<ol class="pr-list">${f.services.map((s, i) => `<li><a href="${attr(s.href)}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t"><b>${esc(s.name)}</b>${s.summary ? `<small>${esc(cut(s.summary, 150))}</small>` : ''}</span>${ARROW}</a></li>`).join('')}</ol>
</div></section>`
}

function practiceCards(f: ShowcaseFirm): string {
  if (!f.services.length) return ''
  const photos = f.services.filter((s) => s.photo).length >= Math.max(3, f.services.length * 0.75)
  const list = photos ? [...f.services.filter((s) => s.photo), ...f.services.filter((s) => !s.photo)] : f.services
  return `<section class="practice${photos ? '' : ' plain'}" id="practice"><div class="wrap">
<div class="sec-h row"><div><p class="eyebrow">Practice areas</p><h2>How we can help</h2></div>${f.phone ? `<p class="mut">Every case starts with a conversation. <a href="${tel(f.phone)}">${esc(f.phone)}</a></p>` : ''}</div>
<ul class="cards${list.length % 3 === 1 && list.length > 3 ? ' four' : ''}">${list.map((s, i) => `<li><a href="${attr(s.href)}">${photos ? (s.photo ? `<span class="ph">${img(s.photo, 'cover', false, '(max-width: 700px) 100vw, 33vw')}</span>` : `<span class="ph none"><em>${esc(s.name.charAt(0))}</em></span>`) : `<span class="num">${String(i + 1).padStart(2, '0')}</span>`}<b>${esc(s.name)}</b>${s.summary ? `<small>${esc(cut(s.summary, 120))}</small>` : ''}<span class="more">Learn more${ARROW}</span></a></li>`).join('')}</ul>
</div></section>`
}

function firm(f: ShowcaseFirm): string {
  if (!f.about?.paragraphs.length) return ''
  const pic = f.portrait && f.portrait.src !== f.hero?.src ? f.portrait : undefined
  if (!pic)
    return `<section class="firm"><div class="wrap firm-g split"><div class="sec-h sticky"><p class="eyebrow">The firm</p><h2>${esc(f.about.heading)}</h2></div>
<div class="firm-t">${f.about.paragraphs.slice(0, 2).map((p, i) => `<p${i === 0 ? ' class="first"' : ''}>${esc(cut(p, 560))}</p>`).join('')}${f.about.href ? `<a class="btn text" href="${attr(f.about.href)}">More about the firm${ARROW}</a>` : ''}</div>
</div></section>`
  return `<section class="firm"><div class="wrap firm-g">
<figure class="firm-p" style="--pos:${focus(pic)}">${img(pic, 'cover', false, '(max-width: 900px) 100vw, 40vw')}</figure>
<div class="firm-t"><p class="eyebrow">The firm</p><h2>${esc(f.about.heading)}</h2>${f.about.paragraphs.slice(0, 2).map((p, i) => `<p${i === 0 ? ' class="first"' : ''}>${esc(cut(p, 560))}</p>`).join('')}${f.about.href ? `<a class="btn text" href="${attr(f.about.href)}">More about the firm${ARROW}</a>` : ''}</div>
</div></section>`
}

function team(f: ShowcaseFirm, all = false): string {
  const people = f.team.filter((t) => t.photo)
  if (!people.length || (!all && people.length < 2 && !f.team.length)) return ''
  return `<section class="team"><div class="wrap"><div class="sec-h"><p class="eyebrow">Attorneys</p><h2>The people on your case</h2></div>
<ul class="people">${people.slice(0, all ? 24 : 8).map((t) => `<li>${t.href ? `<a href="${attr(t.href)}">` : '<div>'}<span class="ph"><img src="${attr(t.photo!)}" alt="${attr(t.name)}" width="400" height="500" loading="lazy" decoding="async"></span><b>${esc(t.name)}</b><small>${esc(t.role)}</small>${t.href ? '</a>' : '</div>'}</li>`).join('')}</ul>
</div></section>`
}

// Their own questions and answers, gathered from their pages: content that
// answers what people search for, marked up so Google can show it.
function homeFaq(f: ShowcaseFirm): string {
  if (!f.faq?.length) return ''
  return `<section class="hfaq" id="questions"><div class="wrap hfaq-g"><div class="sec-h"><p class="eyebrow">Questions</p><h2>What people ask us</h2>${f.phone ? `<p class="mut">Don’t see yours? Call <a href="${tel(f.phone)}">${esc(f.phone)}</a>.</p>` : ''}</div>
<div class="faq">${f.faq.map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(cut(q.a, 700))}</p></details>`).join('')}</div></div></section>`
}

const faqLd = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
})

function talk(f: ShowcaseFirm): string {
  return `<section class="talk" id="talk"><div class="wrap talk-g">
<div class="talk-t"><p class="eyebrow">${f.freeConsult ? 'Free consultation' : 'Contact'}</p><h2>${f.freeConsult ? 'Talk to a lawyer about your case, at no cost.' : 'Tell us what’s going on.'}</h2>
<p>${f.phone ? `Call <a href="${tel(f.phone)}">${esc(f.phone)}</a> or send` : 'Send'} a short note and we’ll get back to you.</p>
<dl>${address(f) ? `<div><dt>Office</dt><dd>${esc(address(f))}</dd></div>` : ''}${f.phone ? `<div><dt>Phone</dt><dd><a href="${tel(f.phone)}">${esc(f.phone)}</a></dd></div>` : ''}${f.email ? `<div><dt>Email</dt><dd><a href="mailto:${attr(f.email)}">${esc(f.email)}</a></dd></div>` : ''}${f.hours?.length ? `<div><dt>Hours</dt><dd>${f.hours.map(esc).join('<br>')}</dd></div>` : ''}</dl></div>
${form(f, 'talk-form')}
</div></section>`
}

// ---------------------------------------------------------------- inner pages

export function showcasePage(f: ShowcaseFirm, p: ShowcasePage): string {
  const blocks: string[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) blocks.push(`<ul>${list.join('')}</ul>`)
    list = []
  }
  for (const b of p.blocks) {
    // Their lists come through as "• item" paragraphs from their pages.
    if (b.kind === 'li' || /^•\s/.test(b.text)) {
      list.push(`<li>${esc(b.text.replace(/^•\s*/, ''))}</li>`)
      continue
    }
    flush()
    blocks.push(b.kind === 'p' ? `<p>${esc(b.text)}</p>` : `<${b.kind}>${esc(b.text)}</${b.kind}>`)
  }
  flush()
  const others = f.services.filter((s) => s.href !== p.path).slice(0, 8)
  const aside = `<aside class="side"><div class="card"><p class="eyebrow">${f.freeConsult ? 'Free consultation' : 'Talk to us'}</p>${f.phone ? `<a class="big" href="${tel(f.phone)}">${esc(f.phone)}</a>` : ''}<p>Tell us what happened and we’ll explain your options.</p><a class="btn solid" href="#talk">Send a message${ARROW}</a></div>${others.length ? `<nav class="card links" aria-label="Practice areas"><p class="eyebrow">Practice areas</p><ul>${others.map((s) => `<li><a href="${attr(s.href)}">${esc(s.name)}${ARROW}</a></li>`).join('')}</ul></nav>` : ''}</aside>`
  const faq = p.faq?.length ? `<section class="faq"><h2>Questions we hear often</h2>${p.faq.map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('')}</section>` : ''
  const people = p.people?.length
    ? `<ul class="people wide">${p.people.map((t) => `<li>${t.href ? `<a href="${attr(t.href)}">` : '<div>'}${t.photo ? `<span class="ph"><img src="${attr(t.photo)}" alt="${attr(t.name)}" width="400" height="500" loading="lazy" decoding="async"></span>` : ''}<b>${esc(t.name)}</b><small>${esc(t.role)}</small>${t.href ? '</a>' : '</div>'}</li>`).join('')}</ul>`
    : ''
  const reviews = f.assets.reviews.length && !p.contact ? `<figure class="pull">${QUOTE}<blockquote>${esc(cut(f.assets.reviews[(p.path.length + 1) % f.assets.reviews.length].quote, 300))}</blockquote><figcaption>${reviewName(f.assets.reviews[(p.path.length + 1) % f.assets.reviews.length].name)}</figcaption></figure>` : ''
  // Inner pages open dark too: their photo for the page, else their colour.
  const body = `${header(f, p.path, true)}
<main id="main">
<section class="fh fh-page ${p.photo ? 'fh-wide' : 'fh-none'}">${p.photo ? `<div class="fh-img" style="--pos:${focus(p.photo)}">${img(p.photo, 'cover', true)}</div>` : '<div class="fh-mesh" aria-hidden="true"></div>'}<div class="fh-grain" aria-hidden="true"></div>
<div class="wrap fh-in"><p class="crumbs"><a href="/">Home</a> <span>/</span> ${esc(p.kicker)}</p><h1 class="${sizeClass(p.title)}">${esc(p.title)}</h1>${p.intro ? `<p class="lede">${esc(cut(p.intro, 320))}</p>` : ''}</div></section>
${p.contact ? '' : `<div class="wrap art-g"><article class="prose">${blocks.join('\n')}${people}${faq}${reviews}</article>${aside}</div>`}
${p.contact && people ? `<div class="wrap">${people}</div>` : ''}
${talk(f)}
</main>
${footer(f)}`
  const service = f.services.find((x) => x.href === p.path)
  const lds: object[] = [
    ...(service ? [{ '@context': 'https://schema.org', '@type': 'Service', name: service.name, serviceType: service.name, ...(p.intro ? { description: cut(p.intro, 300) } : {}), provider: { '@type': f.schemaType, name: f.name, ...(f.phone ? { telephone: f.phone } : {}) }, ...(f.city ? { areaServed: [f.city, f.region].filter(Boolean).join(', ') } : {}) }] : []),
    ...(p.faq?.length ? [faqLd(p.faq)] : []),
  ]
  return doc(f, p.title, body, p.path, lds, p.photo?.src)
}

// ---------------------------------------------------------------- document

function doc(f: ShowcaseFirm, title: string, body: string, path: string, extra: object[] = [], image?: string): string {
  const [display, text, q] = FONTS[f.look][f.pairing % 2]
  const c = accentFor(f.look, f.brand)
  const ld = {
    '@context': 'https://schema.org',
    '@type': f.schemaType,
    name: f.name,
    ...(f.phone ? { telephone: f.phone } : {}),
    ...(f.email ? { email: f.email } : {}),
    ...(f.city ? { address: { '@type': 'PostalAddress', ...(f.street ? { streetAddress: f.street } : {}), addressLocality: f.city, ...(f.region ? { addressRegion: f.region } : {}), ...(f.postalCode ? { postalCode: f.postalCode } : {}) } } : {}),
    ...(f.services.length ? { knowsAbout: f.services.map((s) => s.name) } : {}),
    ...(f.city ? { areaServed: [f.city, f.region].filter(Boolean).join(', ') } : {}),
    ...(f.hero ? { image: f.hero.src } : {}),
    ...(f.sameAs?.length ? { sameAs: f.sameAs } : {}),
    ...(f.hours?.length ? { openingHours: f.hours } : {}),
  }
  const lds = [...(path === '/' ? [ld] : []), ...extra]
  const og = image ?? f.hero?.src ?? f.portrait?.src
  return `<!doctype html>
<html lang="en" class="${f.look}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?${q}&display=swap">
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(title)}">
<meta property="og:site_name" content="${attr(f.name)}">
${og ? `<meta property="og:image" content="${attr(og)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
${lds.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
<style>:root{--display:${display};--text:${text};--accent:${c.accent};--accent-soft:${c.soft};--accent-deep:${c.deep};--glow:${c.glow}}${CSS.base}${CSS[f.look]}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${body}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">
</body>
</html>`
}

// ---------------------------------------------------------------- styles

const CSS: Record<'base' | Look, string> = {
  base: `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/1.65 var(--text);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;display:block}
a{color:inherit}
h1,h2,h3,h4{font-family:var(--display);font-weight:var(--dw,500);margin:0;text-wrap:balance;letter-spacing:var(--dls,-.01em)}
p{margin:0}
.wrap{width:100%;max-width:1240px;margin:0 auto;padding-inline:clamp(18px,4vw,40px)}
.skip{position:absolute;left:-999px;top:8px;background:var(--ink);color:var(--bg);padding:8px 14px;z-index:99}
.skip:focus{left:8px}
.eyebrow{font:600 12.5px/1.2 var(--text);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.mut{color:var(--muted)}
.ar{width:18px;height:18px;flex:none;transition:transform .25s}
a:hover>.ar,button:hover>.ar,a:hover .ar{transform:translateX(4px)}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 24px;font:600 15.5px/1 var(--text);text-decoration:none;border-radius:var(--r-btn,2px);border:1px solid transparent;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.btn svg:not(.ar){width:18px;height:18px}
.btn.solid{background:var(--btn,var(--accent));color:var(--btn-ink,#fff)}
.btn.solid:hover{background:var(--btn-hover,var(--accent-deep))}
.btn.line{border-color:var(--line-strong);color:inherit}
.btn.line:hover{border-color:currentColor}
.btn.text{padding:0;min-height:0;color:var(--accent);border-bottom:1px solid currentColor;border-radius:0;padding-bottom:4px}
.acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
/* header */
.hd{position:relative;z-index:20;background:var(--hd-bg,var(--bg))}
.util{font-size:13px;color:var(--muted);border-bottom:1px solid var(--line)}
.util .wrap{display:flex;justify-content:space-between;gap:16px;padding-block:9px}
.util a{text-decoration:none}
.bar{display:flex;align-items:center;gap:28px;min-height:84px}
.brand{text-decoration:none;margin-right:auto;min-width:0}
.wm{display:flex;flex-direction:column;line-height:1.05}
.wm b{font:var(--dw,500) clamp(21px,2.2vw,27px)/1.05 var(--display);letter-spacing:var(--dls,-.01em);white-space:nowrap}
.wm small{font:600 10.5px/1.4 var(--text);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.nav ul{list-style:none;margin:0;padding:0;display:flex;gap:4px}
.nav li{position:relative}
.nav>ul>li>a{display:block;padding:10px 11px;font-size:15px;font-weight:500;text-decoration:none;border-radius:4px;white-space:nowrap}
.nav a[aria-current]{color:var(--accent)}
.nav li ul{position:absolute;top:100%;left:0;min-width:260px;display:block;background:var(--menu-bg,var(--bg));border:1px solid var(--line);box-shadow:0 18px 40px -18px rgba(0,0,0,.35);padding:8px;opacity:0;visibility:hidden;transform:translateY(6px);transition:.18s;border-radius:var(--r-card,4px)}
.nav li:hover>ul,.nav li:focus-within>ul{opacity:1;visibility:visible;transform:none}
.nav li ul a{display:block;padding:9px 12px;font-size:14.5px;text-decoration:none;border-radius:3px}
.nav li ul a:hover{background:var(--hover)}
.nav .has>a::after{content:"";display:inline-block;width:6px;height:6px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(45deg) translateY(-3px);margin-left:8px;opacity:.6}
.hcall{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:600;font-size:17px;white-space:nowrap}
.hcall svg{width:20px;height:20px;color:var(--accent)}
.hcall span{display:flex;flex-direction:column;line-height:1.15}
.hcall small{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
.mnav{display:none}
.mnav summary{list-style:none;cursor:pointer;width:44px;height:44px;display:grid;place-content:center;gap:5px}
.mnav summary::-webkit-details-marker{display:none}
.mnav summary i{display:block;width:22px;height:1.5px;background:currentColor}
.mnav nav{position:absolute;left:0;right:0;top:100%;background:var(--menu-bg,var(--bg));border-top:1px solid var(--line);box-shadow:0 30px 40px -20px rgba(0,0,0,.3);max-height:80vh;overflow:auto}
.mnav ul{list-style:none;margin:0;padding:8px clamp(18px,4vw,40px) 20px}
.mnav li a{display:block;padding:13px 0;border-bottom:1px solid var(--line);text-decoration:none;font-size:17px}
.mnav li.ch a{padding-left:16px;font-size:15.5px;color:var(--muted)}
.mnav li.mc a{color:var(--accent);font-weight:600;border:0}
@media (max-width:1180px){.nav{display:none}.mnav{display:block}.hcall small{display:none}}
@media (max-width:1360px){.hd.many .nav{display:none}.hd.many .mnav{display:block}}
.brand{flex:none}
@media (max-width:560px){.hcall span{display:none}.hcall{width:44px;height:44px;justify-content:center;border:1px solid var(--line-strong);border-radius:50%}.util span{display:none}.bar{gap:10px;min-height:70px}}

/* the full hero */
.fh{position:relative;isolation:isolate;min-height:clamp(640px,94vh,940px);display:flex;align-items:flex-end;color:#fff;background:#0b0e13;overflow:hidden}
.fh-img{position:absolute;inset:0;z-index:-3}
.fh-img img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.fh-wide .fh-img::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,11,15,.9) 0%,rgba(9,11,15,.66) 34%,rgba(9,11,15,.12) 64%,rgba(9,11,15,0) 80%),linear-gradient(0deg,rgba(9,11,15,.92) 0%,rgba(9,11,15,0) 46%),linear-gradient(180deg,rgba(9,11,15,.55) 0%,rgba(9,11,15,0) 24%)}
.fh-tall{background:radial-gradient(70% 90% at 78% 30%,color-mix(in srgb,var(--glow) 26%,transparent),transparent 70%),radial-gradient(60% 70% at 0% 100%,color-mix(in srgb,var(--accent-deep) 45%,transparent),transparent 70%),#0b0e13}
.fh-tall .fh-img{left:auto;width:min(54%,820px);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 32%);mask-image:linear-gradient(90deg,transparent 0%,#000 32%)}
.fh-tall .fh-img img{object-position:50% 18%}
.fh-tall .fh-img::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#0b0e13 0%,rgba(11,14,19,0) 40%),linear-gradient(180deg,rgba(11,14,19,.6) 0%,rgba(11,14,19,0) 25%)}
.fh-tall .fh-in{padding-right:min(46%,620px)}
.fh-mesh{position:absolute;inset:0;z-index:-3;background:radial-gradient(55% 70% at 82% 18%,color-mix(in srgb,var(--glow) 42%,transparent),transparent 70%),radial-gradient(50% 60% at 8% 96%,color-mix(in srgb,var(--accent-deep) 70%,transparent),transparent 72%),linear-gradient(160deg,#10141b,#07090c)}
.fh-mesh::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 120px);-webkit-mask-image:linear-gradient(180deg,#000,transparent 85%);mask-image:linear-gradient(180deg,#000,transparent 85%)}
.fh-grain{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.14;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")}
.fh-mono{position:absolute;z-index:-2;right:-2vw;bottom:-.18em;font:400 clamp(320px,46vw,720px)/.8 var(--display);color:transparent;-webkit-text-stroke:1.5px color-mix(in srgb,var(--glow) 40%,transparent);opacity:.7;pointer-events:none;user-select:none}
.fh-in{position:relative;display:grid;gap:24px;justify-items:start;padding-block:clamp(170px,22vh,230px) clamp(56px,8vh,96px)}
.fh h1:not(.kick){font-size:clamp(46px,6.6vw,100px);line-height:.96;max-width:13ch;color:#fff}
.fh h1.mid{font-size:clamp(42px,5.6vw,82px);max-width:15ch}
.fh h1.long{font-size:clamp(36px,4.6vw,66px);max-width:18ch}
.fh .slogan{color:#fff}
.fh .eyebrow,html .fh h1.kick{color:var(--glow);display:flex;align-items:center;gap:14px}
.fh .eyebrow::before,html .fh h1.kick::before{content:"";width:42px;height:1px;background:currentColor;opacity:.8}
.fh .eyebrow span{color:rgba(255,255,255,.7)}
.fh .lede{font-size:clamp(18px,1.6vw,21px);line-height:1.6;color:rgba(255,255,255,.84);max-width:580px;text-shadow:0 1px 24px rgba(0,0,0,.45)}
.fh .btn.solid{background:#fff;color:#0b0e13}
.fh .btn.solid:hover{background:var(--glow);color:#0b0e13}
html .fh .btn.line{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.4);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
html .fh .btn.line:hover{border-color:#fff}
html .fh .btn.solid{background:#fff;color:#0b0e13}
html .fh .btn.solid:hover{background:var(--glow)}
.fh .disc{color:rgba(255,255,255,.6);margin-top:0}
.fh .hero-facts{display:grid;grid-template-columns:repeat(3,minmax(0,230px));margin:16px 0 0;border-top:1px solid rgba(255,255,255,.18)}
.fh .hero-facts div{padding:20px 22px 0 0}
.fh .hero-facts div+div{padding-left:22px;border-left:1px solid rgba(255,255,255,.18)}
.fh .hero-facts dt{font:400 clamp(30px,3.2vw,44px)/1 var(--display);color:var(--glow)}
.fh .hero-facts dd{margin:8px 0 0;font-size:13.5px;color:rgba(255,255,255,.7);line-height:1.45}
.fh .glass{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:min(100%,860px);margin-top:18px}
html .fh .stat,html .fh .glass-rv{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);border-radius:18px;padding:20px 22px;display:grid;gap:6px}
html .fh .stat strong{font:800 clamp(28px,2.8vw,38px)/1 var(--display);letter-spacing:-.03em;color:#fff}
html .fh .stat span{font-size:13.5px;color:rgba(255,255,255,.75);line-height:1.4}
.fh .glass-rv{max-width:560px;margin-top:10px}
.fh .glass-rv blockquote{font:italic 400 19px/1.5 var(--quote,var(--display))}
.fh .glass-rv figcaption{color:rgba(255,255,255,.6)}
.fh-page{min-height:clamp(420px,56vh,560px)}
.fh-page .fh-in{padding-bottom:clamp(44px,6vh,72px)}
.fh-page h1:not(.kick){font-size:clamp(40px,5.2vw,76px);max-width:18ch}
.fh .crumbs{color:rgba(255,255,255,.65)}
.fh-cue{position:absolute;right:clamp(18px,4vw,40px);bottom:clamp(28px,5vh,52px);width:28px;height:46px;border:1px solid rgba(255,255,255,.4);border-radius:14px}
.fh-cue i{position:absolute;left:50%;top:9px;width:3px;height:8px;margin-left:-1.5px;border-radius:2px;background:#fff}
/* the header over a hero */
.hd.over{position:absolute;left:0;right:0;top:0;background:linear-gradient(180deg,rgba(9,11,15,.7),rgba(9,11,15,0));color:#fff;border:0;-webkit-backdrop-filter:none;backdrop-filter:none}
.hd.over .util{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.12)}
.hd.over .wm small,.hd.over .hcall small{color:rgba(255,255,255,.65)}
.hd.over .hcall svg{color:var(--glow)}
.hd.over .nav>ul>li>a[aria-current]{color:var(--glow)}
.hd.over .nav li ul,.hd.over .mnav nav{color:var(--ink)}
@media (max-width:900px){
.fh{min-height:0}
.fh-tall .fh-img{position:relative;inset:auto;width:100%;height:auto;aspect-ratio:4/5;max-height:62vh;-webkit-mask-image:linear-gradient(180deg,#000 60%,transparent);mask-image:linear-gradient(180deg,#000 60%,transparent)}
.fh-tall{flex-direction:column;align-items:stretch}
.fh-tall .fh-in{padding-right:clamp(18px,4vw,40px);padding-top:0;margin-top:-80px}
.fh-wide{padding-top:0}
.fh-wide .fh-img::after{background:linear-gradient(0deg,rgba(9,11,15,.95) 0%,rgba(9,11,15,.7) 45%,rgba(9,11,15,.25) 100%)}
.fh .glass{grid-template-columns:1fr}
.fh .hero-facts{grid-template-columns:1fr}
.fh .hero-facts div+div{padding-left:0;border-left:0}
.fh-cue{display:none}
}
@media (prefers-reduced-motion:no-preference){
.fh-in{animation:rise .9s cubic-bezier(.2,.7,.2,1) both}
.fh-img img{animation:settle 1.8s cubic-bezier(.2,.7,.2,1) both}
.fh-cue i{animation:cue 1.8s ease-in-out infinite}
@keyframes cue{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(16px)}}
}

/* the band of practice areas */
.ticker{overflow:hidden;padding-block:clamp(22px,3vw,34px);border-bottom:1px solid var(--line);background:var(--bg)}
.tk{display:flex;width:max-content;align-items:center;gap:clamp(22px,3vw,40px);white-space:nowrap}
.tk span{font:var(--dw,500) clamp(30px,4.4vw,62px)/1 var(--display);letter-spacing:var(--dls,-.01em);color:var(--ink)}
.tk span:nth-child(4n+3){color:transparent;-webkit-text-stroke:1px var(--ink)}
.tk i{font-style:normal;font-size:clamp(16px,1.6vw,22px);color:var(--accent)}
@media (prefers-reduced-motion:no-preference){.tk{animation:drift 60s linear infinite}@keyframes drift{to{transform:translateX(-50%)}}}
.firm-g.split{grid-template-columns:minmax(0,4fr) minmax(0,7fr);align-items:start}
.firm-g.split .sec-h h2{font-size:clamp(32px,4.2vw,54px)}
@media (max-width:900px){.firm-g.split{grid-template-columns:1fr}}
/* sections */
section{position:relative}
.sec-h{display:grid;gap:12px;margin-bottom:clamp(28px,4vw,52px);max-width:720px}
.sec-h h2{font-size:clamp(32px,4.2vw,54px);line-height:1.05}
.sec-h.row{display:flex;justify-content:space-between;align-items:end;gap:24px;max-width:none;flex-wrap:wrap}
.sec-h.row>div{display:grid;gap:12px}
.sec-h.row p.mut{max-width:340px}
.practice,.results,.firm,.team,.reviews,.talk{padding-block:clamp(64px,9vw,128px)}
.awards{padding-block:34px;border-block:1px solid var(--line)}
.awards .wrap{display:flex;align-items:center;gap:28px;flex-wrap:wrap}
.awards .eyebrow{color:var(--muted);flex:none}
.awards ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;flex:1}
.awards li{background:#fff;border-radius:6px;padding:10px 16px;height:78px;display:grid;place-items:center;box-shadow:0 1px 0 rgba(0,0,0,.04)}
.awards li.dk{background:#1b1f26}
.awards img{max-height:56px;max-width:130px;width:auto;height:auto;object-fit:contain}
.disc{font-size:13px;color:var(--muted);margin-top:22px}
html .fh h1.kick,html .hero h1.kick{font:600 13px/1.3 var(--text);letter-spacing:.16em;text-transform:uppercase;color:var(--accent);max-width:none}
.slogan{font:var(--dw,500) clamp(54px,8.4vw,132px)/.92 var(--display);letter-spacing:-.03em;text-wrap:balance;max-width:12ch}
.slogan.mid{font-size:clamp(48px,7vw,108px)}
.slogan.long{font-size:clamp(42px,5.6vw,86px);max-width:15ch}
/* practice list */
.pr-g{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:clamp(32px,6vw,96px);align-items:start}
.sticky{position:sticky;top:32px}
.pr-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.pr-list a{display:grid;grid-template-columns:56px 1fr auto;gap:18px;align-items:center;padding:26px 6px;border-bottom:1px solid var(--line);text-decoration:none;transition:background .2s,padding .25s}
.pr-list a:hover{background:var(--hover);padding-inline:16px}
.pr-list .n{font:500 14px/1 var(--text);color:var(--accent);letter-spacing:.08em}
.pr-list .t{display:grid;gap:6px}
.pr-list b{font:var(--dw,500) clamp(22px,2.4vw,30px)/1.15 var(--display);letter-spacing:var(--dls,-.01em)}
.pr-list small{font-size:15.5px;color:var(--muted);line-height:1.55}
/* firm */
.firm-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(32px,6vw,96px);align-items:center}
.firm-g.solo{grid-template-columns:minmax(0,1fr);max-width:860px}
.firm-p{margin:0;position:relative;aspect-ratio:4/5;max-width:100%}
.firm-p img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.firm-t{display:grid;gap:20px}
.firm-t h2{font-size:clamp(30px,3.8vw,48px);line-height:1.08}
.firm-t p{color:var(--muted)}
.firm-t p.first{font-size:clamp(18px,1.6vw,21px);color:var(--ink);line-height:1.6}
.firm-t .btn{justify-self:start}
/* people */
.people{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:clamp(18px,2.4vw,32px)}
.people a,.people div{text-decoration:none;display:grid;gap:4px}
.people .ph{display:block;aspect-ratio:4/5;overflow:hidden;background:var(--hover);margin-bottom:12px;border-radius:var(--r-img,0)}
.people img{width:100%;height:100%;object-fit:cover;object-position:50% 20%;transition:transform .6s,filter .4s;filter:var(--people-filter,none)}
.people a:hover img{transform:scale(1.04);filter:none}
.people b{font:var(--dw,500) 21px/1.2 var(--display)}
.people small{color:var(--muted);font-size:14.5px}
.people.wide{margin-top:12px}
/* reviews */
.qm{width:44px;height:33px;color:var(--accent)}
blockquote{margin:0}
figure{margin:0}
figcaption{font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
/* talk */
.talk-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(32px,6vw,96px);align-items:start}
.talk-t{display:grid;gap:20px}
.talk-t h2{font-size:clamp(32px,4vw,52px);line-height:1.06}
.talk-t dl{margin:12px 0 0;display:grid;gap:16px}
.talk-t dt{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600}
.talk-t dd{margin:2px 0 0}
.talk-t a{text-decoration:none;border-bottom:1px solid var(--line-strong)}
.form{display:grid;gap:16px;background:var(--form-bg);padding:clamp(22px,3.4vw,40px);border-radius:var(--r-card,4px);border:1px solid var(--line)}
.form label{display:grid;gap:7px}
.form label span{font-size:13.5px;font-weight:600;color:var(--muted)}
.form input,.form textarea{font:inherit;font-size:16px;color:var(--ink);background:var(--field);border:1px solid var(--line-strong);border-radius:var(--r-field,2px);padding:13px 14px;width:100%}
.form input:focus,.form textarea:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}
.form .row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.form .btn{justify-content:center;width:100%;border:0}
.form .note{font-size:13px;color:var(--muted)}
.hp{position:absolute;left:-9999px}
/* footer */
.ft{padding-block:clamp(56px,7vw,88px) 28px;background:var(--ft-bg);color:var(--ft-ink);font-size:15px}
.ft a{text-decoration:none}
.ft a:hover{text-decoration:underline}
.fcols{display:grid;grid-template-columns:2fr 1.2fr 1.2fr 1.4fr;gap:36px}
.fbrand{display:grid;gap:18px;align-content:start}
.fbrand p{opacity:.72;max-width:380px}
.ft h4{font:600 12px/1 var(--text);letter-spacing:.16em;text-transform:uppercase;opacity:.6;margin-bottom:16px}
.ft p{margin-bottom:8px}
.ft ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ft .wm small{color:inherit;opacity:.6}
.fine{display:flex;flex-wrap:wrap;gap:12px 28px;margin-top:56px;padding-top:24px;border-top:1px solid rgba(127,127,127,.25);font-size:12.5px;opacity:.7}
.fine span:nth-child(2){flex:1;min-width:260px}
/* inner pages */
.phero{padding-block:clamp(48px,7vw,96px) clamp(40px,5vw,72px);border-bottom:1px solid var(--line)}
.phero-g{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:center}
.phero.has-p .phero-g{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}
.phero h1{font-size:clamp(38px,5.4vw,72px);line-height:1.03;margin:14px 0 18px;max-width:16ch}
.phero .lede{font-size:clamp(18px,1.7vw,21px);color:var(--muted);max-width:640px}
.phero-p{margin:0;aspect-ratio:5/4;overflow:hidden;border-radius:var(--r-img,0)}
.phero-p img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.crumbs{font-size:13.5px;color:var(--muted)}
.crumbs a{text-decoration:none}
.crumbs span{margin:0 6px;opacity:.5}
.art-g{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:clamp(32px,6vw,88px);padding-block:clamp(48px,6vw,88px);align-items:start}
.prose{max-width:720px;font-size:18px;line-height:1.75}
.prose>*+*{margin-top:1.1em}
.prose h2{font-size:clamp(27px,2.8vw,36px);line-height:1.15;margin-top:1.8em}
.prose h3{font-size:clamp(21px,2vw,25px);line-height:1.25;margin-top:1.5em}
.prose ul{padding-left:1.2em}
.prose li{margin:.35em 0}
.prose li::marker{color:var(--accent)}
.faq{margin-top:3em;border-top:1px solid var(--line)}
.hfaq{padding-block:clamp(64px,9vw,128px)}
.hfaq-g{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:clamp(32px,6vw,96px);align-items:start}
.hfaq .faq{margin-top:0}
@media (max-width:900px){.hfaq-g{grid-template-columns:1fr}}
.faq h2{margin:1.4em 0 .6em}
.faq details{border-bottom:1px solid var(--line);padding:18px 0}
.faq summary{cursor:pointer;font-weight:600;font-size:18px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.faq summary::after{content:"+";font-weight:400;font-size:24px;line-height:1;color:var(--accent)}
.faq details[open] summary::after{content:"–"}
.faq details p{margin-top:12px;color:var(--muted)}
.pull{margin-top:3em;padding:32px;border-left:2px solid var(--accent);background:var(--hover);display:grid;gap:14px}
.pull blockquote{font:italic 400 21px/1.5 var(--quote,var(--display))}
.side{display:grid;gap:20px;position:sticky;top:28px}
.side .card{border:1px solid var(--line);padding:26px;border-radius:var(--r-card,4px);display:grid;gap:14px;background:var(--form-bg)}
.side .big{font:var(--dw,500) 30px/1.1 var(--display);text-decoration:none;color:var(--ink)}
.side .card p:not(.eyebrow){color:var(--muted);font-size:15.5px}
.side .btn{justify-content:center}
.side ul{list-style:none;margin:0;padding:0}
.side li a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);text-decoration:none;font-size:15.5px}
.side li:last-child a{border:0}
@media (max-width:900px){
.pr-g,.firm-g,.talk-g,.art-g,.phero.has-p .phero-g{grid-template-columns:minmax(0,1fr)}
.sticky,.side{position:static}
.fcols{grid-template-columns:1fr 1fr}
.firm-p{aspect-ratio:4/3}
}
@media (max-width:560px){
body{font-size:16.5px}
.fcols{grid-template-columns:1fr}
.form .row2{grid-template-columns:1fr}
.pr-list a{grid-template-columns:36px 1fr auto;gap:12px;padding:20px 2px}
.awards .wrap{flex-direction:column;align-items:flex-start;gap:16px}.awards ul{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:10px}.awards li{height:64px;padding:8px 10px}.awards img{max-height:44px;max-width:100%}
.btn{width:100%;justify-content:center}
.btn.text{width:auto}
.prose{font-size:17px}
}
@media (prefers-reduced-motion:no-preference){
.hero-in,.hero-t{animation:rise .9s cubic-bezier(.2,.7,.2,1) both}
.hero-img img,.hero-p img{animation:settle 1.6s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:.001;transform:translateY(18px)}}
@keyframes settle{from{transform:scale(1.06)}}
}
`,
  noir: `
.noir{--bg:#0d1014;--ink:#ece9e3;--muted:#a19d96;--line:rgba(236,233,227,.12);--line-strong:rgba(236,233,227,.32);--hover:rgba(236,233,227,.05);--menu-bg:#141920;--form-bg:#141920;--field:#0d1014;--ft-bg:#080a0d;--ft-ink:#cfcac2;--btn-ink:#0d1014;--btn-hover:#ece9e3;--dls:-.005em;--people-filter:grayscale(1) contrast(1.05)}
.noir .util{border-color:rgba(255,255,255,.1)}
.noir .hd.over{position:absolute;left:0;right:0;top:0;background:linear-gradient(#0d1014e6,#0d101400)}
.noir .hd.over .util{border-color:rgba(255,255,255,.08)}
.noir .hero{min-height:clamp(620px,88vh,900px);display:flex;align-items:flex-end;padding:180px 0 clamp(48px,6vw,80px);overflow:hidden}
.noir .hero.plain{background:radial-gradient(120% 90% at 85% 10%,var(--accent-soft),transparent 60%),#0d1014}
.noir .hero-img{position:absolute;inset:0}
.noir .hero-img img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.noir .hero-img::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0d1014 0%,#0d1014d9 30%,#0d101440 62%,#0d101400 80%),linear-gradient(0deg,#0d1014 0%,#0d101400 40%)}
.noir .hero.side{background:radial-gradient(90% 80% at 80% 20%,var(--accent-soft),transparent 70%),#0d1014}
.noir .hero.side .hero-img{left:auto;right:clamp(18px,4vw,40px);top:130px;bottom:clamp(48px,6vw,80px);width:min(38%,520px)}
.noir .hero.side .hero-img img{filter:grayscale(.2) contrast(1.04)}
.noir .hero.side .hero-img::after{background:linear-gradient(0deg,#0d1014 0%,#0d101400 35%)}
.noir .hero.side .hero-img::before{content:"";position:absolute;inset:-14px 14px 14px -14px;border:1px solid var(--accent);opacity:.55;z-index:-1}
.noir .hero.side .hero-in{padding-right:min(42%,560px)}
.noir .hero-in{position:relative;display:grid;gap:26px}
.noir .hero .eyebrow{display:flex;gap:14px;align-items:center}
.noir .hero .eyebrow::before{content:"";width:44px;height:1px;background:var(--accent)}
.noir .hero .eyebrow span{color:var(--muted)}
.noir .hero h1{font-size:clamp(44px,6.4vw,94px);line-height:.98;max-width:13ch;font-weight:400}
.noir .hero h1.mid{font-size:clamp(40px,5.4vw,78px);max-width:15ch}
.noir .hero h1.long{font-size:clamp(36px,4.4vw,64px);max-width:18ch}
.noir .hero .lede{font-size:clamp(18px,1.6vw,21px);color:#cbc6be;max-width:560px}
.noir .hero-facts{display:grid;grid-template-columns:repeat(3,minmax(0,220px));gap:0;margin:18px 0 0;border-top:1px solid var(--line)}
.noir .hero-facts div{padding:20px 22px 0 0}
.noir .hero-facts div+div{padding-left:22px;border-left:1px solid var(--line)}
.noir .hero-facts dt{font:400 clamp(28px,3vw,40px)/1 var(--display);color:var(--accent)}
.noir .hero-facts dd{margin:8px 0 0;font-size:13.5px;color:var(--muted);line-height:1.45}
.noir .awards{background:#11151b;border-color:var(--line)}
.noir .practice{background:#0d1014}
.noir .results{background:#11151b}
.noir .rgrid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line)}
.noir .rgrid li{padding:34px 28px 34px 0;border-bottom:1px solid var(--line);display:grid;gap:10px;align-content:start}
.noir .rgrid li:not(:nth-child(3n+1)){padding-left:28px;border-left:1px solid var(--line)}
.noir .rgrid strong{font:400 clamp(44px,5vw,72px)/1 var(--display);color:var(--accent);letter-spacing:-.02em}
.noir .rgrid span{color:var(--muted);font-size:15.5px}
.noir .firm-p::before{content:"";position:absolute;inset:22px -22px -22px 22px;border:1px solid var(--accent);opacity:.6}
.noir .firm-p img{position:relative}
.noir .team{background:#11151b}
.noir .reviews{background:radial-gradient(80% 70% at 15% 0%,var(--accent-soft),transparent 70%),#0d1014}
.noir .rv-lead{display:grid;gap:26px;max-width:980px}
.noir .rv-lead blockquote{font:400 clamp(26px,3.2vw,42px)/1.3 var(--display);letter-spacing:-.005em}
.noir .rv-more{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:36px;margin-top:64px;padding-top:40px;border-top:1px solid var(--line)}
.noir .rv-more figure{display:grid;gap:16px;align-content:start}
.noir .rv-more blockquote{color:#cbc6be}
.noir .talk{background:#11151b;border-top:1px solid var(--line)}
.noir .phero{padding-top:200px;overflow:hidden;background:#11151b}
.noir .phero.has-p{min-height:520px;display:flex;align-items:flex-end}
.noir .phero .hero-img{position:absolute;inset:0}
.noir .phero .hero-img img{width:100%;height:100%;object-fit:cover;object-position:var(--pos);opacity:.55}
.noir .phero .hero-img::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0d1014 10%,#0d101400 90%),linear-gradient(0deg,#0d1014,#0d101400 60%)}
.noir .phero .phero-g{position:relative}
.noir .phero.has-p .phero-g{grid-template-columns:1fr}
.noir .phero h1{font-weight:400}
.noir .pull{background:#141920}
@media (max-width:900px){.noir .hero.side .hero-img{position:relative;inset:auto;width:auto;aspect-ratio:4/5;max-height:440px;margin:0 clamp(18px,4vw,40px) 32px}.noir .hero.side{flex-direction:column;align-items:stretch;padding-top:150px}.noir .hero.side .hero-in{padding-right:clamp(18px,4vw,40px)}.noir .hero-img::after{background:linear-gradient(0deg,#0d1014 22%,#0d1014b3 55%,#0d101466 100%)}.noir .rgrid{grid-template-columns:1fr 1fr}.noir .rgrid li:not(:nth-child(3n+1)){padding-left:0;border-left:0}.noir .rgrid li:nth-child(2n){padding-left:22px;border-left:1px solid var(--line)}}
@media (max-width:560px){.noir .hero{padding-top:150px;min-height:0}.noir .hero-facts{grid-template-columns:1fr}.noir .hero-facts div+div{padding-left:0;border-left:0}.noir .rgrid{grid-template-columns:1fr}.noir .rgrid li:nth-child(2n){padding-left:0;border-left:0}.noir .firm-p::before{inset:12px -10px -12px 10px}}
`,
  gazette: `
.gazette{--bg:#f4f4f1;--ink:#15181d;--muted:#5b5f66;--line:#d8d9d3;--line-strong:#a9aba5;--hover:#eaebe6;--form-bg:#fbfbf9;--field:#fff;--ft-bg:#15181d;--ft-ink:#d9dad6;--quote:"Newsreader",Georgia,serif;--r-btn:0}
.gazette .hd{border-bottom:3px double var(--ink)}
.gazette .hd.over{border-bottom:0}
.gazette .bar{min-height:96px}
.gazette .wm b{font-size:clamp(23px,2.5vw,31px)}
.gazette .hero{padding-block:clamp(48px,7vw,104px) clamp(56px,8vw,112px)}
.gazette .hero-g{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:clamp(32px,6vw,88px);align-items:end}
.gazette .hero-g.solo{grid-template-columns:1fr}
.gazette .hero-t{display:grid;gap:26px}
.gazette .hero h1{font-size:clamp(50px,7.4vw,112px);line-height:.95;letter-spacing:-.025em;max-width:12ch}
.gazette .hero-g.solo h1{max-width:16ch}
.gazette .hero h1.mid{font-size:clamp(44px,6vw,90px)}
.gazette .hero h1.long{font-size:clamp(40px,5vw,74px);max-width:18ch}
.gazette .hero.cover{position:relative;min-height:clamp(600px,88vh,880px);display:flex;align-items:flex-end;padding:0;color:#fff;overflow:hidden;background:#15181d}
.gazette .cover-img{position:absolute;inset:0}
.gazette .cover-img img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.gazette .cover-img::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(12,14,18,.92) 0%,rgba(12,14,18,.6) 34%,rgba(12,14,18,0) 62%),linear-gradient(90deg,rgba(12,14,18,.55) 0%,rgba(12,14,18,0) 55%)}
.gazette .cover-t{position:relative;padding-block:0 clamp(44px,6vw,80px);gap:22px}
html .gazette .hero.cover .eyebrow,html .gazette .hero.cover h1.kick{color:rgba(255,255,255,.86)}
.gazette .cover .slogan,.gazette .cover h1:not(.kick){color:#fff}
.noir .hero .slogan{font-weight:400}
.atelier .banner-t .slogan{font-size:clamp(46px,6vw,88px)}
.gazette .hero.cover .lede{color:rgba(255,255,255,.88);max-width:560px}
.gazette .cover .btn.solid{background:#fff;color:#15181d}
.gazette .cover .btn.solid:hover{background:var(--accent-soft)}
.gazette .cover .btn.text{color:#fff}
.gazette .record{background:#15181d;color:#e9e9e4;padding-block:34px 30px;--muted:#a3a6a0}
.gazette .record-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0}
.gazette .record-g>*{padding:6px 28px 6px 0;display:grid;gap:8px;align-content:start}
.gazette .record-g>*+*{padding-left:28px;border-left:1px solid #3a3e45}
.gazette .record strong{font:400 clamp(38px,4.2vw,58px)/1 var(--display);letter-spacing:-.02em}
.gazette .record span{color:var(--muted);font-size:15px}
.gazette .record blockquote{font:italic 400 19px/1.45 var(--quote)}
.gazette .record .disc{margin-top:18px}
.gazette .pano{margin-top:clamp(40px,5vw,64px);aspect-ratio:21/8;max-height:560px}
.gazette .pano img{width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.gazette .hero .lede{font:400 clamp(20px,1.9vw,25px)/1.45 var(--quote);color:#33373d;max-width:600px}
.gazette .hero-p{margin:0;display:grid;gap:12px}
.gazette .hero-p img{aspect-ratio:4/5;width:100%;object-fit:cover;object-position:var(--pos);filter:saturate(.9)}
.gazette .hero-p figcaption{font-size:12.5px;text-transform:none;letter-spacing:0;font-weight:400;font-style:italic;border-top:1px solid var(--ink);padding-top:10px}
.gazette .hero-q{display:grid;gap:18px;border-top:1px solid var(--ink);padding-top:24px}
.gazette .hero-q blockquote{font:italic 400 clamp(22px,2.2vw,28px)/1.4 var(--quote)}
.gazette .awards{background:var(--bg);border-color:var(--ink)}
.gazette .awards li{box-shadow:none;border:1px solid var(--line)}
.gazette .practice{border-top:1px solid var(--line)}
.gazette .pr-list{border-top:1px solid var(--ink)}
.gazette .pr-list .n{font:italic 400 22px/1 var(--quote);color:var(--accent);letter-spacing:0}
.gazette .results{background:var(--ink);color:#e9e9e4;--muted:#a3a6a0;--line:#3a3e45}
.gazette .ledger{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:clamp(32px,6vw,96px)}
.gazette .results .eyebrow{color:#c9cdc3}
.gazette .ledger ol{list-style:none;margin:0;padding:0}
.gazette .ledger li{display:grid;grid-template-columns:auto 1fr;gap:6px 22px;padding:22px 0;border-bottom:1px solid var(--line);align-items:baseline}
.gazette .ledger li i{display:none}
.gazette .ledger strong{font:400 clamp(36px,4vw,56px)/1 var(--display);letter-spacing:-.02em;min-width:3.6ch}
.gazette .ledger span{color:var(--muted)}
.gazette .firm-t p.first::first-letter{font:400 4.1em/.8 var(--display);float:left;margin:.06em .1em 0 0;color:var(--accent)}
.gazette .reviews{border-top:1px solid var(--line)}
.gazette .rv-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(28px,4vw,56px)}
.gazette .rv-cols figure{display:grid;gap:18px;align-content:start;border-top:1px solid var(--ink);padding-top:22px}
.gazette .rv-cols figure:first-child blockquote{font-size:clamp(23px,2.3vw,29px)}
.gazette .rv-cols blockquote{font:italic 400 20px/1.5 var(--quote)}
.gazette .team{border-top:1px solid var(--line)}
.gazette .people .ph{filter:grayscale(.15)}
.gazette .talk{background:var(--accent);color:#fff;--muted:rgba(255,255,255,.72);--line:rgba(255,255,255,.22);--line-strong:rgba(255,255,255,.4)}
.gazette .talk .eyebrow{color:rgba(255,255,255,.8)}
.gazette .talk .form{--ink:#15181d;--muted:#5b5f66;--line:#d8d9d3;--line-strong:#a9aba5;color:var(--ink);border:0}
.gazette .talk .btn.solid{background:var(--accent);color:#fff}
.gazette .phero{border-bottom:3px double var(--ink)}
.gazette .phero h1{letter-spacing:-.025em}
.gazette .side .big{color:var(--accent)}
@media (max-width:900px){.gazette .hero.cover{min-height:0;padding-top:280px}.gazette .record-g>*+*{padding-left:0;border-left:0;border-top:1px solid #3a3e45;padding-top:18px}.gazette .record-g{gap:18px}.gazette .hero-g,.gazette .ledger{grid-template-columns:1fr}.gazette .hero-p img{aspect-ratio:4/3}}
`,
  atelier: `
.atelier{--bg:#ffffff;--ink:#0e1421;--muted:#566070;--line:#e4e7ec;--line-strong:#c4c9d2;--hover:#f3f5f8;--form-bg:#fff;--field:#f6f7f9;--ft-bg:#0b101b;--ft-ink:#cfd5df;--dw:700;--dls:-.035em;--r-btn:999px;--r-card:22px;--r-img:20px;--r-field:12px;--quote:"Newsreader",Georgia,serif}
.atelier .hd:not(.over){position:sticky;top:0;background:rgba(255,255,255,.88);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);border-bottom:1px solid var(--line)}
.atelier .util{display:none}
.atelier .hcall{background:var(--ink);color:#fff;padding:10px 20px 10px 14px;border-radius:999px}
.atelier .hd.over .hcall{background:#fff;color:var(--ink)}
.atelier .hd.over .hcall svg{color:var(--accent)}
.atelier .hd.over .hcall small{color:var(--muted)}
.atelier .fh .pill{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.atelier .fh .pill::before{background:var(--glow)}
.atelier .fh h1:not(.kick){font-weight:800;letter-spacing:-.04em}
.atelier .fh{border-radius:0 0 36px 36px}
.atelier .hcall svg{color:#fff}
.atelier .hcall small{color:rgba(255,255,255,.65)}
.atelier .wm b{font-weight:800}
.atelier .hero{padding-block:clamp(36px,5vw,72px) clamp(56px,7vw,96px);background:linear-gradient(180deg,var(--accent-soft),#fff 75%)}
.atelier .hero-a{display:grid;grid-template-columns:minmax(0,11fr) minmax(0,10fr);gap:clamp(32px,5vw,72px);align-items:center}
.atelier .hero-a.card{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
.atelier .hero-card{background:var(--ink);color:#fff;border-radius:28px;padding:clamp(26px,3vw,40px);display:grid;gap:14px;box-shadow:0 40px 80px -40px rgba(14,20,33,.6)}
.atelier .hero-card .eyebrow{color:rgba(255,255,255,.6)}
.atelier .hero-card .big{font:800 clamp(30px,3vw,40px)/1 var(--display);letter-spacing:-.03em;text-decoration:none}
.atelier .hero-card p{color:rgba(255,255,255,.75)}
.atelier .hero-card ul{list-style:none;margin:10px 0 0;padding:0}
.atelier .hero-card li a{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-top:1px solid rgba(255,255,255,.14);text-decoration:none;font-weight:500}
.atelier .hero-t{display:grid;gap:26px;justify-items:start}
.atelier .pill{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--accent-deep)}
.atelier .pill::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent)}
.atelier .hero h1{font-size:clamp(44px,6vw,88px);line-height:.98;font-weight:800}
.atelier .hero h1.mid{font-size:clamp(40px,5vw,72px)}
.atelier .hero h1.long{font-size:clamp(36px,4.2vw,60px)}
.atelier .hero.wide{background:#fff;padding-top:clamp(16px,2vw,28px)}
.atelier .banner{position:relative;border-radius:32px;overflow:hidden;min-height:clamp(560px,72vh,760px);display:flex;align-items:flex-end;background:var(--ink)}
.atelier .banner>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--pos)}
.atelier .banner::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(9,13,22,.95) 0%,rgba(9,13,22,.88) 40%,rgba(9,13,22,.35) 62%,rgba(9,13,22,0) 78%)}
.atelier .banner-t{text-shadow:0 1px 18px rgba(9,13,22,.5)}
.atelier .banner-t{position:relative;z-index:2;color:#fff;padding:clamp(28px,5vw,64px);max-width:640px}
.atelier .banner-t h1{font-size:clamp(40px,5vw,72px)}
.atelier .banner-t h1.mid{font-size:clamp(36px,4.2vw,60px)}
.atelier .banner-t h1.long{font-size:clamp(32px,3.6vw,50px)}
.atelier .hero .banner-t .lede{color:rgba(255,255,255,.84)}
.atelier .banner-t .pill{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);color:#fff}
.atelier .banner-t .btn.solid{--btn:#fff;--btn-ink:var(--ink);--btn-hover:var(--accent-soft)}
.atelier .banner-t .btn.line{background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}
.atelier .under{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:16px}
.atelier .stat{background:var(--hover);border-radius:20px;padding:22px 24px;display:grid;gap:6px}
.atelier .stat strong{font:800 clamp(30px,3vw,40px)/1 var(--display);letter-spacing:-.03em;color:var(--accent)}
.atelier .stat span{font-size:14.5px;color:var(--muted)}
.atelier .practice.plain .cards a{padding:30px 28px 28px;gap:12px;border:1px solid var(--line)}
.atelier .practice.plain .cards b,.atelier .practice.plain .cards small,.atelier .practice.plain .cards .more{padding-inline:0}
.atelier .cards .num{font:700 15px/1 var(--display);color:var(--accent);letter-spacing:.02em;padding-bottom:18px;margin-bottom:6px;border-bottom:1px solid var(--line)}
.atelier .practice.plain{background:#fff}
.atelier .practice.plain .cards a{background:var(--hover);border:0}
.atelier .practice.plain .cards a:hover{background:#fff;box-shadow:0 26px 50px -26px rgba(14,20,33,.35),0 0 0 1px var(--line)}
.atelier .hero .lede{font-size:clamp(18px,1.6vw,21px);color:var(--muted);max-width:560px}
.atelier .mini-rv{border-left:3px solid var(--accent);padding:4px 0 4px 18px;display:grid;gap:8px;max-width:520px}
.atelier .mini-rv blockquote{font:italic 400 19px/1.45 var(--quote)}
.atelier .mini-rv figcaption{font-size:12.5px}
.atelier .hero-p{position:relative;aspect-ratio:4/5;max-height:640px;width:100%}
.atelier .hero-p img{width:100%;height:100%;object-fit:cover;object-position:var(--pos);border-radius:28px}
.atelier .float{position:absolute;left:-36px;bottom:-28px;background:#fff;border-radius:18px;padding:18px 22px;box-shadow:0 24px 60px -20px rgba(14,20,33,.35);display:grid;gap:4px;max-width:270px}
.atelier .float strong{font:800 34px/1 var(--display);letter-spacing:-.03em;color:var(--accent)}
.atelier .float span{font-size:13.5px;color:var(--muted);line-height:1.4}
.atelier .awards{border:0;padding-block:20px 40px}
.atelier .awards li{background:var(--hover);box-shadow:none;border-radius:14px}
.atelier .awards li.dk{background:var(--ink)}
.atelier .btn.solid{--btn:var(--ink);--btn-hover:var(--accent)}
.atelier .btn.line{background:#fff}
.atelier .practice{background:var(--hover)}
.atelier .cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.atelier .cards.four{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:1080px){.atelier .cards,.atelier .cards.four{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.atelier .cards,.atelier .cards.four{grid-template-columns:1fr}}
.atelier .cards a{display:grid;gap:10px;align-content:start;background:#fff;border-radius:22px;padding:12px 12px 24px;text-decoration:none;height:100%;transition:transform .3s,box-shadow .3s}
.atelier .cards a:hover{transform:translateY(-4px);box-shadow:0 26px 50px -26px rgba(14,20,33,.4)}
.atelier .cards .ph{aspect-ratio:16/10;border-radius:14px;overflow:hidden;margin-bottom:8px;display:block}
.atelier .cards .ph img{width:100%;height:100%;object-fit:cover}
.atelier .cards .ph.none{background:linear-gradient(135deg,var(--accent),var(--accent-deep));display:flex;align-items:flex-end;padding:18px}
.atelier .cards .ph.none em{font:800 46px/1 var(--display);font-style:normal;color:rgba(255,255,255,.9);letter-spacing:-.04em}
.atelier .cards b,.atelier .cards small,.atelier .cards .more{padding-inline:10px}
.atelier .cards b{font:700 22px/1.2 var(--display);letter-spacing:-.02em}
.atelier .cards small{color:var(--muted);font-size:15px;line-height:1.55}
.atelier .cards .more{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px;color:var(--accent);margin-top:6px}
.atelier .cards a{position:relative;overflow:hidden}
.atelier .cards a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--glow));transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.atelier .cards a:hover::after{transform:scaleX(1)}
.atelier .cards a:hover b{color:var(--accent-deep)}
.atelier .results{background:var(--accent-deep);color:#fff;--muted:rgba(255,255,255,.7);border-radius:32px;margin:clamp(40px,6vw,80px) clamp(10px,2vw,24px)}
.atelier .results .eyebrow{color:rgba(255,255,255,.75)}
.atelier .rgrid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.atelier .rgrid li{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:28px;display:grid;gap:10px;align-content:start}
.atelier .rgrid strong{font:800 clamp(42px,4.6vw,64px)/1 var(--display);letter-spacing:-.04em}
.atelier .rgrid span{color:var(--muted);font-size:15px}
.atelier .firm-p img{border-radius:24px}
.atelier .reviews{background:var(--hover)}
.atelier .rv-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.atelier .rv-cards figure{background:#fff;border-radius:22px;padding:30px;display:grid;gap:18px;align-content:start}
.atelier .rv-cards .qm{width:34px;height:26px}
.atelier .rv-cards blockquote{font:400 18.5px/1.6 var(--quote)}
.atelier .people .ph{border-radius:20px}
.atelier .talk{background:#fff}
.atelier .talk .form{background:var(--hover);border:0}
.atelier .phero{background:linear-gradient(180deg,var(--accent-soft),#fff);border:0}
.atelier .phero h1{font-weight:800}
.atelier .side .card{background:var(--hover);border:0}
@media (max-width:900px){.atelier .hero-a{grid-template-columns:1fr}.atelier .hero-p{aspect-ratio:4/3}.atelier .float{left:12px;bottom:12px}.atelier .banner{min-height:0;flex-direction:column;align-items:stretch}.atelier .banner>img{position:relative;height:auto;aspect-ratio:16/10}.atelier .banner::before{display:none}.atelier .banner-t{max-width:none;background:var(--ink)}}
@media (max-width:560px){.atelier .hcall{padding:0;width:44px}.atelier .hcall svg{color:#fff}}
`,
}
