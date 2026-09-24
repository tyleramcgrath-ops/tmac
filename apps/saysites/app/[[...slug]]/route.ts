// Serves every SaySites page. The host picks the site; the path picks the page.
// Pages are complete HTML documents from the renderer — no React on the client.

import { pagePath, renderPage } from '@/lib'
import { resolveHost } from '@/lib/sites'

export async function GET(req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await ctx.params
  const match = await resolveHost(req.headers.get('host'))
  if (!match) return notFound('No site is set up at this address yet.')

  const { site, pages, redirects } = match.bundle
  const path = '/' + slug.join('/')
  const page = pages.find((p) => p.status === 'published' && pagePath(p) === path)

  if (!page) {
    const r = redirects.find((x) => x.from === path)
    if (r) return new Response(null, { status: r.status, headers: { location: r.to } })
    return notFound('This page does not exist.')
  }

  const { html } = renderPage(site, page, pages)
  const headers: Record<string, string> = {
    'content-type': 'text/html; charset=utf-8',
    // Cached at the edge; a publish will purge by tag once editing exists.
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  }
  if (match.preview) headers['x-robots-tag'] = 'noindex'
  return new Response(html, { headers })
}

function notFound(message: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title><style>body{margin:0;font:18px/1.6 system-ui,sans-serif;color:#1b2430;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px}a{color:#0f5ea8}</style></head><body><main><h1>Not found</h1><p>${message}</p><p><a href="/">Go to the home page</a></p></main></body></html>`
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
}
