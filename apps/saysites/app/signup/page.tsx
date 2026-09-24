import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/Forms'
import { TopBar } from '@/components/TopBar'
import { currentUser } from '@/lib/session'

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } }

export default async function SignUpPage() {
  if (await currentUser()) redirect('/dashboard')
  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          <h1>Build your website</h1>
          <p className="sub">Create a free account. Next, tell us about your business.</p>
          <SignUpForm />
          <p className="switch">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </main>
    </>
  )
}
