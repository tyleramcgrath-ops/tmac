'use client'

// Small shared UI primitives for the foundation screens, styled with the
// existing rf- design tokens. No new dependencies.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from './auth-context'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-3 py-16 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--rf-card-line-strong)] border-t-[var(--rf-blue-bright)]" />
      {label && <p className="text-sm text-[var(--rf-muted)]">{label}</p>}
    </div>
  )
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="rf-card grid place-items-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="max-w-md text-sm text-[var(--rf-muted)]">{detail}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

// Client-side gate: shows a loading state while the session resolves, then
// redirects unauthenticated users to /login. Renders children only when a
// real user is present — never a fake authenticated shell.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/projects')
  }, [loading, user, router])

  if (loading) return <Spinner label="Loading your session…" />
  if (!user) return <Spinner label="Redirecting to sign in…" />
  return <>{children}</>
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  return (
    <header className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3">
      <Link href="/projects" className="flex items-center gap-2 font-semibold text-white">
        <span className="rf-mono text-sm tracking-tight text-[var(--rf-blue-bright)]">RankForge</span>
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {user && <span className="text-[var(--rf-muted)]">{user.email}</span>}
        <button
          onClick={async () => {
            await logout()
            router.replace('/login')
          }}
          className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          Log out
        </button>
      </div>
    </header>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--rf-muted)]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-[var(--rf-card-line-strong)] bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[var(--rf-blue-bright)]'
