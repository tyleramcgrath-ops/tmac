// saysites.com/preview/<subdomain>/<path>: view any published SaySites site
// from the main address. Used by the dashboard and the homepage's example link
// before a site has its own address. Never indexed.

import { FORM_PATH, handleFormPost, notFound, serveSitePath } from '@/lib/serve'
import { bundleFor } from '@/lib/sites'
import { getStore } from '@/lib/store'

type Ctx = { params: Promise<{ sub: string; slug?: string[] }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { sub, slug = [] } = await ctx.params
  const bundle = await bundleFor(await getStore().siteBySubdomain(sub))
  if (!bundle) return notFound('No site with that name.')
  return serveSitePath(bundle, slug, { preview: true, basePath: `/preview/${sub}` })
}

// Contact form posts from the preview address work the same way.
export async function POST(req: Request, ctx: Ctx) {
  const { sub, slug = [] } = await ctx.params
  if (slug.join('/') !== FORM_PATH) return new Response('Method not allowed', { status: 405 })
  const bundle = await bundleFor(await getStore().siteBySubdomain(sub))
  if (!bundle) return notFound('No site with that name.')
  return handleFormPost(bundle, req, { preview: true, basePath: `/preview/${sub}` })
}
