'use client'

// Pilot support bar (RC2 P3/P4/P6). A thin, always-available strip under the
// header that (a) nudges unverified users to verify their email, and (b) gives
// every pilot user a one-click way to send feedback or report an issue. Kept
// minimal — it supports the workflow rather than distracting from it.

import { useEffect, useState } from 'react'
import { useAuth } from './auth-context'
import { api, ApiError } from './client'

export function PilotBar() {
  const { user, orgs, refresh } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return null
  return (
    <>
      {user.emailVerified === false && <VerifyBanner onVerified={refresh} />}
      {orgs[0] && <TrialBanner orgId={orgs[0].id} />}
      <div className="mx-auto flex max-w-5xl justify-end px-5 pt-3">
        <button onClick={() => setOpen(true)} className="rf-btn-ghost rounded-md px-2.5 py-1 text-[11px] text-[var(--rf-muted)]">
          Send feedback / report issue
        </button>
      </div>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}

// Nudges users during the trial and once it's ended — never blocks anything,
// just points at /billing. Silent when Stripe isn't configured or the org's
// already on a paid plan.
function TrialBanner({ orgId }: { orgId: string }) {
  const [days, setDays] = useState<number | null>(null)
  const [ended, setEnded] = useState(false)
  useEffect(() => {
    let cancelled = false
    api
      .billingStatus(orgId)
      .then((res) => {
        if (cancelled || !res.configured) return
        if (res.status === 'trialing') setDays(res.trialDaysRemaining ?? null)
        if (res.status === 'past_due' || res.status === 'canceled') setEnded(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [orgId])

  if (ended) {
    return (
      <div className="border-b border-amber-400/20 bg-amber-500/10 px-5 py-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs text-amber-100">
          <span>Your trial has ended — automatic fixes are paused. Audits and recommendations are still free.</span>
          <a href="/billing" className="rf-btn-ghost rounded px-2 py-0.5 text-[11px]">Upgrade →</a>
        </div>
      </div>
    )
  }
  if (days === null || days > 3) return null
  return (
    <div className="border-b border-[var(--rf-blue-bright)]/20 bg-[var(--rf-blue-bright)]/10 px-5 py-2">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs text-white">
        <span>{days} day{days === 1 ? '' : 's'} left in your trial.</span>
        <a href="/billing" className="rf-btn-ghost rounded px-2 py-0.5 text-[11px]">Upgrade →</a>
      </div>
    </div>
  )
}

function VerifyBanner({ onVerified }: { onVerified: () => void }) {
  const [sent, setSent] = useState(false)
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null)
  const [err, setErr] = useState('')
  async function resend() {
    setErr('')
    try {
      const r = await api.resendVerification()
      setSent(true)
      // No email provider configured → we get the link back to verify directly.
      setVerifyUrl(r.verifyUrl ?? null)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not resend.')
    }
  }
  return (
    <div className="border-b border-yellow-400/20 bg-yellow-500/10 px-5 py-2">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-xs text-yellow-100">
        <span>
          Please verify your email to secure your account.{' '}
          {sent && !verifyUrl && <b>Verification email sent — check your inbox.</b>}
          {verifyUrl && (
            <>Email isn’t configured on this deployment, so <a href={verifyUrl} className="font-semibold text-[var(--rf-blue-bright)] underline">click here to verify now →</a></>
          )}
          {err && <b className="text-red-300">{err}</b>}
        </span>
        <span className="flex gap-2">
          <button onClick={resend} className="rf-btn-ghost rounded px-2 py-0.5 text-[11px]">Resend link</button>
          <button onClick={onVerified} className="rf-btn-ghost rounded px-2 py-0.5 text-[11px]">I’ve verified</button>
        </span>
      </div>
    </div>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<'feedback' | 'issue'>('feedback')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  async function submit() {
    if (!message.trim()) return
    setBusy(true)
    setErr('')
    try {
      await api.submitFeedback(kind, message.trim())
      setDone(true)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send.')
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rf-card w-full max-w-md space-y-3 p-6">
        <p className="text-lg font-semibold text-white">Send feedback</p>
        {done ? (
          <>
            <p className="rounded-lg bg-[var(--rf-green)]/10 px-3 py-2 text-sm text-[var(--rf-green)]">Thanks — your {kind} was sent to the team.</p>
            <div className="flex justify-end"><button onClick={onClose} className="rf-btn-primary rounded-lg px-4 py-2 text-sm">Close</button></div>
          </>
        ) : (
          <>
            <div className="flex gap-2 text-xs">
              {(['feedback', 'issue'] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`rounded-md px-2.5 py-1 capitalize ${kind === k ? 'rf-btn-primary' : 'rf-btn-ghost'}`}>{k}</button>
              ))}
            </div>
            <textarea className="min-h-[100px] w-full rounded-lg border border-[var(--rf-card-line)] bg-transparent p-2 text-sm text-white" placeholder={kind === 'issue' ? 'What went wrong? What did you expect?' : 'What would make RankForge better for you?'} value={message} onChange={(e) => setMessage(e.target.value)} />
            {err && <p className="text-sm text-red-300">{err}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button onClick={submit} disabled={busy || !message.trim()} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">{busy ? 'Sending…' : 'Send'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
