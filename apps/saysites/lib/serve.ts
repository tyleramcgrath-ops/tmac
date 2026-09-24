// Turns a request path on a site into a Response: a page, the sitemap,
// robots.txt, a redirect, or a 404.

import { renderPage, withBasePath } from './render'
import { pagePath, walk } from './schema'
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
    const r = redirects.find((x) => x.from === path)
    if (r) return new Response(null, { status: r.status, headers: { location: (opts.basePath ?? '') + r.to } })
    return notFound()
  }

  let { html } = renderPage(site, page, pages)
  if (opts.basePath) html = withBasePath(html, opts.basePath)
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': opts.preview ? 'private, no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
      ...noindex,
    },
  })
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
  const back = backPath(req, base)
  const done = () => new Response(null, { status: 303, headers: { location: `${base}${back}#sent`, 'cache-control': 'no-store' } })

  let data: FormData
  try {
    data = await req.formData()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const field = (k: string, max: number) => String(data.get(k) ?? '').trim().slice(0, max)
  const formId = field('form', 64)
  const form = bundle.pages
    .filter((p) => p.status === 'published')
    .flatMap((p) => [...walk(p.body)])
    .find((el) => el.type === 'form' && el.id === formId)
  if (!form || form.type !== 'form') return new Response('Not found', { status: 404 })

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
