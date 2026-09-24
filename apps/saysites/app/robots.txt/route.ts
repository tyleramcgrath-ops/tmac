import { robotsTxt } from '@/lib'
import { resolveHost } from '@/lib/sites'

export async function GET(req: Request) {
  const match = await resolveHost(req.headers.get('host'))
  if (!match) return new Response('Not found', { status: 404 })
  // The test deployment must never be indexed.
  const body = match.preview ? 'User-agent: *\nDisallow: /\n' : robotsTxt(match.bundle.site)
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, s-maxage=300' } })
}
