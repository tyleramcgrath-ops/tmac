// Turns a request path on a site into a Response: a page, the sitemap,
// robots.txt, a redirect, or a 404.

import { renderPage, withBasePath } from './render'
import { pagePath } from './schema'
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
