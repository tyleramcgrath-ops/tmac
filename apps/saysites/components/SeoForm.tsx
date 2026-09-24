'use client'

import { useActionState, useState } from 'react'
import type { SettingsState } from '@/app/dashboard/sites/[id]/manage-actions'

type Action = (prev: SettingsState, form: FormData) => Promise<SettingsState>

// One page's Google listing, with a live preview of how it looks in search.
export function SeoForm({ action, url, title, description, noindex }: { action: Action; url: string; title: string; description: string; noindex: boolean }) {
  const [state, run, pending] = useActionState(action, {})
  const [t, setT] = useState(title)
  const [d, setD] = useState(description)
  return (
    <form action={run} className="seo-form">
      <div className="serp" aria-label="How it looks on Google">
        <span className="serp-url">{url.replace('https://', '')}</span>
        <span className="serp-title">{t || 'Page title'}</span>
        <span className="serp-desc">{d || 'Page description'}</span>
      </div>
      <label className="field">
        <span>Google title <em className={t.length > 60 ? 'count over' : 'count'}>{t.length}/60</em></span>
        <input className="input" name="title" value={t} onChange={(e) => setT(e.target.value)} maxLength={70} required />
      </label>
      <label className="field">
        <span>Google description <em className={d.length > 160 ? 'count over' : 'count'}>{d.length}/160</em></span>
        <textarea className="input" name="description" value={d} onChange={(e) => setD(e.target.value)} maxLength={170} rows={3} required />
      </label>
      <label className="check">
        <input type="checkbox" name="noindex" defaultChecked={noindex} /> Hide this page from Google
      </label>
      <div className="save-row">
        {state.error && <p className="error" role="alert">{state.error}</p>}
        {state.saved && !pending && <p className="saved" role="status">Saved.</p>}
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  )
}
