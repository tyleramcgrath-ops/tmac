import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ idea?: string }> }) {
  const idea = ((await searchParams).idea ?? '').trim().slice(0, 200)
  if (await currentUser()) redirect(idea ? `/dashboard/new?idea=${encodeURIComponent(idea)}` : '/dashboard')
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>Build your website</h1>
          {idea ? (
            <p className="sub">You said: <strong>“{idea}”</strong>. Create a free account and we’ll build it.</p>
          ) : (
            <p className="sub">Create a free account. Next, tell us about your business.</p>
          )}
          <SignUpForm idea={idea} />
          <p className="switch">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </main>
    </>
  )
}
