// The free redesign preview: an owner (or anyone) pastes their current
// website's address and sees two versions of it on SaySites, with a
// before/after report. Built without AI, so each preview costs a handful of
// page reads. Claiming it creates a real site from the version they pick.
//
// "Your site, as it is" is each page exactly as it looks today: their own
// markup and stylesheets, without scripts (lib/classic). When a page can't
// be copied exactly (a site that draws itself with scripts), the preview
// offers only the redesign rather than a copy that doesn't look like theirs.
//
// "A fresh redesign" is one of SaySites' own designs (lib/starter, with the
// law and medical designs), filled with their real details and their own
// words: each service's page is written from their page about it, and every
// other page they have comes across with its words. Nothing is invented.

import { randomUUID, timingSafeEqual } from 'crypto'
import { audit, type Audit } from './audit'
import { classicPage, type ClassicResult, type SheetCache } from './classic'
import { detectBusiness, type Detected } from './detect'
import { ImportError, decode, discover, lastFetchError, dropTemplate, extract, normalizeStart, planImport, safeFetch, safeFetchBytes, slugForPath, type Extracted, type Fetcher, type ImportedPage } from './importer'
import { lawStyleFor, LAW_STYLES, type Attorney, type LawStyle } from './law-designs'
import { renderPage } from './render'
import { checkPage } from './seo'
import { checkSpeed } from './speed'
import { Slug, type Page, type Redirect, type Site } from './schema'
import { buildStarterSite, serviceSlug, subdomainFor, type WrittenContent, type WrittenService } from './starter'
import type { Store } from './store'
import { ancestors, findAll, isEl, parseHtml, regions, textOf, type El } from './dom'
import { measurePhotos, readAssets, type SiteAssets, type SitePhoto } from './redesign-assets'
import { isWide, LOOKS, showcaseHome, showcasePage, type ShowcaseFirm, type ShowcasePage } from './redesign-design'

// A preview reads fewer pages than a full move, to stay quick and cheap.
export const PREVIEW_PAGES = 24

export interface Preview {
  id: string
  url: string
  createdAt: string
  detected: Detected
  // The version shown first and claimed by default: their site as it is
  // when it can be copied exactly (pages carry `classic`), otherwise the
  // redesign.
  site: Site
  pages: Page[]
  redirects: Redirect[]
  // False when their site can't be copied exactly, with the reasons
  // (missing on previews made before November 2026).
  asIs?: boolean
  asIsReasons?: string[]
  // The browser check of the copy against their live site
  // (scripts/compare-preview.ts): the share of the page that matches, on a
  // computer and a phone. The copy is offered only once it has passed.
  asIsCheck?: { desktop: number; phone: number; at: string; passed: boolean }
  // The redesign (previews made before October 2026 don't have one), and
  // whether it has enough of their own substance to offer (REDESIGN_NEEDS).
  fresh?: { site: Site; pages: Page[]; redirects: Redirect[] }
  freshReady?: boolean
  before: Audit
  // The redesign's home page.
  after: Audit & { speedPass: boolean; seoErrors: number }
  pagesFound: number
  // Set once the preview has been claimed.
  claimed?: { by: string; siteId: string }
}

// fetchBytes measures the photos a design leads with (measurePhotos); left
// out when pages come from somewhere other than the web (tests).
export async function buildPreview(input: string, get: Fetcher = safeFetch, id = randomUUID().replace(/-/g, '').slice(0, 16), fetchBytes: BytesFetcher | undefined = get === safeFetch ? safeFetchBytes : undefined): Promise<Preview> {
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
  detected.name = businessName(detected.name, first.body, first.url)
  // The pages in their menu first, so both versions' menus work.
  const path = (u: URL) => u.pathname.replace(/\/+$/, '') || '/'
  const all = await discover(new URL(first.url), get)
  const urls = [...all.filter((u) => path(u) === '/'), ...menuPaths(first.body, first.url).filter((u) => !SKIP_MENU.test(u.pathname)), ...all]
    .filter((u, i, list) => list.findIndex((v) => path(v) === path(u)) === i && !DEMO.test(path(u)))
    .slice(0, PREVIEW_PAGES)
  const found: (ImportedPage & { html: string })[] = []
  await Promise.all(
    urls.map(async (u) => {
      const res = u.href === first.url ? first : await get(u.href).catch(() => null)
      if (res && res.status === 200 && /html/i.test(res.type)) found.push({ from: u.pathname.replace(/\/+$/, '') || '/', url: res.url || u.href, extracted: extract(res.body), html: res.body })
    })
  )
  found.sort((a, b) => urls.findIndex((u) => u.href === a.url) - urls.findIndex((u) => u.href === b.url))
  // The home page first, always.
  found.sort((a, b) => (a.from === '/' ? -1 : b.from === '/' ? 1 : 0))
  const cleaned = dropTemplate(found.map((f) => f.extracted))
  const pages = found.map((f, i) => ({ ...f, extracted: cleaned[i] }))

  const read = readAssets(pages.map((p) => ({ html: p.html, url: p.url })))
  const assets = fetchBytes ? await measurePhotos(read, fetchBytes) : read
  const { ready: freshReady, ...fresh } = redesign(pages, detected, id, assets)
  const menu = new Set(['/', ...menuPaths(first.body, first.url).map(path)])
  const asIs = await copyAsIs(found, fresh, get, menu)
  const homePage = fresh.pages.find((p) => p.slug === '')!
  const rendered = renderPage(fresh.site, homePage, fresh.pages)
  const shown = asIs.ok ? asIs : fresh
  return {
    id,
    url: start.origin,
    createdAt: new Date().toISOString(),
    detected,
    site: shown.site,
    pages: shown.pages,
    redirects: shown.redirects,
    asIs: asIs.ok,
    ...(asIs.ok ? {} : { asIsReasons: asIs.reasons }),
    fresh,
    freshReady,
    before: audit(first.body),
    after: { ...audit(rendered.html), speedPass: checkSpeed(rendered).pass, seoErrors: fresh.pages.reduce((n, p) => n + checkPage(p, fresh.pages).filter((i) => i.severity === 'error').length, 0) },
    pagesFound: urls.length,
  }
}

// How much of a page (on a computer and on a phone) must match their site,
// pixel for pixel, before the copy is offered.
export const COPY_PASS = 97

// The exact copy is only ever offered once a browser has confirmed it looks
// the same as their site; checks run where Chromium does (never this host).
export function offersCopy(p: Pick<Preview, 'asIs' | 'asIsCheck' | 'pages'>): boolean {
  return p.asIs === true && !!p.asIsCheck?.passed && p.pages.some((pg) => pg.classic && !pg.classic.design)
}

// Records a browser check of a preview's copy. It runs where Chromium does,
// never on this host, and signs in with PREVIEW_CHECK_TOKEN; without that
// set, nothing is recorded and no copy is ever offered.
export async function recordCheck(store: Pick<Store, 'recordPreviewCheck'>, id: string, authorization: string, body: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const token = process.env.PREVIEW_CHECK_TOKEN ?? ''
  const given = authorization.replace(/^Bearer\s+/i, '')
  if (token.length < 24 || given.length !== token.length || !timingSafeEqual(Buffer.from(given), Buffer.from(token))) return { status: 403, body: { error: 'Not allowed.' } }
  const b = (body ?? {}) as { desktop?: unknown; phone?: unknown }
  const pct = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? Math.round(v * 10) / 10 : null)
  const desktop = pct(b.desktop)
  const phone = pct(b.phone)
  if (desktop === null || phone === null) return { status: 400, body: { error: 'Send JSON: {"desktop": 98.5, "phone": 97.2}, percentages from 0 to 100.' } }
  const passed = desktop >= COPY_PASS && phone >= COPY_PASS
  const ok = await store.recordPreviewCheck(id, { desktop, phone, passed, at: new Date().toISOString() })
  return ok ? { status: 200, body: { passed, desktop, phone, needs: COPY_PASS } } : { status: 404, body: { error: 'No preview with that id.' } }
}

const ALIASES: Record<string, string> = { 'contact-us': 'contact', 'contact-me': 'contact', 'get-in-touch': 'contact' }
const slugFor = (from: string) => {
  const raw = slugForPath(from)
  return ALIASES[raw] ?? raw
}

// ---------------------------------------------------------------------------
// Their site as it is
// ---------------------------------------------------------------------------

// Every page we read, exactly as it looks, at the same address (contact
// pages at /contact, where SaySites forms and links expect it). Each page
// also carries the redesign's version of it (or its words in the SaySites
// design), ready for when the owner switches that page over. The home page
// and the pages in their menu must copy exactly, or there's no copy; a page
// off the menu that can't (an old landing page) shows in the SaySites design.
async function copyAsIs(found: (ImportedPage & { html: string })[], fresh: Built, get: Fetcher, menu: Set<string>): Promise<Built & { ok: boolean; reasons: string[] }> {
  const origin = new URL(found[0]?.url ?? 'https://example.com/')
  const host = (u: URL) => u.hostname.replace(/^www\./, '')
  const known = new Map<string, string>()
  for (const f of found) known.set(f.from.replace(/\/+$/, '') || '/', slugFor(f.from))
  const link = (href: string): string | undefined => {
    try {
      const u = new URL(href)
      if (host(u) !== host(origin) || !/^https?:$/.test(u.protocol)) return undefined
      const p = u.pathname.replace(/\/+$/, '') || '/'
      const slug = known.get(p)
      // Pages we didn't read keep pointing at the old site until the domain
      // moves over; then the same address is ours.
      if (slug === undefined) return undefined
      return `${slug ? `/${slug}` : '/'}${u.hash}`
    } catch {
      return undefined
    }
  }
  const cache: SheetCache = new Map()
  const copies: ClassicResult[] = await Promise.all(found.map((f) => classicPage(f.html, f.url, get, cache, { link, formAction: '/__form' })))
  const onMenu = (f: ImportedPage) => menu.has(f.from.replace(/\/+$/, '') || '/')
  const reasons = [...new Set(copies.flatMap((c, i) => (onMenu(found[i]) ? c.reasons.map((r) => (found[i].from === '/' ? r : `${r.replace(/\.$/, '')} (${found[i].from})`)) : [])))]
  const now = new Date().toISOString()
  const bySlug = new Map(fresh.pages.map((p) => [p.slug, p]))
  // Words in the SaySites design for pages the redesign doesn't have.
  const plan = planImport(fresh.site, [], found.map((f) => ({ from: f.from, url: f.url, extracted: f.extracted })), now)
  const plainBySource = new Map(plan.pages.map((p) => [p.source, p]))
  const taken = new Set<string>()
  const pages: Page[] = []
  const redirects: Redirect[] = []
  found.forEach((f, i) => {
    const slug = slugFor(f.from)
    if (taken.has(slug) || (slug && !Slug.safeParse(slug).success)) return
    taken.add(slug)
    const e = f.extracted
    const twin = bySlug.get(slug) ?? plainBySource.get(f.url.slice(0, 500))
    const title = (e.title || e.h1 || slug || fresh.site.business.name).slice(0, 70)
    pages.push({
      id: `page_${randomUUID()}`,
      siteId: fresh.site.id,
      slug,
      name: (e.h1 || e.title || (slug ? slug : 'Home')).slice(0, 60),
      status: 'published',
      ...(slug ? { source: f.url.slice(0, 500) } : {}),
      seo: { title, description: (e.description || e.blocks.find((b) => b.kind === 'p')?.text || title).slice(0, 170) },
      body: twin?.body ?? fresh.pages.find((p) => p.slug === '')!.body,
      ...(copies[i].faithful ? { classic: { html: copies[i].html } } : {}),
      updatedAt: now,
    })
    const from = f.from.replace(/\/+$/, '') || '/'
    if (from !== (slug ? `/${slug}` : '/')) redirects.push({ from, to: slug ? `/${slug}` : '/', status: 301 })
  })
  // Their menu, for the pages SaySites adds itself (privacy, a blog).
  const site: Site = structuredClone(fresh.site)
  return { site, pages, redirects, ok: copies.length > 0 && reasons.length === 0, reasons }
}

// ---------------------------------------------------------------------------
// The redesign
// ---------------------------------------------------------------------------

interface Built {
  site: Site
  pages: Page[]
  redirects: Redirect[]
}

// A redesign worth showing has the business's own substance: at least
// three of their services, two of them written from their own pages.
// Otherwise it's mostly SaySites' general wording, which isn't better than
// their site, so it isn't offered.
export const REDESIGN_NEEDS = { services: 3, written: 2 }

const ABOUT = /(^|\/)(about|about-us|our-firm|the-firm|firm-overview|who-we-are|our-story|our-practice|why-choose-us)(\/|$)/i
const CONTACT = /(^|\/)(contact|contact-us|get-in-touch|locations?|directions|offices?)(\/|$)/i
const PEOPLE = /(^|\/)(attorneys?|lawyers?|our-team|team|staff|people|professionals|providers|doctors|our-attorneys|meet-the-team)(\/|$)/i
// Leftovers from a theme's demo content, not the business's pages.
const DEMO = /(^|\/)(home-?(dark|light|v|version|style|layout)?-?\d+|demo[\w-]*|sample-page|hello-world|elementor-\d+|landing-?\d+|test(-page)?|coming-soon|maintenance)(\/|$)/i
const NOT_SERVICE_PAGE = /(^|\/)(blog|news|articles?|faqs?|privacy|terms|disclaimer|sitemap|testimonials?|reviews?|results|case-results|verdicts|careers?|jobs|resources|links|useful-links|payments?|pay|portal|login|forms|videos?|gallery|press|media|events?|referrals?|espanol|es|thank-you|search)(\/|$)/i
const PERSON = /^(?:(?:dr|mr|ms|mrs)\.?\s)?[A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]*\.?){1,3}(?:,\s*(?:Esq|Jr|Sr|III|II|MD|DDS|PA|J\.D)\.?)?$/

const sentences = (s: string, max: number) => {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '))
  return end > max * 0.4 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '').replace(/[\s,;:]+$/, '') + '…'
}
// "FAMILY LAW LAWYER NEAR WELLINGTON, FL" → "Family law".
export const tidyName = (s: string) => {
  let out = decode(s).replace(/\s+/g, ' ').trim().replace(/\s+[|\-–—]\s.*$/, '')
  out = out.replace(/\s+(?:in|near|serving|for)\s+[\w.'’ -]+,\s*(?:[A-Z]{2}|[A-Za-z]+(?:\s[A-Za-z]+)?)$/i, '').replace(/\s+(?:lawyers?|attorneys?|law firm|law office|services?|specialists?)$/i, '').trim()
  // Sentence case, as the designs set every heading ("Estate planning"),
  // keeping states, acronyms and names that are proper nouns.
  const proper = new Set(Object.values(STATES).flatMap((v) => v.split(' ')))
  out = out
    .split(/\s+/)
    .map((w, i) => (i === 0 ? (w === w.toUpperCase() && w.length > 4 ? w.charAt(0) + w.slice(1).toLowerCase() : w) : proper.has(w) || (/^[A-Z]{2,4}$/.test(w) && !/^(LAW|AND|THE|FOR|OF)$/.test(w)) || /^(I|I'm|DUI|DWI|SSDI|LLC|PA|P\.A\.)$/.test(w) ? w : w.toLowerCase()))
    .join(' ')
  return out.replace(/[:.,;]+$/, '').trim()
}

// A service's page, in their words: the opening paragraph, then each of
// their headings with what follows it; their questions become the FAQ.
export function writtenFrom(name: string, e: Extracted): WrittenService | undefined {
  // Breadcrumbs ("Home » Practice Areas » …") aren't their words.
  const blocks = e.blocks.filter((b) => b.text.trim() && !/^home\s*[»›>/|]/i.test(b.text.trim()) && !/\s[»›>]\s.*\s[»›>]\s/.test(b.text) && !/^[^.!?]{0,80}\s[»›>]\s[^.!?]{0,80}$/.test(b.text))
  const firstP = blocks.findIndex((b) => b.kind === 'p' && b.text.length >= 60)
  if (firstP < 0) return undefined
  const intro: string[] = [blocks[firstP].text]
  const sections: WrittenService['sections'] = []
  const faq: WrittenService['faq'] = []
  let cur: { heading: string; body: string[]; q: boolean } | undefined
  const close = () => {
    if (!cur) return
    const body = cur.body.join('\n\n').trim()
    if (body) {
      if (cur.q && faq.length < 8) faq.push({ q: cur.heading.slice(0, 300), a: body.slice(0, 3000) })
      else if (!cur.q && sections.length < 8) sections.push({ heading: cur.heading.slice(0, 160), body: body.slice(0, 4000) })
    }
    cur = undefined
  }
  for (const b of blocks.slice(firstP + 1)) {
    if (b.kind === 'h2' || b.kind === 'h3') {
      close()
      cur = { heading: b.text, body: [], q: /\?\s*$/.test(b.text) }
    } else {
      const text = b.kind === 'li' ? `• ${b.text}` : b.text
      if (cur) cur.body.push(text)
      else if (intro.length < 3 && b.kind === 'p') intro.push(text)
    }
  }
  close()
  return { name, summary: sentences(intro[0], 190), intro: intro.join('\n\n').slice(0, 3000), sections, faq }
}

// Their name: of the names the site gives itself (its structured data, site
// name, the parts of its title, its logo's description), the one that
// matches its web address ("piastawalker.com" → "Piasta Walker Hagenbush"),
// not an SEO phrase like "Atlanta Personal Injury Lawyers".
export function businessName(detected: string, html: string, url: string): string {
  const clean = (s: string) => decode(s).replace(/^welcome to (the )?/i, '').replace(/\s+/g, ' ').trim()
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '').split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  } catch {}
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
  const text = decode(html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ')
  const copyright = [...text.matchAll(/©\s*(?:\d{4}\s*(?:[-–]\s*\d{4}\s*)?)?(?:by\s+)?([A-Z][^|©]{2,60}?)(?=\s*(?:\||[-–—]\s|All rights|\.\s|\.?$|Privacy|Disclaimer|Site))/g)].map((m) => m[1])
  const ld = [...html.matchAll(/"@type"\s*:\s*"(?:WebSite|Organization|LegalService|Attorney|LocalBusiness|ProfessionalService)"[^{}]*?"name"\s*:\s*"([^"]{3,80})"/g)].map((m) => m[1].replace(/\\u0026/g, '&'))
  const split = (c: string) => clean(c).split(/\s+[|\-–—:]\s+/)
  // Where each name came from, most trusted first: what the site says it
  // is called, its structured data, its copyright line, its title.
  const sources: [string, number][] = [...split(detected).slice(0, 1).map((c) => [c, 0] as [string, number]), ...ld.map((c) => [clean(c), 1] as [string, number]), ...copyright.map((c) => [clean(c), 2] as [string, number]), ...split(title).map((c) => [c, 3] as [string, number])]
  const seen = new Map<string, number>()
  for (const [raw, rank] of sources) {
    // "Smith Law, P.A" (cut at the sentence's end) keeps its last period.
    const c = raw.replace(/[,\s]+$/, '').replace(/\b(P\.A|P\.C|L\.L\.C|L\.L\.P|S\.C|Inc|Co|Ltd)$/, '$1.')
    if (c.length >= 3 && c.length <= 70 && !seen.has(c)) seen.set(c, rank)
  }
  // "Chicago Divorce Lawyer" is what they want to rank for, not who they
  // are; neither is a list of practice areas. A firm's name is a person's or
  // brand's, often with "& Partner" or "P.A.".
  const suffix = /\b(llc|pllc|llp|p\.?\s?a\.?|p\.?\s?c\.?|s\.?c\.?|inc|ltd|law (office|offices|group|firm|center)s?( of)?|attorneys at law)\b/i
  const marker = /\b(lawyers?|attorneys?|law firm|near me|best|top)\b/i
  const areas = (c: string) => (c.match(new RegExp(SERVICE_WORDS.lawyer?.source ?? '$^', 'gi')) ?? []).length
  const seo = (c: string) => (marker.test(c) && !suffix.test(c)) || (areas(c) >= 2 && /,|&/.test(c) && !suffix.test(c))
  const generic = /^(law|laws|lawyer|lawyers|attorney|attorneys|firm|office|offices|group|the|and|llc|pllc|inc|legal|injury|personal|accident|estate|probate|trust|family|criminal|defense|elder|divorce|immigration|bankruptcy|business|tax)$/
  const hits = (c: string) => c.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !generic.test(w) && host.includes(w)).length
  // A name with its address's words in it, trimmed of a keyword tail
  // ("Darrell Cochran Personal Injury Lawyer" → "Darrell Cochran").
  const trimmed = (c: string) => (seo(c) ? c.replace(/(\s+(?:personal|injury|accident|car|truck|divorce|family|criminal|defense|estate|planning|probate|immigration|bankruptcy|employment|dui|dwi|elder|trial|business|workers|compensation|medical|malpractice|real|tax))*\s+(?:lawyers?|attorneys?|law firm)$/i, '').trim() : c)
  const names = [...seen].map(([c, rank]) => ({ c: trimmed(c), rank, cut: trimmed(c) !== c })).filter((x) => x.c.length >= 3 && !seo(x.c) && (!x.cut || x.c.split(/\s+/).length >= 2))
  const best = names.sort((a, b) => hits(b.c) - hits(a.c) || a.rank - b.rank || b.c.length - a.c.length)[0]
  if (best && (hits(best.c) > 0 || best.rank === 0)) return best.c
  return names.find((x) => suffix.test(x.c) || /&/.test(x.c))?.c ?? best?.c ?? (split(detected)[0] || detected)
}

const STATES: Record<string, string> = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' }

// The town their pages name most often as "Town, ST" (or "Town, State").
// "Christopher P. Taylor, PA" is a firm, not Taylor, Pennsylvania: a
// "town" that's part of their name, before PA, doesn't count.
export function placeFromText(text: string, name = ''): { city: string; region: string } | null {
  const count = new Map<string, number>()
  const byName = Object.fromEntries(Object.entries(STATES).map(([k, v]) => [v.toLowerCase(), k]))
  const re = /\b((?:[A-Z][a-z]+\.?\s){0,2}[A-Z][a-z]+),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g
  for (const m of text.matchAll(re)) {
    const st = STATES[m[2]] ? m[2] : byName[m[2].toLowerCase()]
    if (!st) continue
    const city = m[1].replace(/^(?:In|Near|Of|Serving|From|And|The|Our|Located|Offices?|Floor|Suite|Ste|Unit|Level|Building)\s+/, '')
    if (!city || STATES[city.toUpperCase()] || byName[city.toLowerCase()] || /^(Suite|Inc|LLC|Street|Avenue|Road|Blvd|Drive|Lawyer|Attorney|Law)$/i.test(city)) continue
    if (st === 'PA' && name.toLowerCase().split(/[^a-z]+/).includes(city.toLowerCase())) continue
    const k = `${city}|${st}`
    count.set(k, (count.get(k) ?? 0) + 1)
  }
  const best = [...count].sort((a, b) => b[1] - a[1])[0]
  if (!best) return null
  const [city, region] = best[0].split('|')
  return { city, region }
}

type BytesFetcher = (url: string) => Promise<{ type: string; data: Buffer } | null>

function redesign(pages: (ImportedPage & { html: string })[], d: Detected, id: string, assets: SiteAssets): Built & { ready: boolean } {
  const home = pages.find((p) => p.from === '/')
  const rest = pages.filter((p) => p !== home && !DEMO.test(p.from))
  const kind = (p: ImportedPage) => (CONTACT.test(p.from) ? 'contact' : ABOUT.test(p.from) ? 'about' : PEOPLE.test(p.from) ? 'people' : NOT_SERVICE_PAGE.test(p.from) ? 'other' : 'service')
  const named = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  // Their services, in their own words: the links under their menu's
  // "Practice Areas" (or "Services") heading; without one, the menu's links
  // that read like this kind of business's services. Each is written from
  // its own page when we read it. Locations, people, news and the like are
  // never services.
  const menu = home ? menuTree(home.html, home.url) : []
  const group = menu.find((m) => SERVICE_GROUP.test(m.label) && m.children.length >= 2)
  const sounds = (label: string) => SERVICE_WORDS[d.type]?.test(label) ?? false
  const candidates = group ? group.children : menu.filter((m) => sounds(m.label)).flatMap((m) => [m, ...m.children.filter((c) => sounds(c.label))])
  const services: { name: string; page?: ImportedPage; written?: WrittenService }[] = []
  for (const m of candidates) {
    const name = tidyName(m.label)
    if (!name || name.length < 3 || name.length > 50 || /["<>=]|^(all|view|see|more|overview|learn)\b/i.test(name) || NOT_SERVICE.test(name) || SERVICE_GROUP.test(name) || /espa[nñ]ol|spanish/i.test(name)) continue
    if (named(name) === named(d.name) || services.some((x) => named(x.name) === named(name)) || (!group && PERSON.test(m.label.trim()) && !sounds(name))) continue
    const page = rest.find((p) => (p.from.replace(/\/+$/, '') || '/') === m.path && kind(p) !== 'people')
    services.push({ name, page, written: page ? writtenFrom(name, page.extracted) : undefined })
    if (services.length >= 12) break
  }
  const names = services.map((x) => x.name).slice(0, 8)
  // About the business, from their about page (or the home page's longest
  // paragraphs).
  const aboutPage = rest.find((p) => kind(p) === 'about')
  const aboutParas = (aboutPage ?? home)?.extracted.blocks.filter((b) => b.kind === 'p' && b.text.length >= 80).map((b) => b.text).slice(0, 3) ?? []
  const about = aboutParas.length ? { heading: aboutPage ? tidyName(aboutPage.extracted.h1 || 'About us') || 'About us' : `About ${d.name}`, paragraphs: aboutParas.map((t) => t.slice(0, 1200)) } : undefined
  // The people, from their own pages about them.
  const team: Attorney[] = rest
    .filter((p) => kind(p) === 'people' && p.from.split('/').filter(Boolean).length >= 2 && PERSON.test((p.extracted.h1 || '').trim()))
    .slice(0, 8)
    .map((p) => ({ name: p.extracted.h1.trim(), role: d.type === 'lawyer' ? 'Attorney' : d.type === 'doctor' ? 'Provider' : 'Team', bio: sentences(p.extracted.blocks.find((b) => b.kind === 'p' && b.text.length >= 60)?.text ?? '', 600) }))
    .filter((a) => a.bio)
  const homeH1 = home?.extracted.h1 ?? ''
  const headline = homeH1.length >= 12 && homeH1.length <= 90 && named(homeH1) !== named(d.name) ? (homeH1 === homeH1.toUpperCase() ? homeH1.charAt(0) + homeH1.slice(1).toLowerCase() : homeH1) : undefined
  const content: WrittenContent = { ...(about ? { about } : {}), services: services.map((s) => s.written).filter((w): w is WrittenService => !!w && names.some((n) => named(n) === named(w.name))) }
  // Their name (businessName), and their town from their own pages when
  // the home page didn't give it.
  const name = d.name
  const place = d.city ? { city: d.city, region: d.region ?? '' } : placeFromText(pages.map((p) => `${p.extracted.title} ${p.extracted.h1} ${p.extracted.blocks.map((b) => b.text).join(' ')}`).join(' '), d.name)
  // "+15617928551" reads as "(561) 792-8551".
  const digits = (d.phone ?? '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  const phone = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : d.phone
  const sub = `preview-${id}`
  const pro = d.type === 'lawyer' || d.type === 'doctor' || d.type === 'medspa'
  const lawStyle: LawStyle = pro ? lawStyleFor(subdomainFor(name)) : LAW_STYLES[0]
  const built = buildStarterSite(
    {
      name,
      type: d.type,
      city: place?.city ?? 'your area',
      region: place?.region ?? '',
      phone,
      email: d.email,
      street: d.street,
      postalCode: d.postalCode,
      hours: d.hours,
      services: names,
      palette: d.palette,
      content,
      ...(pro ? { lawStyle } : {}),
      ...(team.length ? { team } : {}),
      ...(headline ? { headline } : {}),
      ...(d.sameAs?.length ? { socials: d.sameAs } : {}),
    },
    'org_preview',
    sub
  )
  if (!place) built.site.business.area = undefined
  // Every other page they have, with its words, in the same design; old
  // addresses of pages the design already has point at them.
  const svcPrefix = built.pages.find((p) => p.slug.includes('/') && !p.slug.startsWith('blog/'))?.slug.split('/')[0]
  const redirects: Redirect[] = []
  const covered = new Map<ImportedPage, string>()
  for (const s of services) {
    const slug = svcPrefix ? `${svcPrefix}/${serviceSlug(s.name)}` : ''
    if (s.page && slug && built.pages.some((p) => p.slug === slug)) covered.set(s.page, `/${slug}`)
  }
  for (const p of rest) {
    if (covered.has(p)) continue
    if (kind(p) === 'contact' && built.pages.some((x) => x.slug === 'contact')) covered.set(p, '/contact')
    const teamPage = built.pages.find((x) => /^(attorneys|providers|our-team)$/.test(x.slug))
    if (kind(p) === 'people' && teamPage && team.some((a) => a.name === p.extracted.h1.trim())) covered.set(p, `/${teamPage.slug}`)
  }
  for (const [p, to] of covered) {
    const from = p.from.replace(/\/+$/, '') || '/'
    if (from !== to) redirects.push({ from, to, status: 301 })
  }
  const plan = planImport(built.site, built.pages, rest.filter((p) => !covered.has(p)).map((p) => ({ from: p.from, url: p.url, extracted: p.extracted })))
  const pagesOut = [...built.pages, ...plan.pages.map((p) => ({ ...p, status: 'published' as const }))]
  const ready = names.length >= REDESIGN_NEEDS.services && (content.services?.length ?? 0) >= REDESIGN_NEEDS.written
  // Every page in one of our hand-made designs, around their own photos,
  // people, results, reviews and awards.
  const firmPages = dress(built.site, pagesOut, { home, rest, aboutPage, team, written: content.services ?? [], headline, phone, place, d, assets, menu })
  return { site: built.site, pages: firmPages, redirects: [...redirects, ...plan.redirects.filter((r) => !redirects.some((x) => x.from === r.from))], ready }
}

// What kind of practice, in a few words, from their services.
function practiceKind(type: string, services: string[]): string {
  if (type !== 'lawyer') return ({ doctor: 'Medical practice', medspa: 'Med spa', dentist: 'Dental practice' } as Record<string, string>)[type] ?? 'Local business'
  const kinds: [RegExp, string][] = [
    [/injur|accident|wrongful|malpractice|truck|motorcycle|slip|premises/, 'Personal injury lawyers'],
    [/criminal|dui|dwi|drug|theft|assault|felony|misdemeanor|domestic violence|sex crime/, 'Criminal defense'],
    [/divorce|custody|family|alimony|child support|adoption/, 'Family law'],
    [/estate|probate|will|trust|guardianship|elder/, 'Estate planning & probate'],
    [/bankrupt|chapter 7|chapter 13|debt/, 'Bankruptcy lawyers'],
    [/immigra|visa|green card|citizenship|asylum/, 'Immigration lawyers'],
    [/employ|discriminat|wage|harass|wrongful termination/, 'Employment lawyers'],
    [/business|corporate|contract|real estate/, 'Business & real estate law'],
  ]
  const hits = kinds.map(([re, label]) => ({ label, n: services.filter((s) => re.test(s.toLowerCase())).length })).sort((a, b) => b.n - a.n)
  return hits[0].n >= Math.max(1, services.length * 0.4) ? hits[0].label : 'Attorneys at law'
}

// A photo of theirs about a service ("motorcycle-accident.jpg" for
// Motorcycle Accidents), when one fits.
const GENERIC = new Set(['law', 'laws', 'lawyer', 'lawyers', 'legal', 'attorney', 'attorneys', 'accident', 'accidents', 'injury', 'injuries', 'case', 'cases', 'claims', 'defense', 'services', 'planning', 'and', 'the', 'for'])
function photoFor(name: string, photos: SitePhoto[], used: Set<string>): SitePhoto | undefined {
  const words = name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !GENERIC.has(w)).map((w) => w.replace(/(ies|s)$/, ''))
  if (!words.length) return undefined
  return photos.find((p) => !used.has(p.src) && words.every((w) => `${p.src} ${p.alt}`.toLowerCase().includes(w)))
}

const nameLike = (headline: string, name: string) => {
  const last = name.replace(/,?\s+(p\.?a\.?|l\.?l\.?c\.?|p\.?l\.?l\.?c\.?|l\.?l\.?p\.?|p\.?c\.?)\.?$/i, '').trim().split(/\s+/).pop()?.toLowerCase() ?? ''
  return !!last && headline.toLowerCase().includes(last) && !/lawyer|attorney|injury|defen|divorce|family|estate|probate|criminal|accident/i.test(headline)
}
const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

interface DressInput {
  home?: ImportedPage & { html: string }
  rest: (ImportedPage & { html: string })[]
  aboutPage?: ImportedPage
  team: Attorney[]
  written: WrittenService[]
  headline?: string
  phone?: string
  place: { city: string; region: string } | null
  d: Detected
  assets: SiteAssets
  menu: (MenuLink & { children: MenuLink[] })[]
}

// Our own designs for every page (lib/redesign-design), stored like kept
// pages so their look is exactly as made. The page bodies stay as they were
// built, so moving a page to the SaySites design keeps its words.
function dress(site: Site, pages: Page[], x: DressInput): Page[] {
  const { d, assets } = x
  const path = (p: Page) => (p.slug ? `/${p.slug}` : '/')
  const svcPages = pages.filter((p) => /^(practice-areas|services|treatments)\/[^/]+$/.test(p.slug))
  const used = new Set<string>()
  // The hero: a wide photo of them (their banner or a group photo) first.
  // Their banner when it shows people, else a photo of them, else their
  // banner anyway; never a photo with words baked in.
  const usable = assets.photos.filter((p) => !/^(get help|file a claim|call|contact|free|click|learn|read)/i.test(p.alt))
  const banner = usable.find((p) => isWide(p) && p.width >= 1000 && p.people) ?? usable.find((p) => p.banner && isWide(p))
  const ofThem = usable.find((p) => p.people && !isWide(p) && (p.width >= 500 || !p.width))
  const lead = assets.portraits.find((p) => p.home)
  const hero = banner ?? ofThem ?? (lead ? { src: lead.src, alt: lead.name, people: true, width: 800, height: 1000, score: 0 } : undefined)
  if (hero) used.add(hero.src)
  const lone = assets.portraits.length === 1 ? { src: assets.portraits[0].src, alt: assets.portraits[0].name, people: true, width: 800, height: 1000, score: 0 } : undefined
  const portrait = usable.find((p) => p.people && !used.has(p.src) && p.width >= 500) ?? lone
  if (portrait) used.add(portrait.src)
  const services = svcPages.map((p) => {
    const w = x.written.find((s) => serviceSlug(s.name) === p.slug.split('/')[1])
    const name = w?.name ?? p.name
    const photo = photoFor(name, usable, used)
    if (photo) used.add(photo.src)
    return { name, href: path(p), summary: w?.summary ?? '', ...(photo ? { photo } : {}) }
  })
  // A sentence on every page of theirs ("30+ years of experience…") says
  // nothing about any one service.
  for (const s of services) if (s.summary && services.filter((o) => o.summary === s.summary).length > 1) s.summary = ''
  const teamPage = pages.find((p) => /^(attorneys|providers|our-team)$/.test(p.slug))
  const named = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ' ').replace(/\b(esq|esquire|jr|sr|iii|ii)\b/g, '').trim()
  const team: ShowcaseFirm['team'] = []
  for (const a of x.team) {
    const pic = assets.portraits.find((p) => named(p.name) === named(a.name) || (named(a.name).split(' ').pop() === named(p.name).split(' ').pop() && named(a.name)[0] === named(p.name)[0]))
    team.push({ name: a.name, role: a.role, ...(teamPage ? { href: path(teamPage) } : {}), ...(pic ? { photo: pic.src } : {}) })
  }
  for (const p of assets.portraits) if (!team.some((t) => named(t.name) === named(p.name) || named(t.name).split(' ').pop() === named(p.name).split(' ').pop())) team.push({ name: p.name, role: p.role ?? (d.type === 'lawyer' ? 'Attorney' : 'Team'), ...(teamPage ? { href: path(teamPage) } : {}), photo: p.src })
  for (const t of team) {
    const role = assets.portraits.find((p) => p.src === t.photo)?.role
    if (role) t.role = role
  }
  const homeText = x.home ? textOf(parseHtml(x.home.html)) : ''
  const desc = x.home?.extracted.description ?? ''
  const aboutPg = pages.find((p) => p.slug === 'about')
  // Their own description of the firm, without calls to action.
  const aboutParas = (x.aboutPage ?? x.home)?.extracted.blocks.filter((b) => b.kind === 'p' && b.text.length >= 80 && !/^(contact|call|reach out|schedule|get in touch|click)\b|\b(call|contact) (us|our firm) today\b/i.test(b.text)).map((b) => b.text) ?? []
  const lede = desc.length >= 60 && desc.length <= 260 && !/\||»|›/.test(desc) ? desc : aboutParas[0]
  const kind = practiceKind(d.type, services.map((s) => s.name))
  const h = hashOf(d.name)
  // Their menu's own pages (Case Results, Testimonials, Blog) beside ours.
  const nav: ShowcaseFirm['nav'] = site.nav.filter((n) => n.href !== '/' && !/contact/i.test(n.href)).map((n) => ({ label: n.label, href: n.href, ...(n.children?.length ? { children: n.children } : {}) }))
  const add = (label: string, href: string) => {
    if (nav.length < 6 && !nav.some((n) => n.href === href || n.label.toLowerCase() === label.toLowerCase())) nav.push({ label, href })
  }
  if (aboutPg) add('About', path(aboutPg))
  if (teamPage) add(teamPage.name.length <= 20 ? teamPage.name : 'Attorneys', path(teamPage))
  for (const m of x.menu) {
    const pg = pages.find((p) => p.source && (new URL(p.source).pathname.replace(/\/+$/, '') || '/') === m.path)
    // "AboutThe firm": a menu label with a second line run into it.
    const label = tidyName(m.label.split(/(?<=[a-z])(?=[A-Z])/)[0])
    if (pg && !svcPages.includes(pg) && label.length <= 22) add(label || pg.name, path(pg))
  }
  if (assets.results.length >= 2 && !nav.some((n) => /result|verdict|settlement/i.test(n.label))) add('Results', '/#results')
  if (assets.reviews.length && !nav.some((n) => /review|testimonial/i.test(n.label))) add('Reviews', '/#reviews')
  const contactPg = pages.find((p) => p.slug === 'contact')
  nav.push({ label: 'Contact', href: contactPg ? path(contactPg) : '/#talk' })
  // "Top Personal Injury Attorneys In Atlanta, Georgia" reads better as a
  // sentence; places and names keep their capitals.
  const keep = new Set([...`${x.place?.city ?? ''} ${x.place?.region ?? ''} ${STATES[x.place?.region ?? ''] ?? ''} ${d.name}`.split(/[\s,]+/).filter(Boolean).map((w) => w.toLowerCase())])
  const titleCased = (s: string) => s.split(/\s+/).filter((w) => /^[a-z]/i.test(w)).every((w) => /^[A-Z]/.test(w) || /^(of|in|and|the|for|a|an|to|at|on|by|with|near|from|your|our|you|&)$/.test(w))
  const sentence = (s: string) => (titleCased(s) ? s.split(/\s+/).map((w, i) => (i === 0 || keep.has(w.replace(/[^a-z]/gi, '').toLowerCase()) || /^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ') : s)
  const firm: ShowcaseFirm = {
    look: LOOKS[h % LOOKS.length],
    pairing: (h >>> 4) % 2,
    name: d.name,
    kind,
    // Their name isn't a headline ("Law Offices of Christopher P. Taylor").
    headline: sentence(x.headline && !nameLike(x.headline, d.name) ? x.headline : `${kind}${x.place?.city ? ` in ${x.place.city}` : ''}`),
    ...(lede ? { lede } : {}),
    ...(x.phone ? { phone: x.phone } : {}),
    ...(d.email ? { email: d.email } : {}),
    ...(d.street ? { street: d.street } : {}),
    ...(x.place?.city ? { city: x.place.city } : {}),
    ...(x.place?.region ? { region: x.place.region } : {}),
    ...(d.postalCode ? { postalCode: d.postalCode } : {}),
    ...(d.hours?.length ? { hours: d.hours } : {}),
    freeConsult: /free (initial |case |legal )?(consultation|case review|case evaluation|evaluation)/i.test(homeText),
    ...(d.color ? { brand: d.color } : {}),
    nav,
    services,
    ...(aboutParas.length ? { about: { heading: x.aboutPage?.extracted.h1 && x.aboutPage.extracted.h1.length < 70 ? tidyName(x.aboutPage.extracted.h1) || `About ${d.name}` : `About ${d.name}`, paragraphs: aboutParas.slice(0, 2), ...(aboutPg ? { href: path(aboutPg) } : {}) } } : {}),
    team,
    ...(hero ? { hero } : {}),
    ...(portrait ? { portrait } : {}),
    assets,
    formAction: '/__form',
    schemaType: site.business.schemaType,
  }
  const bySource = new Map(x.rest.map((p) => [p.url.slice(0, 500), p]))
  return pages.map((pg) => {
    let html: string | undefined
    if (pg.slug === '') html = showcaseHome(firm)
    else {
      const w = x.written.find((s) => serviceSlug(s.name) === pg.slug.split('/')[1] && /^(practice-areas|services|treatments)\//.test(pg.slug))
      const src = pg.source ? bySource.get(pg.source) : undefined
      let page: ShowcasePage | undefined
      if (w) {
        const svc = services.find((s) => s.href === path(pg))
        page = { path: path(pg), kicker: 'Practice areas', title: w.name, intro: w.intro, blocks: w.sections.flatMap((s) => [{ kind: 'h2' as const, text: s.heading }, ...s.body.split(/\n\n+/).map((t) => ({ kind: 'p' as const, text: t }))]), faq: w.faq, ...(svc?.photo ? { photo: svc.photo } : {}) }
      } else if (/^(practice-areas|services|treatments)$/.test(pg.slug)) {
        page = { path: path(pg), kicker: 'Practice areas', title: pg.name, intro: lede, blocks: services.flatMap((s) => [{ kind: 'h2' as const, text: s.name }, ...(s.summary ? [{ kind: 'p' as const, text: s.summary }] : [])]) }
      } else if (pg.slug === 'about') {
        const e = x.aboutPage?.extracted
        page = { path: path(pg), kicker: 'About', title: firm.about?.heading ?? `About ${d.name}`, blocks: e ? e.blocks : aboutParas.map((t) => ({ kind: 'p' as const, text: t })), ...(portrait ? { photo: portrait } : {}) }
      } else if (teamPage && pg === teamPage) {
        page = { path: path(pg), kicker: 'Attorneys', title: pg.name, blocks: x.team.flatMap((a) => [{ kind: 'h2' as const, text: a.name }, { kind: 'p' as const, text: a.bio }]), people: team }
      } else if (pg.slug === 'contact') {
        page = { path: path(pg), kicker: 'Contact', title: pg.name, intro: lede, blocks: [], contact: true }
      } else if (src) {
        const e = src.extracted
        page = { path: path(pg), kicker: pg.name, title: e.h1 || pg.name, blocks: e.blocks.filter((b) => b.text.length > 1).slice(0, 120) }
      }
      if (page) html = showcasePage(firm, page)
    }
    return html ? { ...pg, classic: { html, design: true as const } } : pg
  })
}

const SKIP_MENU = /\/(wp-admin|wp-content|feed|tag|category|author|cart|checkout|my-account|login)(\/|$)/i

// Menu words that are never a service.
const NOT_SERVICE = /^(home|about|about us|our (team|firm|story)|team|contact|contact us|blog|news|faq|faqs|careers?|jobs|privacy|terms|sitemap|site map|login|log in|sign in|sign up|register|account|my account|cart|checkout|search|links?|locations?|directions|forms?|resources|testimonials|reviews|partners|affiliations|gallery|photos|menu|more|pay|payments?|portal|client login|email|call|phone)$|rates?$|prices?$|pricing|calculator|deadlines|login|log in|portal|e-?filing|beta/i

// A menu heading over the business's services.
const SERVICE_GROUP = /^(our )?(practice areas?|areas of practice|practice|legal services|services|our services|what we do|cases we handle|treatments|procedures|specialties|specialities|solutions)\b/i
// What services sound like, by kind of business, for menus without a
// services heading.
const SERVICE_WORDS: Partial<Record<string, RegExp>> = {
  lawyer: /injur|accident|wreck|crash|divorce|custody|support|alimony|family|estate|probate|trust|wills?\b|guardianship|elder|criminal|dui|dwi|defen[cs]e|bankruptcy|immigration|employment|workers|malpractice|wrongful|real estate|business|tax|adoption|appeal|litigation|disability|ssdi|landlord|tenant|discrimination|harassment|traffic|felony|misdemeanor|drug|assault|theft|corporate|contract|intellectual|patent|trademark|mediation|planning|liability|negligence|claims?\b|bites?\b|slip|premises|product|medical|nursing|brain|spinal|burn|truck|motorcycle|pedestrian|bicycle|boat|uber|lyft|death|abuse|domestic|violence|expunge|record|visa|green card|citizenship|asylum|deportation|removal|daca|guardian/i,
}

// The home page's main menu as it is nested: top-level entries with the
// links in their dropdowns.
type MenuLink = { label: string; path: string; href: string }
export function menuTree(html: string, base: string): (MenuLink & { children: MenuLink[] })[] {
  const root = parseHtml(html)
  const { body, header, footers } = regions(root)
  const host = new URL(base).hostname.replace(/^www\./, '')
  // The link's page (path, without a trailing slash) and its exact address.
  const linkOf = (a: El): { path: string; href: string } | undefined => {
    try {
      const u = new URL(decode(a.attrs.href ?? ''), base)
      u.hash = ''
      u.search = ''
      return u.hostname.replace(/^www\./, '') === host && /^https?:$/.test(u.protocol) ? { path: u.pathname.replace(/\/+$/, '') || '/', href: u.href } : undefined
    } catch {
      return undefined
    }
  }
  const words = (e: El) => textOf(e, (x) => x.tag === 'ul' || /hidden|sr-only|screen-reader/i.test(x.attrs.class ?? '')).replace(/\s+/g, ' ').replace(/[>»›▾▼]+\s*$/, '').trim()
  // The main menu: the menu list (in the header when we can tell where that
  // is, never in the footer) with the most entries.
  const where = (e: El) => `${e.tag} ${e.attrs.class ?? ''} ${e.attrs.id ?? ''} ${e.attrs.role ?? ''}`
  const inFooter = (e: El) => footers.some((f) => f === e || ancestors(e).includes(f)) || ancestors(e).some((a) => /footer/i.test(where(a)))
  const entries = (ul: El) => ul.children.filter(isEl).filter((li) => li.tag === 'li' && findAll(li, (x) => x.tag === 'a').length).length
  const menuLists = (within: El, anyList: boolean) => findAll(within, (e) => e.tag === 'ul' && !ancestors(e).some((x) => x.tag === 'li') && !inFooter(e) && (anyList || /menu|nav/i.test([e, ...ancestors(e).slice(0, 3)].map(where).join(' '))) && entries(e) >= 2)
  // The header's lists first; a header holding only the logo and phone
  // means the menu sits elsewhere at the top.
  const lists = header && menuLists(header, true).length ? menuLists(header, true) : menuLists(body, false)
  const main = lists.sort((x, y) => entries(y) - entries(x))[0]
  // A menu that's just links, without a list.
  const entry = (a: El): MenuLink => ({ label: words(a), path: linkOf(a)?.path ?? '', href: linkOf(a)?.href ?? '' })
  if (!main) return header ? findAll(header, (e) => e.tag === 'a').map((a) => ({ ...entry(a), children: [] })).filter((m) => m.label && m.path) : []
  const out: (MenuLink & { children: MenuLink[] })[] = []
  for (const li of main.children.filter(isEl).filter((c) => c.tag === 'li')) {
    const a = li.children.filter(isEl).find((c) => c.tag === 'a') ?? findAll(li, (e) => e.tag === 'a')[0]
    const label = a ? words(a) : words(li)
    const children = findAll(li, (e) => e.tag === 'a' && e !== a).map(entry).filter((c) => c.label && c.path)
    if (label) out.push({ ...(a ? entry(a) : { path: '', href: '' }), label, children })
  }
  return out
}

// The pages linked from the home page's main menu: top-level entries
// first, then the pages in their dropdowns.
function menuPaths(html: string, base: string): URL[] {
  const tree = menuTree(html, base)
  // The services' own pages before other dropdowns (team bios, resources),
  // so the redesign can be written from them.
  const services = tree.filter((m) => SERVICE_GROUP.test(m.label))
  return [...tree, ...services.flatMap((m) => m.children), ...tree.filter((m) => !services.includes(m)).flatMap((m) => m.children)]
    .filter((m) => m.href && !/\.(jpe?g|png|pdf|webp)$/i.test(m.path))
    .map((m) => new URL(m.href))
}

// A preview made before the exact copy existed, rebuilt with the same id so
// its links (and an outreach email's) keep working. Never a claimed one.
const rebuilding = new Set<string>()
export async function rebuildPreview(id: string, url: string, get: Fetcher = safeFetch): Promise<boolean> {
  if (rebuilding.has(id)) return false
  rebuilding.add(id)
  try {
    const { getStore } = await import('./store')
    return await getStore().replacePreview(await buildPreview(url, get, id))
  } finally {
    rebuilding.delete(id)
  }
}

// Claiming: the preview becomes the owner's site. Imported pages start as
// drafts, as in a move, until the domain is switched over.
// The owner picks which version: their site as it is (the default) or the
// fresh redesign.
export function claimFromPreview(p: Preview, orgId: string, subdomain: string, version: 'as-is' | 'fresh' = 'as-is'): { site: Site; pages: Page[]; redirects: Redirect[] } {
  const from = (version === 'fresh' || !offersCopy(p)) && p.fresh ? p.fresh : p
  const siteId = `site_${randomUUID()}`
  const site: Site = { ...structuredClone(from.site), id: siteId, orgId, subdomain, updatedAt: new Date().toISOString() }
  const pages = from.pages.map((pg) => ({ ...structuredClone(pg), id: `page_${randomUUID()}`, siteId, status: pg.source ? ('draft' as const) : pg.status }))
  return { site, pages, redirects: from.redirects }
}
