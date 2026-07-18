'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/app/lib/client'
import { Field, inputClass } from '@/app/lib/ui'
import '@/app/rankforge/rankforge.css'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pwOk = password.length >= 10

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!pwOk) {
      setError('Password must be at least 10 characters.')
      return
    }
    setLoading(true)
    try {
      await api.signup(email, password, name)
      router.replace('/projects')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rf-root grid min-h-screen place-items-center bg-[var(--rf-bg)] px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--rf-muted)] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to homepage
        </Link>
        <h1 className="mb-1 text-2xl font-semibold text-white">Create your RankForge account</h1>
        <p className="mb-6 text-sm text-[var(--rf-muted)]">A personal workspace is created for you automatically.</p>
        <form onSubmit={submit} className="rf-card space-y-4 p-6">
          <Field label="Name">
            <input autoComplete="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete="new-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className={`mt-1 block text-xs ${pwOk ? 'text-[var(--rf-green)]' : 'text-[var(--rf-muted)]'}`}>
              At least 10 characters {pwOk ? '✓' : ''}
            </span>
          </Field>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="rf-btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--rf-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--rf-blue-bright)] hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
