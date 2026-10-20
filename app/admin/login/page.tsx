import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { adminSetupProblems, isAdmin } from '@/lib/admin/auth'
import { login } from '../actions'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Login() {
  if (await isAdmin()) redirect('/admin')
  const problems = adminSetupProblems()
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 440 }}>
        <div className="card ad-login">
          <div className="eyebrow">LawMatchNow</div>
          <h1>Dashboard sign in</h1>
          {!problems.length ? (
            <LoginForm action={login} />
          ) : (
            <>
              <p className="muted">
                The dashboard isn&apos;t set up yet. The running app can&apos;t see these settings:
              </p>
              <ul className="ad-problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="muted">
                In SiteGround Site Tools, open Devs → Node.js, edit this app&apos;s environment variables, check the names are exactly <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>ADMIN_SECRET</code> (capitals, no spaces), save, then restart the app. New variables only reach the app after a restart.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
