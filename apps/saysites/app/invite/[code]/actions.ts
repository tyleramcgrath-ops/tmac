'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { INVITE_CODE } from '@/lib/team'

// Joining a site's team: only the person the invite was sent to, once.
export async function acceptInvite(code: string): Promise<void> {
  if (!INVITE_CODE.test(code)) redirect('/dashboard')
  const user = await requireUser()
  const store = getStore()
  const inv = await store.invite(code)
  if (!inv || inv.email.toLowerCase() !== user.email.toLowerCase()) redirect(`/invite/${code}`)
  const site = await store.siteById(inv.siteId)
  if (site && site.orgId !== user.id) await store.addMember(site.id, user.id)
  await store.deleteInvite(code)
  redirect(site ? `/dashboard/sites/${site.id}/leads` : '/dashboard')
}
