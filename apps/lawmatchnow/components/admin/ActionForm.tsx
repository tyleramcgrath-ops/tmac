'use client'

import { useActionState, type ReactNode } from 'react'

type Result = { ok?: string; error?: string } | null

/** A form bound to a server action that reports success or an error inline. */
export function ActionForm({ action, children, submit, pendingLabel = 'Working…' }: {
  action: (prev: Result, form: FormData) => Promise<Result>; children?: ReactNode; submit: string; pendingLabel?: string
}) {
  const [state, run, pending] = useActionState(action, null)
  return (
    <form action={run} className="ad-form">
      {children}
      <button className="btn btn-primary" disabled={pending}>{pending ? pendingLabel : submit}</button>
      {state?.ok && <p className="form-note ok" role="status">{state.ok}</p>}
      {state?.error && <p className="form-note err" role="alert">{state.error}</p>}
    </form>
  )
}
