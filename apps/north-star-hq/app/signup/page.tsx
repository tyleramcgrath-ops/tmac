'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/app/lib/client'
import { Field, inputClass } from '@/app/lib/ui'

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
      router.replace('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#07070a] px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
          ← Back to Headquarters
        </Link>
        <h1 className="mb-1 text-2xl font-semibold text-white">Create your North Star account</h1>
        <p className="mb-6 text-sm text-slate-400">A personal workspace is created for you automatically, seeded with a sample project.</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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
            <span className={`mt-1 block text-xs ${pwOk ? 'text-emerald-400' : 'text-slate-400'}`}>
              At least 10 characters {pwOk ? '✓' : ''}
            </span>
          </Field>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#c9a877] py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#c9a877] hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
