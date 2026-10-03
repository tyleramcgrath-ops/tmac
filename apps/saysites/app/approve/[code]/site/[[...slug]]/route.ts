// The site a client is being asked to approve, shown inside the approval
// page. Never indexed; forms don't send.

import { notFound, serveSitePath } from '@/lib/serve'
import { getStore } from '@/lib/store'
import { APPROVE_CODE } from '@/lib/urls'

type Ctx = { params: Promise<{ code: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { code, slug = [] } = await ctx.params
  if (!APPROVE_CODE.test(code)) return notFound()
  const store = getStore()
  const site = await store.siteByHandoff(code)
  if (!site) return notFound('This link has already been used, or has been replaced.')
  const pages = await store.pagesForSite(site.id)
  return serveSitePath({ site, pages, redirects: await store.redirectsForSite(site.id) }, slug, { preview: true, basePath: `/approve/${code}/site` })
}
