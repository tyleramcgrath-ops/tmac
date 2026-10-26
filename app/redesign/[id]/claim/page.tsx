// Claiming a redesign preview: it becomes the signed-in owner's site. A
// preview can be claimed once; coming back here goes to the claimed site.
// Anyone can preview any website, so the claimed site stays off the public
// web until its owner proves the business is theirs (lib/ownership). A
// preview from our outreach (lib/outreach) starts with a free first month.

import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { keepClassicAssets } from '@/lib/classic-assets'
import { hostOf, withFreeMonth } from '@/lib/prospects'
import { claimFromPreview, offersCopy } from '@/lib/redesign'
import { currentUser } from '@/lib/session'
import { subdomainFor } from '@/lib/starter'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function ClaimPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params
  const fresh = (await searchParams).v === 'fresh'
  const store = getStore()
  const p = await store.preview(id)
  if (!p) redirect('/redesign')
  const user = await currentUser()
  if (!user) redirect(`/signup?claim=${encodeURIComponent(id)}${fresh ? 'f' : ''}`)
  if (p.claimed) redirect(p.claimed.by === user.id ? `/dashboard/sites/${p.claimed.siteId}` : '/dashboard')
  const base = subdomainFor(p.detected.name)
  let subdomain = base
  for (let n = 2; await store.subdomainTaken(subdomain); n++) subdomain = `${base}-${n}`
  // Only a version the preview offers can be claimed (lib/redesign).
  const copy = offersCopy(p)
  const freshOk = p.asIs !== undefined && !!p.fresh && p.freshReady !== false
  if (!copy && !freshOk) redirect(`/redesign/${id}`)
  const claimed = claimFromPreview(p, user.id, subdomain, (fresh && freshOk) || !copy ? 'fresh' : 'as-is')
  const { pages, redirects } = claimed
  const domain = hostOf(p.url)
  const site = { ...claimed.site, ownership: { verified: false, ...(/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain) ? { domain } : {}) } }
  if (!(await store.claimPreview(id, user.id, site.id))) redirect('/dashboard')
  const prospect = await store.prospectByPreview(id)
  await store.createSite(user.id, { ...site, startedVia: prospect ? 'outreach' : 'redesign' }, pages)
  if (prospect) {
    await store.saveProspect({ ...prospect, claimedAt: new Date().toISOString() })
    const bill = await store.billing(user.id)
    const longer = bill ? withFreeMonth(bill) : null
    if (longer) await store.saveBilling(user.id, longer)
  }
  if (redirects.length) await store.saveRedirects(site.id, redirects)
  // Pages kept exactly as they were still load photos and fonts from the
  // old host, which goes away when the domain moves: copy them over.
  if (pages.some((pg) => pg.classic) && site.ownership.domain) {
    const keep = async () => {
      const { pages: moved, copied } = await keepClassicAssets(store, site.id, site.ownership.domain!, pages)
      if (copied) for (const pg of moved) if (pg !== pages.find((x) => x.id === pg.id)) await store.savePage(pg, 'import', null, 'Copied the old site’s photos and fonts')
    }
    after(() => keep().catch((e) => console.error('[claim] keeping old files failed', e)))
  }
  redirect(pages.some((pg) => pg.source) ? `/dashboard/sites/${site.id}/move?claimed=1` : `/dashboard/sites/${site.id}?new=1`)
}
