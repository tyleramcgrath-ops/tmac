'use client'

import { useActionState } from 'react'
import { createRedesign } from '@/app/redesign/actions'

export function RedesignForm({ id = 'redesign-url', dark = false }: { id?: string; dark?: boolean }) {
  const [state, run, pending] = useActionState(createRedesign, {})
  return (
    <form className="say" action={run}>
      <label htmlFor={id} className="visually-hidden">Your current website</label>
      <input id={id} name="url" placeholder="yourbusiness.com" autoComplete="url" inputMode="url" maxLength={300} required />
      <button className={`b ${dark ? 'b-dark' : 'b-light'}`} type="submit" disabled={pending}>{pending ? 'Rebuilding…' : 'See it redesigned'}</button>
      {pending && <p className="redesign-wait">Reading your pages and rebuilding them. About ten seconds.</p>}
      {state.error && <p className="redesign-err" role="alert">{state.error}</p>}
    </form>
  )
}
