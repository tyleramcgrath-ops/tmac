// Customer websites. The proxy rewrites <sub>.saysites.com/<path> (and custom
// domains) to /s-render/<host>/<path>; this route is not reachable directly.

import { FORM_PATH, handleFormPost, notFound, serveSitePath } from '@/lib/serve'
import { resolveHost } from '@/lib/sites'

type Ctx = { params: Promise<{ host: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { host, slug = [] } = await ctx.params
  const match = await resolveHost(decodeURIComponent(host))
  if (!match) return notFound('No site is set up at this address yet.')
  return serveSitePath(match.bundle, slug, { preview: match.preview })
}

// Contact form posts.
export async function POST(req: Request, ctx: Ctx) {
  const { host, slug = [] } = await ctx.params
  if (slug.join('/') !== FORM_PATH) return new Response('Method not allowed', { status: 405 })
  const match = await resolveHost(decodeURIComponent(host))
  if (!match) return notFound('No site is set up at this address yet.')
  return handleFormPost(match.bundle, req, { preview: match.preview })
}
