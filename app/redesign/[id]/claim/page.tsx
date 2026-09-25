// Claiming a redesign preview: it becomes the signed-in owner's site. A
// preview can be claimed once; coming back here goes to the claimed site.

import { redirect } from 'next/navigation'
import { claimFromPreview } from '@/lib/redesign'
import { currentUser } from '@/lib/session'
import { subdomainFor } from '@/lib/starter'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  const p = await store.preview(id)
  if (!p) redirect('/redesign')
  const user = await currentUser()
  if (!user) redirect(`/signup?claim=${encodeURIComponent(id)}`)
  if (p.claimed) redirect(p.claimed.by === user.id ? `/dashboard/sites/${p.claimed.siteId}` : '/dashboard')
  const base = subdomainFor(p.detected.name)
  let subdomain = base
  for (let n = 2; await store.subdomainTaken(subdomain); n++) subdomain = `${base}-${n}`
  const { site, pages, redirects } = claimFromPreview(p, user.id, subdomain)
  if (!(await store.claimPreview(id, user.id, site.id))) redirect('/dashboard')
  await store.createSite(user.id, site, pages)
  if (redirects.length) await store.saveRedirects(site.id, redirects)
  redirect(pages.some((pg) => pg.source) ? `/dashboard/sites/${site.id}/move?claimed=1` : `/dashboard/sites/${site.id}?new=1`)
}
