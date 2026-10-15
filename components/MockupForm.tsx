'use client'

import { useActionState } from 'react'
import { requestMockup } from '@/app/mockup/actions'

export function MockupForm() {
  const [state, run, pending] = useActionState(requestMockup, {})
  if (state.done)
    return (
      <p className="mockup-done" role="status">
        Thanks, we have it. You’ll get a picture of your homepage redesigned by email, usually within one business day.
      </p>
    )
  return (
    <form className="mockup-form" action={run}>
      <label><span>Your website</span><input name="url" placeholder="yourbusiness.com" inputMode="url" autoComplete="url" maxLength={300} required /></label>
      <label><span>Business name</span><input name="business" autoComplete="organization" maxLength={120} /></label>
      <label><span>Your name</span><input name="name" autoComplete="name" maxLength={120} required /></label>
      <label><span>Email for the mockup</span><input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
      <label className="wide"><span>Anything we should know? <em>(optional)</em></span><textarea name="note" rows={3} maxLength={600} placeholder="What you do, the towns you serve, what you'd like to look better." /></label>
      <input className="visually-hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
      <button className="b b-light" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send me my free mockup'}</button>
      {state.error && <p className="redesign-err" role="alert">{state.error}</p>}
    </form>
  )
}
