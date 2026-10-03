import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogInForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'
import { APPROVE_CODE, CLAIM_CODE, approvePath, claimPath } from '@/lib/urls'
import { INVITE_CODE, invitePath } from '@/lib/team'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ claim?: string; approve?: string; invite?: string }> }) {
  const sp = await searchParams
  const claim = CLAIM_CODE.test(sp.claim ?? '') ? sp.claim! : ''
  const approve = APPROVE_CODE.test(sp.approve ?? '') ? sp.approve! : ''
  const invite = INVITE_CODE.test(sp.invite ?? '') ? sp.invite! : ''
  if (await currentUser()) redirect(claim ? claimPath(claim) : approve ? approvePath(approve) : invite ? invitePath(invite) : '/dashboard')
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">{invite ? 'Log in to join the team.' : 'Log in to manage your websites.'}</p>
          <LogInForm claim={claim} approve={approve} invite={invite} />
          <p className="switch">New to SaySites? <a href={invite ? `/signup?invite=${invite}` : '/signup'}>Create an account</a></p>
        </div>
      </main>
    </>
  )
}
