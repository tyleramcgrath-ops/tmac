// Customer websites. The proxy rewrites <sub>.saysites.com/<path> (and custom
// domains) to /s-render/<host>/<path>; this route is not reachable directly.

import { notFound, serveSitePath } from '@/lib/serve'
import { resolveHost } from '@/lib/sites'

export async function GET(_req: Request, ctx: { params: Promise<{ host: string; slug?: string[] }> }) {
  const { host, slug = [] } = await ctx.params
  const match = await resolveHost(decodeURIComponent(host))
  if (!match) return notFound('No site is set up at this address yet.')
  return serveSitePath(match.bundle, slug, { preview: match.preview })
}
