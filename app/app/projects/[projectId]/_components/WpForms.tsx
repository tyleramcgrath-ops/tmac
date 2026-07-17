'use client'

import { useState } from 'react'
import { api, ApiError } from '../../../lib/client'
import { Field, inputClass } from '../../../lib/ui'

export function DeployForm({ projectId, onDeployed }: { projectId: string; onDeployed: () => void }) {
  const [form, setForm] = useState({ postId: '', postType: 'pages', title: '', metaDescription: '', reason: '' })
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const changeCount = [form.title, form.metaDescription].filter(Boolean).length

  async function deploy() {
    setError('')
    setBusy(true)
    try {
      await api.deployWordpress(projectId, {
        postId: Number(form.postId),
        postType: form.postType,
        title: form.title || undefined,
        metaDescription: form.metaDescription || undefined,
        reason: form.reason,
      })
      setConfirming(false)
      setForm({ postId: '', postType: 'pages', title: '', metaDescription: '', reason: '' })
      onDeployed()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deploy failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rf-card space-y-3 p-4">
      <p className="text-sm font-semibold text-white">New deployment</p>
      <p className="text-xs text-[var(--rf-muted)]">Writes to your live site. Every change is captured (before/after), verified by read-back, and stored as a durable, reversible record.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Post ID">
          <input className={inputClass} value={form.postId} onChange={(e) => setForm({ ...form, postId: e.target.value })} />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value })}>
            <option value="pages">pages</option>
            <option value="posts">posts</option>
          </select>
        </Field>
        <Field label="Reason (required)">
          <input className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
      </div>
      <Field label="New title (optional)">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="New meta description (optional)">
        <input className={inputClass} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
      </Field>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!confirming ? (
        <button
          onClick={() => {
            if (!form.postId || !form.reason || changeCount === 0) {
              setError('Post ID, a reason, and at least one change are required.')
              return
            }
            setError('')
            setConfirming(true)
          }}
          className="rf-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          Review &amp; deploy
        </button>
      ) : (
        <div className="rounded-lg border border-[var(--rf-card-line-strong)] p-3">
          <p className="text-sm text-white">Deploy {changeCount} change{changeCount > 1 ? 's' : ''} to {form.postType}/{form.postId} on your live site?</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setConfirming(false)} className="rf-btn-ghost rounded-md px-3 py-1.5 text-xs">Cancel</button>
            <button onClick={deploy} disabled={busy} className="rf-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
              {busy ? 'Deploying…' : 'Confirm deploy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ConnectWordPress({ projectId, onConnected }: { projectId: string; onConnected: () => void }) {
  const [form, setForm] = useState({ siteUrl: '', username: '', appPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.connectWordpress(projectId, form.siteUrl, form.username, form.appPassword)
      onConnected()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not connect.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rf-card space-y-3 p-4">
      <p className="text-sm font-semibold text-white">Connect WordPress</p>
      <p className="text-xs text-[var(--rf-muted)]">Use a WordPress Application Password. It is validated against your site and stored encrypted server-side.</p>
      <Field label="Site URL">
        <input required placeholder="https://example.com" className={inputClass} value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Username">
          <input required className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>
        <Field label="Application password">
          <input required type="password" className={inputClass} value={form.appPassword} onChange={(e) => setForm({ ...form, appPassword: e.target.value })} />
        </Field>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={saving} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {saving ? 'Connecting…' : 'Connect & verify'}
      </button>
    </form>
  )
}
