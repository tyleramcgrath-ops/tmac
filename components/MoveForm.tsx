'use client'

import { useActionState } from 'react'
import type { MoveResult } from '@/app/dashboard/sites/[id]/manage-actions'

export function MoveForm({ action }: { action: (prev: MoveResult, form: FormData) => Promise<MoveResult> }) {
  const [state, run, pending] = useActionState(action, {})
  return (
    <div className="stack">
      <form action={run} className="move-form">
        <label className="field" style={{ margin: 0, flex: 1 }}>
          <span>Your current website</span>
          <input className="input" name="url" placeholder="www.yourfirm.com" required maxLength={300} inputMode="url" autoComplete="url" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Reading your site…' : 'Import my pages'}</button>
      </form>
      {pending && <p className="muted small" style={{ margin: 0 }}>Reading up to 40 pages. This usually takes under a minute.</p>}
      {state.error && <p className="notice bad" role="alert">{state.error}</p>}
      {state.imported && (
        <div className="move-result" role="status">
          <p className="notice good">
            <strong>{state.imported.length} page{state.imported.length === 1 ? '' : 's'} imported from {state.start?.replace(/^https?:\/\//, '')}</strong>
            {state.redirects ? `, with ${state.redirects} redirect${state.redirects === 1 ? '' : 's'} so old addresses keep working.` : '.'} They’re saved as drafts below.
          </p>
          {state.skipped && state.skipped.length > 0 && (
            <details>
              <summary className="small">{state.skipped.length} page{state.skipped.length === 1 ? '' : 's'} skipped</summary>
              <ul className="small muted">{state.skipped.map((s) => <li key={s.from}><code>{s.from}</code>: {s.reason}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
