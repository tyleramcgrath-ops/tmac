import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { adminConfigured, isAdmin } from '@/lib/admin/auth'
import { login } from '../actions'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Login() {
  if (await isAdmin()) redirect('/admin')
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 440 }}>
        <div className="card ad-login">
          <div className="eyebrow">LawMatchNow</div>
          <h1>Dashboard sign in</h1>
          {adminConfigured() ? (
            <LoginForm action={login} />
          ) : (
            <p className="muted">
              The dashboard isn&apos;t set up yet. In SiteGround, add the environment variables <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>ADMIN_SECRET</code> (at least 32 random characters) to the Node.js app, then restart it.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
