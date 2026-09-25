import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'
import { TRIAL_DAYS, cleanPromo } from '@/lib/billing'

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ idea?: string; template?: string; claim?: string; promo?: string }> }) {
  const sp = await searchParams
  const idea = (sp.idea ?? '').trim().slice(0, 200)
  const template = (sp.template ?? '').trim().slice(0, 20)
  const claim = /^[a-f0-9]{16}$/.test(sp.claim ?? '') ? sp.claim! : ''
  const promo = cleanPromo(sp.promo) ?? ''
  if (claim && (await currentUser())) redirect(`/redesign/${claim}/claim`)
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
          {claim ? (
            <p className="sub">Create a free account to claim your redesigned site. It’s saved to your account, and you can change anything.</p>
          ) : idea ? (
            <p className="sub">You said: <strong>“{idea}”</strong>. Create a free account and we’ll build it.</p>
          ) : (
            <p className="sub">Create a free account. Next, tell us about your business.</p>
          )}
          {promo && <p className="notice good">Code <strong>{promo}</strong> is saved to your account. It’s applied when you start your plan.</p>}
          <SignUpForm idea={idea} template={template} claim={claim} promo={promo} />
          <p className="muted small">Free for {TRIAL_DAYS} days. No card needed to start.</p>
          <p className="switch">Already have an account? <a href={claim ? `/login?claim=${claim}` : '/login'}>Log in</a></p>
        </div>
      </main>
    </>
  )
}
