// The rebuilt site from a free redesign preview. Never indexed; forms don't send.

import { notFound, serveSitePath } from '@/lib/serve'
import { getStore } from '@/lib/store'

type Ctx = { params: Promise<{ id: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id, slug = [] } = await ctx.params
  const p = await getStore().preview(id)
  if (!p) return notFound('This preview has expired.')
  return serveSitePath({ site: p.site, pages: p.pages, redirects: p.redirects }, slug, { preview: true, basePath: `/redesign/${id}/site` })
}
