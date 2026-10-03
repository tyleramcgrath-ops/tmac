'use client'

import { useActionState, useState } from 'react'
import { usePathname } from 'next/navigation'
import { sendFeedback } from '@/app/feedback-actions'
import { FEEDBACK_MIN_CHARS } from '@/lib/billing'

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

// A small "Feedback" tab in the corner of the dashboard. Everything sent
// lands in the SaySites team's inbox (/dashboard/feedback). While an owner
// can still earn it, a quiet line says real feedback earns 3 months free.
export function FeedbackButton({ offer = false }: { offer?: boolean }) {
  const [open, setOpen] = useState(false)
  const [length, setLength] = useState(0)
  const [state, action, pending] = useActionState(sendFeedback, {})
  const page = usePathname()
  const earned = length >= FEEDBACK_MIN_CHARS
  return (
    <div className="fb">
      {open && (
        <form action={action} className="fb-panel card">
          {state.sent ? (
            state.freeUntil ? (
              <p><strong>Thank you. Your next 3 months are on us.</strong> Your free time now runs to {longDate(state.freeUntil)}. Every one of these gets read.</p>
            ) : (
              <p><strong>Thank you!</strong> Every one of these gets read.</p>
            )
          ) : (
            <>
              <label className="field">
                <span>What do you think? What’s confusing, broken or missing?</span>
                <textarea className="input" name="text" rows={5} required maxLength={3000} autoFocus onChange={(e) => setLength(e.target.value.trim().length)} />
              </label>
              {offer && (
                <p className={`fb-offer${earned ? ' is-earned' : ''}`}>
                  {earned ? '✓ That earns you 3 months free.' : 'A few honest sentences earns you 3 months free.'}
                  {!earned && length > 0 && <span className="fb-meter"><i style={{ width: `${Math.min(100, (length / FEEDBACK_MIN_CHARS) * 100)}%` }} /></span>}
                </p>
              )}
              <input type="hidden" name="page" value={page} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="fb-hp" aria-hidden="true" />
              {state.error && <p className="error">{state.error}</p>}
              <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send'}</button>
            </>
          )}
        </form>
      )}
      <button type="button" className="fb-tab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Close' : 'Feedback'}</button>
    </div>
  )
}
