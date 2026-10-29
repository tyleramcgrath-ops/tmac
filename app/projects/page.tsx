'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiError, type ProjectDTO } from '../lib/client'
import { AppHeader, EmptyState, Field, inputClass, Spinner } from '../lib/ui'
import { PilotBar } from '../lib/PilotBar'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const { projects } = await api.listProjects()
      setProjects(projects)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load projects.')
      setProjects([])
    }
  }
  useEffect(() => {
    void load()
  }, [])

  return (
    <>
      <AppHeader />
      <PilotBar />
      <main className="mx-auto max-w-5xl px-5 pb-8 pt-2">
        {projects === null ? <Spinner label="Loading projects…" /> : <ProjectsInner projects={projects} setProjects={setProjects} error={error} creating={creating} setCreating={setCreating} />}
      </main>
    </>
  )
}

function ProjectsInner({ projects, setProjects, error, creating, setCreating }: { projects: ProjectDTO[]; setProjects: React.Dispatch<React.SetStateAction<ProjectDTO[] | null>>; error: string; creating: boolean; setCreating: (v: boolean) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-[var(--rf-muted)]">Each project is a real website you audit and optimize.</p>
        </div>
        <button onClick={() => setCreating(true)} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
          New project
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          detail="Create your first project to run a persistent audit. Your projects are stored server-side and survive logout, refresh, and switching devices."
          action={
            <button onClick={() => setCreating(true)} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
              Create a project
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="rf-card rf-card-hover block p-4">
              <p className="font-semibold text-white">{p.name}</p>
              <p className="rf-mono text-xs text-[var(--rf-blue-bright)]">{p.domain}</p>
              {p.industry && <p className="mt-1 text-xs text-[var(--rf-muted)]">{p.industry}</p>}
              <p className="mt-2 text-[11px] text-[var(--rf-faint)]">Created {new Date(p.createdAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <CreateProjectModal
          onClose={() => setCreating(false)}
          onCreated={(p) => {
            setCreating(false)
            setProjects((prev) => [...(prev ?? []), p])
          }}
        />
      )}
    </div>
  )
}

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: ProjectDTO) => void }) {
  const [form, setForm] = useState({ name: '', domain: '', industry: '', businessProfile: '', notes: '' })
  const [goal, setGoal] = useState('')
  const [locations, setLocations] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const goals = [goal && `Primary conversion goal: ${goal}`, locations && `Target locations: ${locations}`].filter(
        Boolean
      ) as string[]
      const { project } = await api.createProject({
        name: form.name || form.domain,
        domain: form.domain,
        industry: form.industry,
        businessProfile: form.businessProfile,
        notes: form.notes,
        goals,
      })
      onCreated(project)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the project.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="rf-card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6"
      >
        <h2 className="text-lg font-semibold text-white">New project</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Domain">
            <input required placeholder="example.com" className={inputClass} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </Field>
          <Field label="Name">
            <input placeholder="Acme Inc." className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Industry">
            <input className={inputClass} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          </Field>
          <Field label="Primary conversion goal">
            <input placeholder="Book a consultation" className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
          <Field label="Target locations">
            <input placeholder="Austin, TX" className={inputClass} value={locations} onChange={(e) => setLocations(e.target.value)} />
          </Field>
        </div>
        <Field label="Business model / what they sell">
          <textarea rows={2} className={inputClass} value={form.businessProfile} onChange={(e) => setForm({ ...form, businessProfile: e.target.value })} />
        </Field>
        <Field label="Notes">
          <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  )
}
