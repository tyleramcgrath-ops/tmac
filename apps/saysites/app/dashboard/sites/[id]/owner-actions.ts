'use server'

// "Confirm you run this business", for sites claimed from a redesign preview
// (lib/ownership). The email goes only to an address at the business's own
// website domain.

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin'
import { mailReady, sendMail } from '@/lib/mail'
import { ownerAddress, ownershipToken, verified } from '@/lib/ownership'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

async function origin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'saysites.com'
  return `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`
}

export async function sendOwnerCheck(siteId: string, form: FormData) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site?.ownership || site.ownership.verified || !site.ownership.domain) redirect(`/dashboard/sites/${siteId}`)
  const to = ownerAddress(String(form.get('local') ?? ''), site.ownership.domain)
  if (!to) redirect(`/dashboard/sites/${siteId}?owner=bad`)
  if (!mailReady()) redirect(`/dashboard/sites/${siteId}?owner=nomail`)
  const link = `${await origin()}/verify-owner/${encodeURIComponent(ownershipToken(site.id, to))}`
  const sent = await sendMail({
    to,
    subject: `Confirm ${site.business.name} on SaySites`,
    text: `Hi,\n\nSomeone (hopefully you) claimed the website for ${site.business.name} on SaySites. To confirm you run this business and let the site go live, open this link within 3 days:\n${link}\n\nIf this wasn't you, ignore this email and nothing will be published.\n\nSaySites\n`,
  })
  redirect(`/dashboard/sites/${siteId}?owner=${sent.ok ? 'sent' : 'failed'}`)
}

// The team's hand check, from /dashboard/outreach.
export async function approveOwner(siteId: string) {
  const user = await requireUser()
  if (!isAdmin(user.email)) redirect('/dashboard')
  const store = getStore()
  const site = await store.siteById(siteId)
  if (site?.ownership && !site.ownership.verified) await store.updateSite({ ...site, ownership: verified('team', site.ownership.domain), updatedAt: new Date().toISOString() })
  redirect('/dashboard/outreach?owner=approved')
}
