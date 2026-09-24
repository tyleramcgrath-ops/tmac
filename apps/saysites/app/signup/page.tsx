import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ idea?: string; template?: string }> }) {
  const sp = await searchParams
  const idea = (sp.idea ?? '').trim().slice(0, 200)
  const template = (sp.template ?? '').trim().slice(0, 20)
  if (await currentUser()) {
    const q = new URLSearchParams({ ...(idea ? { idea } : {}), ...(template ? { template } : {}) }).toString()
    redirect(q ? `/dashboard/new?${q}` : '/dashboard')
  }
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
          <SignUpForm idea={idea} template={template} />
          <p className="switch">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </main>
    </>
  )
}
