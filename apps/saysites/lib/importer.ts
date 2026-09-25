// Moving an existing website onto SaySites. We read the owner's current site
// (its sitemap, or the links on its home page), pull the words out of each
// page, and plan SaySites pages that keep the same addresses wherever we can.
// Where an address has to change, a permanent (301) redirect sends the old
// one to the new page, so what Google already ranks isn't lost.
//
// Images aren't copied: the old site may go away, and hotlinked photos would
// break. Owners add their own photos afterwards, or ask Sofie.

import { lookup } from 'dns/promises'
import { isIP } from 'net'
import { randomUUID } from 'crypto'
import { Slug, type Container, type Element, type Page, type Redirect, type Site } from './schema'

export const MAX_IMPORT_PAGES = 40
const MAX_BYTES = 2_000_000
const UA = 'Mozilla/5.0 (compatible; SaySitesImporter/1.0; +https://saysites.com)'

export class ImportError extends Error {}

// ---------------------------------------------------------------------------
// Fetching, safely: only public http(s) hosts, never the private network.
// ---------------------------------------------------------------------------

function privateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true
    const m = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return m ? privateAddress(m[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new ImportError('Only http and https addresses can be imported.')
  if (url.username || url.password) throw new ImportError('That address includes a login, which we can’t use.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new ImportError('That address isn’t a public website.')
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => {
    throw new ImportError(`We couldn’t find ${host}. Check the address and try again.`)
  })
  if (addrs.some((a) => privateAddress(a.address))) throw new ImportError('That address isn’t a public website.')
}

export type Fetcher = (url: string) => Promise<{ url: string; status: number; type: string; body: string } | null>

// Follows up to 4 redirects itself, checking every hop.
export const safeFetch: Fetcher = async (start) => {
  let url = new URL(start)
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url)
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(10000) }).catch(() => null)
    if (!res) return null
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      continue
    }
    const reader = res.body?.getReader()
    if (!reader) return { url: url.href, status: res.status, type: res.headers.get('content-type') ?? '', body: '' }
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel()
        break
      }
      chunks.push(value)
    }
    return { url: url.href, status: res.status, type: res.headers.get('content-type') ?? '', body: Buffer.concat(chunks).toString('utf8') }
  }
  return null
}

// ---------------------------------------------------------------------------
// Finding the pages
// ---------------------------------------------------------------------------

const SKIP = /\/(wp-admin|wp-json|wp-content|wp-includes|feed|tag|category|author|cart|checkout|my-account|login|search|cdn-cgi|[^/]*site-?map[^/]*|thank-?you|thanks)(\/|$)|\/(blog|news)\/?$|\/page\/\d+|\.(jpe?g|png|gif|webp|svg|pdf|docx?|xlsx?|zip|mp4|mp3|css|js|xml|txt|ico)$/i

export function normalizeStart(input: string): URL {
  const raw = input.trim()
  if (!raw) throw new ImportError('Enter the address of your current website.')
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    u.hash = ''
    u.search = ''
    return u
  } catch {
    throw new ImportError('That doesn’t look like a website address.')
  }
}

const sameSite = (a: URL, b: URL) => a.hostname.replace(/^www\./, '') === b.hostname.replace(/^www\./, '')

function keep(u: URL, origin: URL): boolean {
  return sameSite(u, origin) && !SKIP.test(u.pathname)
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/gi)].map((m) => decode(m[1].trim()))
}

export async function discover(start: URL, get: Fetcher): Promise<URL[]> {
  const found = new Map<string, URL>()
  const add = (href: string, base: URL) => {
    try {
      const u = new URL(href, base)
      u.hash = ''
      u.search = ''
      if (keep(u, start)) found.set(u.pathname.replace(/\/+$/, '') || '/', u)
    } catch {}
  }
  add(start.href, start)
  // The sitemap first: it's the site's own list of pages.
  const queue = [new URL('/sitemap.xml', start).href, new URL('/sitemap_index.xml', start).href, new URL('/wp-sitemap.xml', start).href]
  const seen = new Set<string>()
  while (queue.length && seen.size < 12 && found.size < MAX_IMPORT_PAGES) {
    const u = queue.shift()!
    if (seen.has(u)) continue
    seen.add(u)
    const res = await get(u)
    if (!res || res.status !== 200 || !/<(urlset|sitemapindex)/i.test(res.body)) continue
    if (/<sitemapindex/i.test(res.body)) {
      // Pages and posts before tags, authors and the like.
      const subs = locs(res.body).filter((l) => !/(tag|category|author|attachment|format)-?sitemap/i.test(l))
      queue.unshift(...subs.sort((a, b) => Number(/post/.test(a)) - Number(/post/.test(b))))
    } else for (const l of locs(res.body)) add(l, start)
  }
  // No sitemap: the links on the home page.
  if (found.size <= 1) {
    const home = await get(start.href)
    if (home?.body) for (const m of home.body.matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) add(decode(m[1]), new URL(home.url))
  }
  return [...found.values()].slice(0, MAX_IMPORT_PAGES)
}

// ---------------------------------------------------------------------------
// Reading a page
// ---------------------------------------------------------------------------

export interface Extracted {
  title: string
  description: string
  h1: string
  blocks: { kind: 'h2' | 'h3' | 'p' | 'li'; text: string }[]
}

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™' }
export function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''
    }
    return ENT[e.toLowerCase()] ?? m
  })
}

const clean = (html: string) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
const BOILER = /cookie|©|all rights reserved|privacy policy|skip to (main )?content|javascript|subscribe to our newsletter|^menu$|^search$|^share( this)?:?$/i

export function extract(html: string): Extracted {
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const meta = html.match(/<meta\s[^>]*name\s*=\s*["']description["'][^>]*>/i)?.[0] ?? ''
  const description = decode(meta.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? '').trim()
  // The main content: <main> when it holds the H1, else the body. Page
  // builders often put a hero, forms or badges above the H1, so reading
  // starts at the H1 when there is one.
  const main = html.match(/<main[\s>][\s\S]*<\/main>/i)?.[0]
  // Some themes put the page's own content outside <main>; trust <main> only
  // when it holds the H1.
  let body = main && /<h1[\s>]/i.test(main) ? main : (html.match(/<body[\s>][\s\S]*<\/body>/i)?.[0] ?? html)
  body = body.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template|iframe|form|nav|header|footer|aside|button|select|textarea)[\s>][\s\S]*?<\/\1>/gi, ' ')
  const h1m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h1 = clean(h1m?.[1] ?? '')
  const at = h1m && h1m.index !== undefined && body.includes(h1m[0]) ? body.indexOf(h1m[0]) + h1m[0].length : 0
  // Block by block: headings, list items, and any run of text between block
  // tags (so text that sits loose in a <div> is kept too).
  const marked = body
    .slice(at)
    .replace(/<h([2-6])[^>]*>/gi, (_m, n: string) => `\n@@H${Number(n) === 2 ? 2 : 3}@@`)
    .replace(/<\/h[2-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n@@LI@@')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|section|ul|ol|li|table|tr|td|th|article|blockquote|dl|dt|dd|figure|figcaption|main|span class=["'][^"']*title[^"']*["'])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  const blocks: Extracted['blocks'] = []
  const seen = new Set<string>()
  for (const line of marked.split('\n')) {
    const tag = line.match(/^\s*@@(H2|H3|LI)@@/)?.[1]
    const text = decode(line.replace(/@@(H2|H3|LI)@@/g, '')).replace(/\s+/g, ' ').trim()
    if (!text || seen.has(text) || BOILER.test(text) || /^(https?:\/\/\S+\s*)+$/.test(text)) continue
    const kind = tag === 'H2' ? 'h2' : tag === 'H3' ? 'h3' : tag === 'LI' ? 'li' : 'p'
    if (kind === 'p' && text.length < 25) continue
    if (kind === 'li' && (text.length < 4 || text.length > 400)) continue
    if ((kind === 'h2' || kind === 'h3') && text.length > 160) continue
    seen.add(text)
    blocks.push({ kind, text: text.slice(0, 3000) })
    if (blocks.length >= 150) break
  }
  return { title, description, h1, blocks }
}

// Text that repeats on most pages is the site's template (a contact form
// heading, "why hire us", office addresses), not the page's own words.
export function dropTemplate(pages: Extracted[]): Extracted[] {
  if (pages.length < 3) return pages
  const count = new Map<string, number>()
  for (const p of pages) for (const t of new Set(p.blocks.map((b) => b.text))) count.set(t, (count.get(t) ?? 0) + 1)
  const limit = Math.max(2, Math.ceil(pages.length * 0.5))
  return pages.map((p) => ({ ...p, blocks: p.blocks.filter((b) => (count.get(b.text) ?? 0) < limit) }))
}

// ---------------------------------------------------------------------------
// Planning the new pages
// ---------------------------------------------------------------------------

// "/Personal-Injury/Car_Accidents.html/" -> "personal-injury/car-accidents"
export function slugForPath(path: string): string {
  return path
    .replace(/\/+$/, '')
    .replace(/\.(html?|php|aspx?)$/i, '')
    .split('/')
    .filter(Boolean)
    .map((seg) =>
      decodeURIComponent(seg)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .filter(Boolean)
    .join('/')
    .slice(0, 180)
}

export interface ImportedPage {
  from: string
  url: string
  extracted: Extracted
}

export interface ImportPlan {
  pages: Page[]
  redirects: Redirect[]
  // Old addresses that land on a page the site already has (home, contact).
  mapped: { from: string; to: string }[]
  skipped: { from: string; reason: string }[]
}

const clip = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…')

function body(e: Extracted, idBase: string): Container[] {
  const children: Element[] = [{ id: `${idBase}-h1`, type: 'heading', level: 1, text: clip(e.h1 || e.title || 'Untitled', 300), style: { fontSize: { desktop: 48, mobile: 34 }, maxWidth: 820 } }]
  let para: string[] = []
  let n = 0
  let sawH2 = false
  const flush = () => {
    if (!para.length) return
    children.push({ id: `${idBase}-t${++n}`, type: 'text', text: para.join('\n\n').slice(0, 20000), style: { fontSize: { desktop: 18 }, maxWidth: 760 } })
    para = []
  }
  for (const b of e.blocks) {
    if (b.kind === 'p') para.push(b.text)
    else if (b.kind === 'li') para.push(`• ${b.text}`)
    else {
      flush()
      // Headings never skip a level: an h3 before any h2 becomes an h2.
      const level = b.kind === 'h3' && sawH2 ? 3 : 2
      if (level === 2) sawH2 = true
      children.push({ id: `${idBase}-h${++n}`, type: 'heading', level, text: clip(b.text, 300), style: { maxWidth: 820, fontSize: { desktop: level === 2 ? 32 : 24, mobile: level === 2 ? 26 : 21 }, margin: { desktop: { top: 16, right: 0, bottom: 0, left: 0 } } } })
    }
  }
  flush()
  return [
    {
      id: `${idBase}-sec`,
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: { desktop: { top: 88, right: 24, bottom: 96, left: 24 }, mobile: { top: 48, right: 20, bottom: 56, left: 20 } }, gap: { desktop: 14 } },
      children,
    },
  ]
}

// The brand most titles end with, and how it's joined: " - ", " | " or " – ".
function oldBrand(titles: string[]): { name: string; sep: string } | null {
  const count = new Map<string, number>()
  for (const t of titles) {
    const m = t.match(/(\s[|\-–—]\s)([^|\-–—]{2,60})$/)
    if (m) count.set(`${m[1]}\u0000${m[2]}`, (count.get(`${m[1]}\u0000${m[2]}`) ?? 0) + 1)
  }
  const best = [...count].sort((a, b) => b[1] - a[1])[0]
  if (!best || best[1] < Math.max(2, titles.length * 0.4)) return null
  const [sep, name] = best[0].split('\u0000')
  return { name, sep }
}

const ALIAS: Record<string, string> = { 'contact-us': 'contact', 'contact-me': 'contact', 'get-in-touch': 'contact', 'our-services': 'services', 'practice-area': 'practice-areas', 'areas-of-practice': 'practice-areas' }

export function planImport(site: Site, existing: readonly Page[], found: ImportedPage[], now = new Date().toISOString()): ImportPlan {
  const plan: ImportPlan = { pages: [], redirects: [], mapped: [], skipped: [] }
  const taken = new Set(existing.map((p) => p.slug))
  const words = (e: Extracted) => e.blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0)
  // Old titles usually end in the old brand ("Car Accidents - Old Firm");
  // the new site's name replaces it.
  const brand = oldBrand(found.map((f) => f.extracted.title))
  const retitle = (t: string) => (brand && t.endsWith(brand.sep + brand.name) ? `${t.slice(0, -(brand.sep + brand.name).length)}${brand.sep}${site.business.name}` : t)
  for (const f of found) {
    const from = f.from.replace(/\/+$/, '') || '/'
    const raw = slugForPath(from)
    // Common names for pages SaySites already has.
    const slug = ALIAS[raw] && existing.some((p) => p.slug === ALIAS[raw]) ? ALIAS[raw] : raw
    // The home page and pages SaySites already built keep SaySites' version;
    // the old address points at them.
    if (slug === '' || (taken.has(slug) && existing.some((p) => p.slug === slug))) {
      plan.mapped.push({ from, to: slug ? `/${slug}` : '/' })
      if (from !== (slug ? `/${slug}` : '/')) plan.redirects.push({ from, to: slug ? `/${slug}` : '/', status: 301 })
      continue
    }
    if (words(f.extracted) < 25) {
      plan.skipped.push({ from, reason: 'Too little text to be worth a page' })
      continue
    }
    if (!Slug.safeParse(slug).success || taken.has(slug)) {
      plan.skipped.push({ from, reason: 'Couldn’t give it a clean address' })
      continue
    }
    taken.add(slug)
    const e = f.extracted
    const firstPara = e.blocks.find((b) => b.kind === 'p')?.text ?? ''
    const id = `page_${randomUUID()}`
    plan.pages.push({
      id,
      siteId: site.id,
      slug,
      name: clip(e.h1 || e.title || slug, 60),
      source: f.url.slice(0, 500),
      // Imported pages wait as drafts until the owner switches their domain
      // over, so the same words never live at two addresses at once.
      status: 'draft',
      seo: { title: clip(retitle(e.title || e.h1 || slug), 70), description: clip(e.description || firstPara || e.h1, 170) },
      body: body(e, slug.replace(/\//g, '-').slice(0, 40)),
      updatedAt: now,
    })
    if (from !== `/${slug}`) plan.redirects.push({ from, to: `/${slug}`, status: 301 })
  }
  return plan
}

// The whole move: find, read and plan. Pages are read five at a time.
export async function importSite(site: Site, existing: readonly Page[], input: string, get: Fetcher = safeFetch): Promise<ImportPlan & { start: string }> {
  const start = normalizeStart(input)
  const urls = await discover(start, get)
  const found: ImportedPage[] = []
  const skipped: ImportPlan['skipped'] = []
  for (let i = 0; i < urls.length; i += 5) {
    const batch = await Promise.all(
      urls.slice(i, i + 5).map(async (u) => {
        const res = await get(u.href).catch(() => null)
        const from = u.pathname.replace(/\/+$/, '') || '/'
        if (!res || res.status !== 200 || !/html/i.test(res.type)) return { from, fail: res ? `The page answered ${res.status}` : 'The page didn’t load' }
        return { from, url: u.href, extracted: extract(res.body) }
      })
    )
    for (const b of batch) 'fail' in b ? skipped.push({ from: b.from, reason: b.fail! }) : found.push(b as ImportedPage)
  }
  if (!found.length) throw new ImportError('We couldn’t read any pages from that site. Check the address, or try the full address with https://.')
  const cleaned = dropTemplate(found.map((f) => f.extracted))
  const plan = planImport(site, existing, found.map((f, i) => ({ ...f, extracted: cleaned[i] })))
  return { ...plan, skipped: [...skipped, ...plan.skipped], start: start.origin }
}
