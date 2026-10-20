'use client'

import { useActionState } from 'react'

type State = { error?: string; email?: string } | null

/** Sign-in form; keeps the email filled in after a failed attempt. */
export function LoginForm({ action }: { action: (prev: State, form: FormData) => Promise<State> }) {
  const [state, run, pending] = useActionState(action, null)
  return (
    <form action={run} className="ad-form">
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" defaultValue={state?.email ?? ''} key={state?.email ?? ''} /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      {state?.error && <p className="form-note err" role="alert">{state.error}</p>}
    </form>
  )
}
