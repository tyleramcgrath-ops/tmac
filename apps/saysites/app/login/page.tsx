import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogInForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const sp = await searchParams
  const claim = /^[a-f0-9]{16}$/.test(sp.claim ?? '') ? sp.claim! : ''
  if (await currentUser()) redirect(claim ? `/redesign/${claim}/claim` : '/dashboard')
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Log in to manage your websites.</p>
          <LogInForm claim={claim} />
          <p className="switch">New to SaySites? <a href="/signup">Create an account</a></p>
        </div>
      </main>
    </>
  )
}
