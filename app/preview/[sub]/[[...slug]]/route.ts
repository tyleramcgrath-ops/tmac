// saysites.com/preview/<subdomain>/<path>: view any published SaySites site
// from the main address. Used by the dashboard and the homepage's example link
// before a site has its own address. Never indexed.

import { notFound, serveSitePath } from '@/lib/serve'
import { bundleFor } from '@/lib/sites'
import { getStore } from '@/lib/store'

export async function GET(_req: Request, ctx: { params: Promise<{ sub: string; slug?: string[] }> }) {
  const { sub, slug = [] } = await ctx.params
  const bundle = await bundleFor(await getStore().siteBySubdomain(sub))
  if (!bundle) return notFound('No site with that name.')
  return serveSitePath(bundle, slug, { preview: true, basePath: `/preview/${sub}` })
}
