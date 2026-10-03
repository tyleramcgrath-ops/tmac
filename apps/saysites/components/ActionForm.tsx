'use client'

import { useActionState } from 'react'

type State = { error?: string; saved?: string | boolean }

// A small form around a server action, with its error or success message.
export function ActionForm<S extends State>({ action, submit, danger = false, children }: { action: (prev: S, form: FormData) => Promise<S>; submit: string; danger?: boolean; children: React.ReactNode }) {
  const [state, run, pending] = useActionState(action as unknown as (prev: State, form: FormData) => Promise<State>, {})
  return (
    <form action={run} className="action-form">
      {children}
      <div className="save-row">
        {state.error && <p className="error" role="alert">{state.error}</p>}
        {state.saved && !pending && <p className="saved" role="status">{typeof state.saved === 'string' ? state.saved : 'Saved.'}</p>}
        <button className={danger ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'} type="submit" disabled={pending}>{pending ? 'Working…' : submit}</button>
      </div>
    </form>
  )
}
