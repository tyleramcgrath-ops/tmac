// The fresh redesign from a free redesign preview, beside the site as it
// is. Never indexed; forms don't send.

import { notFound, serveSitePath } from '@/lib/serve'
import { getStore } from '@/lib/store'

type Ctx = { params: Promise<{ id: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id, slug = [] } = await ctx.params
  const p = await getStore().preview(id)
  if (!p?.fresh) return notFound('This preview has expired.')
  return serveSitePath({ site: p.fresh.site, pages: p.fresh.pages, redirects: p.fresh.redirects }, slug, { preview: true, basePath: `/redesign/${id}/fresh` })
}
