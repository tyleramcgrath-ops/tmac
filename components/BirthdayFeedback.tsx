'use client'

import { useActionState } from 'react'
import { sendFeedback } from '@/app/feedback-actions'

export function BirthdayFeedback() {
  const [state, action, pending] = useActionState(sendFeedback, {})
  if (state.sent) return <p className="bd-thanks"><strong>Got it, thank you.</strong> That’s the best present.</p>
  return (
    <form action={action} className="bd-form">
      <input type="hidden" name="page" value="/birthday" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="fb-hp" aria-hidden="true" />
      <div className="bd-row">
        <label><span>Your name</span><input name="name" maxLength={80} autoComplete="name" /></label>
        <label><span>Email <em>(optional, if you want a reply)</em></span><input name="email" type="email" maxLength={200} autoComplete="email" /></label>
      </div>
      <label><span>What did you think? Be honest.</span><textarea name="text" rows={5} required maxLength={3000} /></label>
      {state.error && <p className="bd-error">{state.error}</p>}
      <button className="b b-dark" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send it to Tyler'}</button>
    </form>
  )
}
