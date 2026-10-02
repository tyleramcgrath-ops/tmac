// The free redesign preview: an owner (or anyone) pastes their current
// website's address and sees it rebuilt on SaySites, with a before/after
// report. Built without AI, so each preview costs a handful of page reads.
// Claiming it creates a real site from the preview.

import { randomUUID } from 'crypto'
import { audit, type Audit } from './audit'
import { detectBusiness, type Detected } from './detect'
import { ImportError, decode, discover, lastFetchError, dropTemplate, extract, normalizeStart, planImport, safeFetch, slugForPath, type Fetcher, type ImportedPage } from './importer'
import { renderPage } from './render'
import { checkPage } from './seo'
import { checkSpeed } from './speed'
import { walk, type Element, type Page, type Redirect, type Site } from './schema'
import { buildStarterSite } from './starter'
import { photosFor } from './photos'
import { luminance, photoSet, readLook } from './lookalike'
import { Styles } from './css-lite'
import { ancestors, findAll, parseHtml, type El } from './dom'
import { mirrorPage, readChrome, readGlobals, regions } from './mirror'
import { freshSite } from './restyle'

// A preview reads fewer pages than a full move, to stay quick and cheap.
export const PREVIEW_PAGES = 16

export interface Preview {
  id: string
  url: string
  createdAt: string
  detected: Detected
  // Their site as it is: same sections, words, photos and colours.
  site: Site
  pages: Page[]
  redirects: Redirect[]
  // A fresh redesign from the same content, to compare (previews made
  // before October 2026 don't have one).
  fresh?: { site: Site; pages: Page[]; redirects: Redirect[] }
  before: Audit
  after: Audit & { speedPass: boolean; seoErrors: number }
  pagesFound: number
  // Set once the preview has been claimed.
  claimed?: { by: string; siteId: string }
}

export async function buildPreview(input: string, get: Fetcher = safeFetch, id = randomUUID().replace(/-/g, '').slice(0, 16)): Promise<Preview> {
  const start = normalizeStart(input)
  const first = await get(start.href)
  if (!first) throw new ImportError(`We couldn’t reach ${start.hostname}${lastFetchError ? ` (${lastFetchError})` : ''}. Check the address and try again.`)
  // Security checks ("prove you're human" pages, captchas, firewalls) are
  // the site owner's choice; we never try to get around them.
  const challenge = first.status === 202 || (first.body.length < 3000 && /sgcaptcha|captcha|cf-chl|just a moment|checking your browser|attention required/i.test(first.body))
  if (challenge || first.status === 401 || first.status === 403 || first.status === 429 || first.status === 503) throw new ImportError(`${new URL(first.url).hostname.replace(/^www\./, '')} has a security check that only lets people in, not tools like ours, so we can’t read it. You can still build the site from your business details in about two minutes.`)
  if (first.status !== 200) throw new ImportError(`That address answered with error ${first.status}. Check the address and try again.`)
  if (!/html/i.test(first.type) || !first.body) throw new ImportError('That address isn’t a web page we can read. Try your homepage address.')
  const detected = detectBusiness(first.body, first.url)
  // The pages in their menu first, so the copy's menu works.
  const path = (u: URL) => u.pathname.replace(/\/+$/, '') || '/'
  const all = await discover(new URL(first.url), get)
  const urls = [...all.filter((u) => path(u) === '/'), ...menuPaths(first.body, first.url).filter((u) => !SKIP_MENU.test(u.pathname)), ...all]
    .filter((u, i, list) => list.findIndex((v) => path(v) === path(u)) === i)
    .slice(0, PREVIEW_PAGES)
  const found: (ImportedPage & { html: string })[] = []
  await Promise.all(
    urls.map(async (u) => {
      const res = u.href === first.url ? first : await get(u.href).catch(() => null)
      if (res && res.status === 200 && /html/i.test(res.type)) found.push({ from: u.pathname.replace(/\/+$/, '') || '/', url: u.href, extracted: extract(res.body), html: res.body })
    })
  )
  found.sort((a, b) => urls.findIndex((u) => u.href === a.url) - urls.findIndex((u) => u.href === b.url))
  const cleaned = dropTemplate(found.map((f) => f.extracted))
  const pages = found.map((f, i) => ({ ...f, extracted: cleaned[i] }))
  // The main services are the imported pages' headings (not about, contact
  // and the like), which also fill the home page's services section.
  const fromPages = pages
    .filter((p) => p.from !== '/' && !/about|contact|faq|privacy|terms|team|attorney|staff|review|testimonial|career|location|areas?-we-serve|blog|news/i.test(p.from))
    .map((p) => (p.extracted.h1 || p.extracted.title.split(/\s[|\-–—]\s/)[0]).trim())
    .filter((s) => s && s.length <= 80)
    // Keyword pages are often in capitals ("NAPLES DIVORCE LAWYERS").
    .map((s) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s))
    // "Assaults at Businesses Lawyers in Jackson, MS" → "Assaults at Businesses".
    .map((s) => s.replace(/\s+in\s+[A-Z][\w.' -]+,\s*[A-Z]{2}$/, '').replace(/\s+(lawyers?|attorneys?|law firm)$/i, '').trim())
    .filter(Boolean)
  // Older sites repeat the business name as every page's heading; those
  // aren't services. Then the menu's own links fill any gap.
  const named = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const services = [...new Set([...fromPages, ...menuServices(first.body)].map((s) => s.trim()))]
    .filter((s, i, all) => named(s) !== named(detected.name) && all.findIndex((t) => named(t) === named(s)) === i)
    .slice(0, 6)
  const home = pages.find((p) => p.from === '/')?.extracted.h1 ?? ''
  const headline = home.length >= 12 && home.length <= 90 ? (home === home.toUpperCase() ? home.charAt(0) + home.slice(1).toLowerCase() : home) : undefined
  // Their own look: hero photo, photos, logo and brand colour. A photo with
  // the words on top (the usual law firm or trades site) becomes the dark,
  // full-photo design so their light logo and photo read the same way.
  const sheets = await siteStyles(first.body, first.url, get)
  const host = new URL(first.url).hostname.replace(/^www\./, '')
  const ownSheets = sheets.filter((x) => new URL(x.url).hostname.replace(/^www\./, '') === host).slice(0, 3).map((x) => x.css).join('\n')
  const look = readLook(first.body, first.url, detected.name, ownSheets)
  const dark = look.photoHero
  const { site, pages: starter } = buildStarterSite(
    {
      name: detected.name,
      type: detected.type,
      city: detected.city ?? 'your area',
      region: detected.region ?? '',
      phone: detected.phone,
      email: detected.email,
      street: detected.street,
      postalCode: detected.postalCode,
      hours: detected.hours,
      services,
      palette: dark ? 'noir' : detected.palette,
      photos: photoSet(look, photosFor(detected.type), services),
      ...(dark ? { design: 'upscale' as const } : {}),
      ...(headline ? { headline } : {}),
    },
    'org_preview',
    `preview-${id}`
  )
  // Old logos are often made for dark headers and would vanish on a light
  // one; the preview shows the name, and the owner adds a logo after claiming.
  // Their exact brand colour for buttons and accents, when it reads well
  // on the background (light enough on dark, dark enough on light).
  if (detected.color && /^#[0-9a-f]{6}$/i.test(detected.color)) {
    const l = luminance(detected.color)
    if (dark ? l >= 0.18 : l <= 0.3) site.globals.colors = { ...site.globals.colors, primary: detected.color, accent: detected.color }
  }
  // Their logo: any version on the dark design, otherwise only one made
  // for a light header.
  const logo = dark ? look.logo ?? detected.logo : detected.logo
  if (logo) site.business.logo = logo
  if (!detected.city) {
    // Without a town the starter's copy reads oddly; keep it general.
    site.business.area = undefined
  }
  // Their own hero words, in place of the generated ones.
  const homeStarter = starter.find((p) => p.slug === '')
  if (homeStarter) {
    for (const el of walk(homeStarter.body)) {
      if (el.type === 'text' && el.id === 'hero-kicker' && look.heroLine) el.text = look.heroLine
      if (el.type === 'text' && el.id === 'hero-text' && look.heroText) el.text = look.heroText

    }
  }
  // Their own hero photo is the point, so it shows through more.
  if (homeStarter && look.hero) {
    const lighten = (v: unknown): void => {
      if (Array.isArray(v)) return v.forEach(lighten)
      if (!v || typeof v !== 'object') return
      const o = v as Record<string, unknown>
      const bg = o.backgroundImage as { src?: string; overlay?: number } | undefined
      if (bg && bg.src === look.hero!.src && (bg.overlay ?? 0) > 0.62) bg.overlay = 0.62
      Object.values(o).forEach(lighten)
    }
    lighten(homeStarter)
  }
  // Their site as it is, page by page; then the same pages and words in a
  // fresh design.
  const mirror = buildMirror(first, found, sheets, site, starter, detected, look.logo)
  const brand = /^#[0-9a-f]{6}$/i.test(detected.color ?? '') ? detected.color! : mirror.site.globals.colors.primary
  const fresh = freshSite(mirror.site, mirror.pages, brand, detected.type === 'lawyer' || mirror.site.globals.fonts.heading === 'serif', look.hero)
  const homePage = mirror.pages.find((p) => p.slug === '')!
  const rendered = renderPage(mirror.site, homePage, mirror.pages)
  return {
    id,
    url: start.origin,
    createdAt: new Date().toISOString(),
    detected,
    site: mirror.site,
    pages: mirror.pages,
    redirects: mirror.redirects,
    fresh: { ...fresh, redirects: mirror.redirects },
    before: audit(first.body),
    after: { ...audit(rendered.html), speedPass: checkSpeed(rendered).pass, seoErrors: mirror.pages.reduce((n, p) => n + checkPage(p, mirror.pages).filter((i) => i.severity === 'error').length, 0) },
    pagesFound: urls.length,
  }
}

const ALIASES: Record<string, string> = { 'contact-us': 'contact', 'contact-me': 'contact', 'get-in-touch': 'contact' }

// Their own site rebuilt on SaySites: each page's sections in their order,
// with their header, menu, colours and fonts. Pages and addresses match the
// import, so what Google already ranks stays put.
function buildMirror(
  first: { url: string; body: string },
  found: (ImportedPage & { html: string })[],
  sheets: { url: string; css: string }[],
  freshSite: Site,
  starter: Page[],
  detected: Detected,
  lookLogo?: string
): { site: Site; pages: Page[]; redirects: Redirect[] } {
  const origin = new URL(first.url)
  const sameSite = (u: URL) => u.hostname.replace(/^www\./, '') === origin.hostname.replace(/^www\./, '')
  // Every old address we read, and the SaySites address it becomes.
  const known = new Map<string, string>()
  for (const f of found) {
    const raw = slugForPath(f.from)
    const slug = ALIASES[raw] ?? raw
    known.set(f.from.replace(/\/+$/, '') || '/', slug ? `/${slug}` : '/')
  }
  const link = (href: string): string | undefined => {
    const h = href.trim()
    if (!h || h.startsWith('#') || /^javascript:/i.test(h)) return undefined
    if (/^tel:/i.test(h)) {
      const n = h.slice(4).replace(/[^\d+()\s-]/g, '').trim()
      return n ? `tel:${n}` : undefined
    }
    if (/^mailto:/i.test(h)) return /^mailto:[^\s?]+@[^\s?]+$/i.test(h.split('?')[0]) ? h.split('?')[0] : undefined
    try {
      const u = new URL(h, first.url)
      if (!sameSite(u)) return u.protocol === 'https:' && !/\s/.test(u.href) ? u.href : undefined
      const path = u.pathname.replace(/\/+$/, '') || '/'
      if (known.has(path)) return known.get(path)
      const slug = slugForPath(path)
      return slug ? `/${ALIASES[slug] ?? slug}` : '/'
    } catch {
      return undefined
    }
  }
  const globalCss = sheets.map((x) => x.css).join('\n')
  const stylesFor = (html: string, url: string) => {
    const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
    return new Styles(`${globalCss}\n${inline}`, url)
  }
  const root = parseHtml(first.body)
  const homeStyles = stylesFor(first.body, first.url)
  const { globals, text } = readGlobals(root, homeStyles, freshSite.globals, detected.color)
  const chrome = readChrome(root, homeStyles, first.url, detected.name, link)
  const used = new Set<string>()
  const ctx = (url: string, styles: Styles, idBase: string) => ({ url, name: detected.name, styles, idBase, link, used })
  const now = new Date().toISOString()
  const home = mirrorPage(first.body, ctx(first.url, homeStyles, 'home'), text, detected.name, root)
  const freshHome = starter.find((p) => p.slug === '')!
  const homePage: Page = { ...freshHome, body: home.body, updatedAt: now }
  // Our contact page only when they don't have one of their own.
  const theirContact = [...known.values()].includes('/contact')
  const existing = [homePage, ...(theirContact ? [] : starter.filter((p) => p.slug === 'contact'))]
  const others = found
    .filter((f) => (f.from.replace(/\/+$/, '') || '/') !== '/')
    .map((f, i) => {
      const styles = stylesFor(f.html, f.url)
      const m = mirrorPage(f.html, ctx(f.url, styles, `p${i + 1}`), text, f.extracted.h1 || f.extracted.title || detected.name)
      return { ...f, body: m.body.length ? m.body : undefined }
    })
  const site: Site = structuredClone(freshSite)
  site.globals = globals
  const plan = planImport(site, existing, others)
  // Their "/contact-us" becomes /contact, where SaySites links and forms
  // expect it; the old address redirects.
  for (const pg of plan.pages) {
    const to = ALIASES[pg.slug]
    if (!to || plan.pages.some((x) => x.slug === to) || existing.some((x) => x.slug === to)) continue
    const old = `/${pg.slug}`
    pg.slug = to
    plan.redirects = plan.redirects.map((r) => (r.to === old ? { ...r, to: `/${to}` } : r))
    if (!plan.redirects.some((r) => r.from === old)) plan.redirects.push({ from: old, to: `/${to}`, status: 301 })
  }
  const pages = [...existing, ...plan.pages.map((p) => ({ ...p, status: 'published' as const }))]
  const paths = new Set(pages.map((p) => (p.slug ? `/${p.slug}` : '/')))
  // Links to pages we didn't read go to the contact page (or are dropped).
  const fix = (href: string) => (!href.startsWith('/') || paths.has(href.split(/[?#]/)[0].replace(/\/$/, '') || '/') ? href : paths.has('/contact') ? '/contact' : undefined)
  for (const p of pages) {
    const prune = (els: Element[]): Element[] =>
      els.flatMap((e): Element[] => {
        if (e.type === 'container') return [{ ...e, children: prune(e.children) }]
        if (e.type === 'button') {
          const href = fix(e.href)
          return href ? [{ ...e, href }] : []
        }
        return [e]
      })
    p.body = p.body.map((c) => ({ ...c, children: prune(c.children) }))
  }
  const nav = chrome.nav.map((n) => ({ ...n, href: fix(n.href) })).filter((n): n is { label: string; href: string } => !!n.href && n.href !== '/').slice(0, 10)
  if (nav.length >= 2) site.nav = nav
  const cta = chrome.cta && fix(chrome.cta.href) ? { label: chrome.cta.label, href: fix(chrome.cta.href)! } : freshSite.header?.cta
  site.header = {
    ...(chrome.topbar ? { topbar: chrome.topbar } : {}),
    ...(cta ? { cta } : {}),
    ...(chrome.colors ? { colors: chrome.colors } : {}),
  }
  const logo = chrome.logo ?? lookLogo ?? detected.logo
  if (logo) site.business.logo = logo
  if (chrome.footerNote) site.footerNote = chrome.footerNote
  // Their own photos only; stock photo credits belong to the fresh design.
  site.credits = undefined
  return { site, pages, redirects: plan.redirects }
}

// The site's own stylesheets: the theme's and page builder's, wherever
// they're served from (often a CDN). Skips fonts and unrelated plugins.
async function siteStyles(html: string, base: string, get: Fetcher): Promise<{ url: string; css: string }[]> {
  const hrefs = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /rel\s*=\s*["']?stylesheet/i.test(t) && !/media\s*=\s*["']?print/i.test(t))
    .map((t) => t.match(/href\s*=\s*["']([^"']+)["']/i)?.[1])
    .filter((h): h is string => !!h)
    .map((h) => { try { return new URL(decode(h), base) } catch { return null } })
    .filter((u): u is URL => !!u && /^https?:$/.test(u.protocol) && !/fonts?\b|font-awesome|fontawesome|icons?\b|dashicons|wp-includes|contact-form|cf7|woocommerce|jquery|slick|swiper|owl|animate|lightbox|fancybox|magnific/i.test(u.href) && !/plugins\/(?!.*(theme|builder|elementor|avia|divi|beaver|fusion|vc_|js_composer|kadence|generate|astra|blocks))/i.test(u.pathname))
    // Their own theme's files first (custom and child-theme styles,
    // generated colour schemes), then the theme, then the rest.
    .map((u, i) => ({ u, rank: (/custom|child|dynamic|uploads|style\.css|main\.css|theme\.css/i.test(u.pathname) ? 0 : /themes\//.test(u.pathname) && !/shortcodes\/(?!grid_row|slideshow|section)/.test(u.pathname) ? 1 : 2) * 100 + i }))
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.u)
    .slice(0, 14)
  const css = await Promise.all(hrefs.map((u) => get(u.href).then((r) => (r && r.status === 200 && !/<html/i.test(r.body.slice(0, 500)) ? { url: u.href, css: r.body } : null)).catch(() => null)))
  return css.filter((c): c is { url: string; css: string } => !!c)
}

const SKIP_MENU = /\/(wp-admin|wp-content|feed|tag|category|author|cart|checkout|my-account|login)(\/|$)/i

// The pages linked from the home page's main menu, in order.
function menuPaths(html: string, base: string): URL[] {
  const root = parseHtml(html)
  const { header } = regions(root)
  const host = new URL(base).hostname.replace(/^www\./, '')
  const out: URL[] = []
  // Top-level menu entries first, then the pages in their dropdowns.
  const depth = (e: El) => ancestors(e).filter((x) => x.tag === 'li').length
  const links = header ? findAll(header, (e) => e.tag === 'a').sort((a, b) => depth(a) - depth(b)) : []
  for (const a of links) {
    try {
      const u = new URL(a.attrs.href ?? '', base)
      u.hash = ''
      u.search = ''
      if (u.hostname.replace(/^www\./, '') === host && /^https?:$/.test(u.protocol) && !/\.(jpe?g|png|pdf|webp)$/i.test(u.pathname)) out.push(u)
    } catch {}
  }
  return out
}

// Service names from the home page's menu links, for sites whose pages
// don't have their own headings. Skips the usual non-service links.
const NOT_SERVICE = /^(home|about|about us|our (team|firm|story)|team|contact|contact us|blog|news|faq|faqs|careers?|jobs|privacy|terms|sitemap|site map|login|log in|sign in|sign up|register|account|my account|cart|checkout|search|links?|locations?|directions|forms?|resources|testimonials|reviews|partners|affiliations|gallery|photos|menu|more|pay|payments?|portal|client login)$|rates?$|prices?$|pricing|calculator|deadlines|login|log in|portal|e-?filing|beta/i
export function menuServices(html: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1]
    if (/^(mailto:|tel:|javascript:)/i.test(href) || /^https?:\/\//i.test(href)) continue
    const text = decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/[>»›]+\s*$/, '').trim()
    if (text.length < 4 || text.length > 40 || NOT_SERVICE.test(text) || !/[a-z]/i.test(text)) continue
    out.push(text)
  }
  return out
}

// Claiming: the preview becomes the owner's site. Imported pages start as
// drafts, as in a move, until the domain is switched over.
// The owner picks which version: their site as it is (the default) or the
// fresh redesign.
export function claimFromPreview(p: Preview, orgId: string, subdomain: string, version: 'as-is' | 'fresh' = 'as-is'): { site: Site; pages: Page[]; redirects: Redirect[] } {
  const from = version === 'fresh' && p.fresh ? p.fresh : p
  const siteId = `site_${randomUUID()}`
  const site: Site = { ...structuredClone(from.site), id: siteId, orgId, subdomain, updatedAt: new Date().toISOString() }
  const pages = from.pages.map((pg) => ({ ...structuredClone(pg), id: `page_${randomUUID()}`, siteId, status: pg.source ? ('draft' as const) : pg.status }))
  return { site, pages, redirects: from.redirects }
}
