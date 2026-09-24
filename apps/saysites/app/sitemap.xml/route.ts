import { sitemapXml } from '@/lib'
import { resolveHost } from '@/lib/sites'

export async function GET(req: Request) {
  const match = await resolveHost(req.headers.get('host'))
  if (!match) return new Response('Not found', { status: 404 })
  return new Response(sitemapXml(match.bundle.site, match.bundle.pages), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, s-maxage=300' },
  })
}
