// The owner's private preview of a site including Sofie's unpublished
// changes. Only the owner can see it, and it is never indexed.

import { serveSitePath, notFound } from '@/lib/serve'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; slug?: string[] }> }) {
  const { id, slug = [] } = await ctx.params
  const user = await currentUser()
  if (!user) return notFound()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) return notFound()
  const [state, pages, redirects] = await Promise.all([store.sofieState(site.id), store.pagesForSite(site.id), store.redirectsForSite(site.id)])
  const bundle = state.draft ? { ...state.draft, redirects } : { site, pages, redirects }
  return serveSitePath(bundle, slug, { preview: true, basePath: `/dashboard/sites/${id}/draft` })
}
