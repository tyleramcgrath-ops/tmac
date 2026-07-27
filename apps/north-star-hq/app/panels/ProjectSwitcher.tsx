'use client'

// Which site the room is currently reporting on, and the way to add or
// switch to another. Every panel already reads its data from the selected
// projectId, so switching here re-points the whole room — briefing, agents,
// missions, performance charts and integrations all follow.

import { useEffect, useRef, useState } from 'react'
import { ApiError, type ProjectDTO } from '../lib/client'

export default function ProjectSwitcher({
  project,
  projects,
  onSelect,
  onAdd,
}: {
  project: ProjectDTO | null
  projects: ProjectDTO[]
  onSelect: (id: string) => void
  onAdd: (input: { name: string; domain: string }) => Promise<ProjectDTO>
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!project) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onAdd({ name: name.trim(), domain: domain.trim() })
      setName('')
      setDomain('')
      setAdding(false)
      setOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add that site.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ns-proj" ref={rootRef}>
      <button
        type="button"
        className="ns-proj-current"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ns-proj-name">{project.name || project.domain}</span>
        <span className="ns-proj-domain">{project.domain}</span>
      </button>

      {open && (
        <div className="ns-proj-menu" role="menu" aria-label="Your sites">
          <p className="ns-proj-menu-head">Your sites</p>
          <ul className="ns-proj-list">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === project.id}
                  className="ns-proj-item"
                  onClick={() => { onSelect(p.id); setOpen(false) }}
                >
                  <span className="ns-proj-item-name">{p.name || p.domain}</span>
                  <span className="ns-proj-item-domain">{p.domain}</span>
                </button>
              </li>
            ))}
          </ul>

          {adding ? (
            <form className="ns-proj-add" onSubmit={submit}>
              <input
                className="ns-proj-input"
                placeholder="Site name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <input
                className="ns-proj-input"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              {error && <p className="ns-proj-error">{error}</p>}
              <div className="ns-proj-add-row">
                <button type="submit" className="ns-proj-save" disabled={busy || !domain.trim()}>
                  {busy ? 'Adding…' : 'Add site'}
                </button>
                <button type="button" className="ns-proj-cancel" onClick={() => { setAdding(false); setError('') }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="ns-proj-new" onClick={() => setAdding(true)}>
              + Add a site
            </button>
          )}
        </div>
      )}
    </div>
  )
}
