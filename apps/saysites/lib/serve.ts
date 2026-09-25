// Turns a request path on a site into a Response: a page, the sitemap,
// robots.txt, a redirect, or a 404.

import { wordsFor } from './site-words'
import { renderPage, withBasePath } from './render'
import { pagePath, walk, type Page } from './schema'
import { SHOWCASE_ORG } from './showcase'
import { getStore, type Store } from './store'
import { robotsTxt, sitemapXml } from './seo'
import type { SiteBundle } from './sites'

export interface ServeOptions {
  // Never indexable (test addresses and dashboard previews).
  preview: boolean
  // Path prefix for internal links, e.g. "/preview/rivertown-plumbing".
  basePath?: string
}

export function serveSitePath(bundle: SiteBundle, slug: string[], opts: ServeOptions): Response {
  const { site, pages, redirects } = bundle
  const path = '/' + slug.join('/')
  const noindex: Record<string, string> = opts.preview ? { 'x-robots-tag': 'noindex' } : {}

  if (path === '/sitemap.xml') {
    return new Response(sitemapXml(site, pages), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, s-maxage=300', ...noindex } })
  }
  if (path === '/robots.txt') {
    const body = opts.preview ? 'User-agent: *\nDisallow: /\n' : robotsTxt(site)
    return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, s-maxage=300' } })
  }

  const page = pages.find((p) => p.status === 'published' && pagePath(p) === path)
  if (!page) {
    // yoursite.com/review: a short, permanent address for QR cards and
    // messages that forwards to wherever the owner collects reviews.
    if (path === '/review' && site.business.reviewUrl) return new Response(null, { status: 302, headers: { location: site.business.reviewUrl, 'cache-control': 'public, s-maxage=300' } })
    const r = redirects.find((x) => x.from === path)
    if (r) return new Response(null, { status: r.status, headers: { location: (opts.basePath ?? '') + r.to } })
    return siteNotFound(bundle, opts)
  }

  let { html } = renderPage(site, page, pages)
  if (opts.basePath) html = withBasePath(html, opts.basePath)
  if (!opts.preview) html = html.replace('</body>', `${visitBeacon(path)}${callTracker(path)}</body>`).replace('<body', '<body ontouchstart=""')
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': opts.preview ? 'private, no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
      ...noindex,
    },
  })
}

// A 404 in the site's own look, with its header, footer and a way home.
function siteNotFound(bundle: SiteBundle, opts: ServeOptions): Response {
  const { site, pages } = bundle
  const nf = wordsFor(site.language).notFound
  const page: Page = {
    id: '404',
    siteId: site.id,
    slug: 'not-found',
    name: 'Not found',
    status: 'published',
    seo: { title: `${nf.title} | ${site.business.name}`.slice(0, 70), description: `This page isn't here. Head back to ${site.business.name}'s home page.`.slice(0, 170), noindex: true },
    body: [
      {
        id: 'nf',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        align: 'center',
        boxed: true,
        style: { padding: { desktop: { top: 120, right: 24, bottom: 140, left: 24 }, mobile: { top: 64, right: 20, bottom: 80, left: 20 } }, gap: { desktop: 16 }, textAlign: { desktop: 'center' } },
        children: [
          { id: 'nf-k', type: 'text', text: '404', style: { color: 'primary', fontWeight: 700, letterSpacing: 0.12 } },
          { id: 'nf-h', type: 'heading', level: 1, text: nf.heading, style: { fontSize: { desktop: 48, mobile: 34 } } },
          { id: 'nf-t', type: 'text', text: nf.text, style: { color: 'muted', maxWidth: 520 } },
          {
            id: 'nf-a',
            type: 'container',
            layout: 'flex',
            direction: { desktop: 'row' },
            justify: 'center',
            style: { gap: { desktop: 12 }, margin: { desktop: { top: 12, right: 0, bottom: 0, left: 0 } } },
            children: [
              { id: 'nf-home', type: 'button', label: nf.home, href: '/', variant: 'primary' },
              ...(pages.some((p) => p.slug === 'contact' && p.status === 'published') ? [{ id: 'nf-contact', type: 'button' as const, label: nf.contact, href: '/contact', variant: 'outline' as const }] : []),
            ],
          },
        ],
      },
    ],
    updatedAt: site.updatedAt,
  }
  let { html } = renderPage(site, page, pages)
  if (opts.basePath) html = withBasePath(html, opts.basePath)
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=60', 'x-robots-tag': 'noindex' } })
}

// Visit counting without cookies or scripts: each live page carries a 1px
// element whose background is /__v?p=<page>. Browsers fetch it; most bots
// never load CSS backgrounds. Only the day, the page and a count are kept.
export const VISIT_PATH = '__v'
const BOT = /bot|crawl|spider|slurp|fetch|preview|headless|lighthouse|pagespeed|monitor|curl|wget|python|http-client|scan/i
const GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0))

export function visitBeacon(path: string): string {
  return `<i aria-hidden="true" style="position:absolute;top:0;left:0;width:1px;height:1px;background:url(/${VISIT_PATH}?p=${encodeURIComponent(path)})"></i>`
}

// Phone-number taps, counted without JavaScript: while a tel: link is being
// pressed it gets a background image from /__c, and that request is the
// count. (ontouchstart on <body> makes iOS apply :active on tap.)
export const CALL_PATH = '__c'
export function callTracker(path: string): string {
  return `<style>a[href^="tel:"]:active{background-image:url(/${CALL_PATH}?p=${encodeURIComponent(path)})}</style>`
}

export async function handleCall(bundle: SiteBundle, req: Request, store: Store = getStore()): Promise<Response> {
  const pixel = new Response(GIF, { headers: { 'content-type': 'image/gif', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua) || !bundle.site.business.phone) return pixel
  try {
    await store.recordVisit(bundle.site.id, new Date().toISOString().slice(0, 10), '#call')
  } catch {
    // Counting must never break a page.
  }
  return pixel
}

export async function handleVisit(bundle: SiteBundle, req: Request, store: Store = getStore()): Promise<Response> {
  const pixel = new Response(GIF, { headers: { 'content-type': 'image/gif', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
  const path = new URL(req.url).searchParams.get('p') ?? ''
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua) || req.headers.get('purpose') === 'prefetch' || req.headers.get('sec-purpose')?.includes('prefetch')) return pixel
  // Only real, published pages count, so the table can't be filled with junk.
  if (!bundle.pages.some((p) => p.status === 'published' && pagePath(p) === path)) return pixel
  try {
    await store.recordVisit(bundle.site.id, new Date().toISOString().slice(0, 10), path)
  } catch {
    // Counting must never break a page.
  }
  return pixel
}

export function notFound(message = 'This page does not exist.'): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title><style>body{margin:0;font:18px/1.6 system-ui,sans-serif;color:#1b2430;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px}a{color:#0f5ea8}</style></head><body><main><h1>Not found</h1><p>${message}</p><p><a href="/">Go to the home page</a></p></main></body></html>`
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

// Contact form posts (<site>/__form). Checks the form exists on a published
// page, drops obvious bots, stores the message for the owner and sends the
// visitor back to the page, where "#sent" reveals the thank-you note.
export const FORM_PATH = '__form'
const MAX_PER_HOUR = 30

export async function handleFormPost(bundle: SiteBundle, req: Request, opts: ServeOptions, store: Store = getStore()): Promise<Response> {
  const base = opts.basePath ?? ''
  let back = '/'
  const done = () => new Response(null, { status: 303, headers: { location: `${base}${back}#sent`, 'cache-control': 'no-store' } })

  let data: FormData
  try {
    data = await req.formData()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const field = (k: string, max: number) => String(data.get(k) ?? '').trim().slice(0, max)
  const formId = field('form', 64)
  const homes = bundle.pages.filter((p) => p.status === 'published' && [...walk(p.body)].some((el) => el.type === 'form' && el.id === formId))
  const form = homes.length ? [...walk(homes[0].body)].find((el) => el.type === 'form' && el.id === formId) : undefined
  if (!form || form.type !== 'form') return new Response('Not found', { status: 404 })
  // Back to the page the form is on, where the thank-you note shows. The
  // Referer only picks between pages that share a form; browsers and proxies
  // don't always send it, or send it with a different host.
  const paths = homes.map((p) => pagePath(p))
  const ref = backPath(req, base)
  back = paths.includes(ref) ? ref : paths[0]

  // Bots fill every field; people never see this one. Pretend it worked.
  if (field('website', 200)) return done()

  const msg = { name: field('name', 120), email: field('email', 200), phone: field('phone', 40), body: field('message', 5000) }
  const missing = form.fields.filter((f) => f !== 'phone' && !msg[f === 'message' ? 'body' : f])
  if (missing.length || (msg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email))) {
    return new Response('Please fill in every field and use a real email address, then go back and try again.', { status: 422, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }

  // Showcase sites are examples; their forms work but nothing is stored.
  if (bundle.site.orgId === SHOWCASE_ORG) return done()
  if ((await store.recentMessageCount(bundle.site.id, new Date(Date.now() - 3600_000))) >= MAX_PER_HOUR) return done()
  await store.addMessage({ siteId: bundle.site.id, ...msg, page: back })
  return done()
}

// The page the form was sent from, from the Referer, relative to the site.
function backPath(req: Request, base: string): string {
  try {
    const ref = new URL(req.headers.get('referer') ?? '')
    const own = new URL(req.url)
    if (ref.host !== own.host) return '/'
    let path = ref.pathname
    if (base && path.startsWith(base)) path = path.slice(base.length) || '/'
    return /^\/[\w\-/]*$/.test(path) ? path : '/'
  } catch {
    return '/'
  }
}
