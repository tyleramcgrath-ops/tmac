'use client'

// Pilot admin (staff-only). The backing routes 404 for non-staff callers —
// deliberately indistinguishable from a route that doesn't exist — so this
// page renders the same generic "not found" state on a 404, never a
// "you're not authorized" message that would confirm the surface exists.

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AdminFeedbackDTO, type AdminOrgDTO, type PilotDTO } from '../lib/client'
import { RequireAuth, Spinner } from '../lib/ui'

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  )
}

function AdminInner() {
  const [orgs, setOrgs] = useState<AdminOrgDTO[] | null>(null)
  const [feedback, setFeedback] = useState<AdminFeedbackDTO[]>([])
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [{ orgs }, { feedback }] = await Promise.all([api.adminListOrgs(), api.adminListFeedback()])
      setOrgs(orgs)
      setFeedback(feedback)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
        return
      }
      setError(err instanceof ApiError ? err.message : 'Could not load admin data.')
      setOrgs([])
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  if (notFound) {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-white">404</h1>
        <p className="mt-2 text-sm text-[var(--rf-muted)]">This page could not be found.</p>
      </main>
    )
  }
  if (orgs === null) return <Spinner label="Loading…" />

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-5 py-8">
      <h1 className="text-2xl font-semibold text-white">Pilot admin</h1>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Organizations ({orgs.length})</h2>
        <div className="rf-card divide-y divide-[var(--rf-card-line)]">
          {orgs.map((org) => (
            <OrgRow key={org.id} org={org} onUpdated={load} />
          ))}
          {orgs.length === 0 && <p className="px-4 py-6 text-sm text-[var(--rf-muted)]">No organizations yet.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Feedback &amp; issues ({feedback.length})</h2>
        <div className="rf-card divide-y divide-[var(--rf-card-line)]">
          {feedback.map((f) => (
            <div key={f.id} className="px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-[var(--rf-muted)]">
                <span className={`rf-mono rounded border px-1.5 py-0.5 uppercase ${f.kind === 'issue' ? 'border-red-400/40 text-red-300' : 'border-[var(--rf-card-line)]'}`}>{f.kind}</span>
                <span>{f.orgName}</span>
                <span>·</span>
                <span>{f.userEmail}</span>
                <span>·</span>
                <span>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-white">{f.message}</p>
            </div>
          ))}
          {feedback.length === 0 && <p className="px-4 py-6 text-sm text-[var(--rf-muted)]">No feedback submitted yet.</p>}
        </div>
      </section>
    </main>
  )
}

function OrgRow({ org, onUpdated }: { org: AdminOrgDTO; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<PilotDTO['status']>(org.pilot?.status ?? 'active')
  const [expiresAt, setExpiresAt] = useState(org.pilot?.expiresAt ? org.pilot.expiresAt.slice(0, 10) : '')
  const [notes, setNotes] = useState(org.pilot?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.adminSetPilot(org.id, {
        status,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes,
      })
      setEditing(false)
      onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{org.name}</p>
          <p className="truncate text-xs text-[var(--rf-muted)]">
            {org.ownerEmail ?? '(no owner)'} · {org.memberCount} member{org.memberCount === 1 ? '' : 's'} · {org.projectCount} project{org.projectCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rf-mono rounded border px-1.5 py-0.5 text-[10px] uppercase ${org.pilot?.status === 'active' ? 'border-[var(--rf-green)]/40 text-[var(--rf-green)]' : org.pilot ? 'border-red-400/40 text-red-300' : 'border-[var(--rf-card-line)] text-[var(--rf-faint)]'}`}>
            {org.pilot?.status ?? 'no pilot set'}
          </span>
          <button onClick={() => setEditing((v) => !v)} className="rf-btn-ghost rounded-md px-2 py-1 text-xs">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>
      {org.pilot?.expiresAt && !editing && (
        <p className="mt-1 text-xs text-[var(--rf-faint)]">Expires {new Date(org.pilot.expiresAt).toLocaleDateString()}</p>
      )}
      {org.pilot?.notes && !editing && <p className="mt-1 text-xs text-[var(--rf-faint)]">{org.pilot.notes}</p>}

      {editing && (
        <div className="mt-3 space-y-2 border-t border-[var(--rf-card-line)] pt-3">
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PilotDTO['status'])}
              className="rf-mono rounded-md border border-[var(--rf-card-line)] bg-transparent px-2 py-1.5 text-xs text-white"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-md border border-[var(--rf-card-line)] bg-transparent px-2 py-1.5 text-xs text-white"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes (not shown to the org)"
            rows={2}
            className="w-full rounded-md border border-[var(--rf-card-line)] bg-transparent px-2 py-1.5 text-xs text-white"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button onClick={() => void save()} disabled={saving} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
