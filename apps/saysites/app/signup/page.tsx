import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'
import { APPROVE_CODE, CLAIM_CODE, approvePath, claimPath } from '@/lib/urls'
import { getStore } from '@/lib/store'
import { INVITE_CODE, invitePath } from '@/lib/team'
import { TRIAL_DAYS, cleanPromo } from '@/lib/billing'

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ idea?: string; template?: string; claim?: string; promo?: string; approve?: string; invite?: string }> }) {
  const sp = await searchParams
  const idea = (sp.idea ?? '').trim().slice(0, 200)
  const template = (sp.template ?? '').trim().slice(0, 20)
  const claim = CLAIM_CODE.test(sp.claim ?? '') ? sp.claim! : ''
  const promo = cleanPromo(sp.promo) ?? ''
  const approve = APPROVE_CODE.test(sp.approve ?? '') ? sp.approve! : ''
  if (claim && (await currentUser())) redirect(claimPath(claim))
  if (approve && (await currentUser())) redirect(approvePath(approve))
  const inv = INVITE_CODE.test(sp.invite ?? '') ? await getStore().invite(sp.invite!) : null
  const invite = inv?.code ?? ''
  if (invite && (await currentUser())) redirect(invitePath(invite))
  if (await currentUser()) {
    const q = new URLSearchParams({ ...(idea ? { idea } : {}), ...(template ? { template } : {}) }).toString()
    redirect(q ? `/dashboard/new?${q}` : '/dashboard')
  }
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>{invite ? 'Join the team' : 'Build your website'}</h1>
          {invite ? (
            <p className="sub">Create your login to help with the leads. Use the email address the invite went to.</p>
          ) : approve ? (
            <p className="sub">Create your login to approve your new website. It moves into your account, where you can see and change everything.</p>
          ) : claim ? (
            <p className="sub">Create a free account to claim your redesigned site. It’s saved to your account, and you can change anything.</p>
          ) : idea ? (
            <p className="sub">You said: <strong>“{idea}”</strong>. Create a free account and we’ll build it.</p>
          ) : (
            <p className="sub">Create a free account. Next, tell us about your business.</p>
          )}
          {promo && <p className="notice good">Code <strong>{promo}</strong> is saved to your account. It’s applied when you start your plan.</p>}
          <SignUpForm idea={idea} template={template} claim={claim} promo={promo} approve={approve} invite={invite} email={inv?.email ?? ''} />
          {!invite && <p className="muted small">Free for {TRIAL_DAYS} days. No card needed to start.</p>}
          <p className="switch">Already have an account? <a href={claim ? `/login?claim=${claim}` : approve ? `/login?approve=${approve}` : invite ? `/login?invite=${invite}` : '/login'}>Log in</a></p>
        </div>
      </main>
    </>
  )
}
