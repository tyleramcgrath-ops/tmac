import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogInForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'
import { APPROVE_CODE, CLAIM_CODE, approvePath, claimPath } from '@/lib/urls'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ claim?: string; approve?: string }> }) {
  const sp = await searchParams
  const claim = CLAIM_CODE.test(sp.claim ?? '') ? sp.claim! : ''
  const approve = APPROVE_CODE.test(sp.approve ?? '') ? sp.approve! : ''
  if (await currentUser()) redirect(claim ? claimPath(claim) : approve ? approvePath(approve) : '/dashboard')
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Log in to manage your websites.</p>
          <LogInForm claim={claim} approve={approve} />
          <p className="switch">New to SaySites? <a href="/signup">Create an account</a></p>
        </div>
      </main>
    </>
  )
}
