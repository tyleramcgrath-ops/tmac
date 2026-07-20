'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../../lib/client'
import { useAuth } from '../../lib/auth-context'
import { Spinner } from '../../lib/ui'
import '../../rankforge/rankforge.css'

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const [preview, setPreview] = useState<{ orgName: string; role: string; email: string } | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    api
      .previewInvitation(token)
      .then(setPreview)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'This invitation link is invalid.'))
  }, [token])

  async function accept() {
    setAccepting(true)
    setError('')
    try {
      await api.acceptInvitation(token)
      await refresh()
      router.replace('/projects')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept this invitation.')
      setAccepting(false)
    }
  }

  return (
    <div className="rf-root grid min-h-screen place-items-center bg-[var(--rf-bg)] px-4">
      <div className="w-full max-w-sm rf-card p-6 text-center">
        <span className="rf-mono text-sm tracking-tight text-[var(--rf-blue-bright)]">RankForge</span>
        {!preview && !error && <Spinner label="Loading invitation…" />}
        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-300">{error}</p>
            <Link href="/projects" className="rf-btn-ghost inline-block rounded-lg px-4 py-2 text-xs font-medium">
              Go to your projects
            </Link>
          </div>
        )}
        {preview && !error && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-white">
              You&apos;ve been invited to join <strong>{preview.orgName}</strong> as {preview.role}.
            </p>
            {authLoading ? (
              <Spinner />
            ) : !user ? (
              <div className="space-y-2">
                <p className="text-xs text-[var(--rf-muted)]">Log in or sign up with {preview.email} to accept.</p>
                <div className="flex justify-center gap-2">
                  <Link href={`/login?next=/invite/${token}`} className="rf-btn-primary rounded-lg px-4 py-2 text-xs font-semibold">
                    Log in
                  </Link>
                  <Link href="/signup" className="rf-btn-ghost rounded-lg px-4 py-2 text-xs font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
            ) : user.email !== preview.email ? (
              <p className="text-xs text-red-300">
                You&apos;re logged in as {user.email}, but this invitation was sent to {preview.email}. Log out and sign in with that address to accept.
              </p>
            ) : (
              <button onClick={() => void accept()} disabled={accepting} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {accepting ? 'Joining…' : `Accept & join ${preview.orgName}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
