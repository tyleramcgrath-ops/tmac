'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, ApiError } from '@/app/app/lib/client'
import { Field, inputClass } from '@/app/app/lib/ui'
import '@/app/rankforge/rankforge.css'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/app/projects'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(email, password)
      router.replace(next)
    } catch (err) {
      // Deliberately generic — never reveals whether the email exists.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rf-root grid min-h-screen place-items-center bg-[var(--rf-bg)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-white">Sign in to RankForge</h1>
        <p className="mb-6 text-sm text-[var(--rf-muted)]">Access your projects, audits, and deployments.</p>
        <form onSubmit={submit} className="rf-card space-y-4 p-6">
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="rf-btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--rf-muted)]">
          No account?{' '}
          <Link href="/signup" className="text-[var(--rf-blue-bright)] hover:text-white">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
