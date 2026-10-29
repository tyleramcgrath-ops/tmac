// The link in the "confirm you run this business" email (lib/ownership). It
// was sent to an address at the business's own domain, so opening it proves
// the owner reads that domain's email. The site can then go live.

import { readOwnershipToken, verified } from '@/lib/ownership'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ok = readOwnershipToken(decodeURIComponent(token))
  const store = getStore()
  const site = ok ? await store.siteById(ok.siteId) : null
  if (!ok || !site?.ownership) return Response.redirect(new URL('/dashboard?owner=expired', req.url), 302)
  if (!site.ownership.verified && site.ownership.domain && ok.email.endsWith(`@${site.ownership.domain}`)) {
    await store.updateSite({ ...site, ownership: verified('email', site.ownership.domain), updatedAt: new Date().toISOString() })
  }
  return Response.redirect(new URL(`/dashboard/sites/${site.id}?owner=confirmed`, req.url), 302)
}
