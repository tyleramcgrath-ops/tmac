// Approving a site the SaySites team built: after signing up or in, it
// moves into the client's own account, and they start their plan.

import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { APPROVE_CODE } from '@/lib/urls'

export const dynamic = 'force-dynamic'

export default async function AcceptPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!APPROVE_CODE.test(code)) notFound()
  const user = await currentUser()
  if (!user) redirect(`/signup?approve=${code}`)
  const store = getStore()
  const site = await store.siteByHandoff(code)
  if (!site?.handoff) redirect('/dashboard')
  const plan = site.handoff.plan
  const { handoff: _done, ...rest } = site
  await store.updateSite({ ...rest, updatedAt: new Date().toISOString() })
  await store.transferSite(site.id, user.id)
  redirect(`/dashboard/account?plan=${plan}&approved=1#plan`)
}
