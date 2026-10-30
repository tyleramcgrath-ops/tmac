// Their site rebuilt in SaySites' own design, from a free redesign preview,
// beside the redesign. Never indexed; forms don't send.

import { rebuiltOf } from '@/lib/redesign'
import { notFound, serveSitePath } from '@/lib/serve'
import { getStore } from '@/lib/store'

type Ctx = { params: Promise<{ id: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id, slug = [] } = await ctx.params
  const p = await getStore().preview(id)
  const rebuilt = p && rebuiltOf(p)
  if (!rebuilt) return notFound('This preview has expired.')
  return serveSitePath(rebuilt, slug, { preview: true, basePath: `/redesign/${id}/rebuilt` })
}
