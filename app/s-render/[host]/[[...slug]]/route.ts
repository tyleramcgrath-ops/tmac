// Customer websites. The proxy rewrites <sub>.saysites.com/<path> (and custom
// domains) to /s-render/<host>/<path>; this route is not reachable directly.

import { CALL_PATH, FORM_PATH, handleCall, handleFormPost, handleVisit, notFound, serveSitePath, VISIT_PATH } from '@/lib/serve'
import { SHARE_CARD_PATH } from '@/lib/render'
import { shareCard } from '@/lib/share-card'
import { resolveHost } from '@/lib/sites'

type Ctx = { params: Promise<{ host: string; slug?: string[] }> }

export async function GET(req: Request, ctx: Ctx) {
  const { host, slug = [] } = await ctx.params
  const match = await resolveHost(decodeURIComponent(host))
  if (!match) return notFound('No site is set up at this address yet.')
  if (slug.join('/') === SHARE_CARD_PATH) return shareCard(match.bundle, new URL(req.url).searchParams.get('p') ?? '/')
  if (slug.join('/') === VISIT_PATH) return match.preview ? new Response(null, { status: 204 }) : handleVisit(match.bundle, req)
  if (slug.join('/') === CALL_PATH) return match.preview ? new Response(null, { status: 204 }) : handleCall(match.bundle, req)
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
