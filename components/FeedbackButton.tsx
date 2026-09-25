'use client'

import { useActionState, useState } from 'react'
import { usePathname } from 'next/navigation'
import { sendFeedback } from '@/app/feedback-actions'

// A small "Feedback" tab in the corner of the dashboard. Everything sent
// lands in the SaySites team's inbox (/dashboard/feedback).
export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(sendFeedback, {})
  const page = usePathname()
  return (
    <div className="fb">
      {open && (
        <form action={action} className="fb-panel card">
          {state.sent ? (
            <p><strong>Thank you!</strong> Tyler reads every one of these.</p>
          ) : (
            <>
              <label className="field">
                <span>What do you think? What’s confusing, broken or missing?</span>
                <textarea className="input" name="text" rows={5} required maxLength={3000} autoFocus />
              </label>
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
