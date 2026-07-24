'use client'

// Resolves which project Headquarters represents: a single "flagship"
// project per org, auto-selected (not a picker) — see the Phase 2 plan.
// A stored preference wins so switching projects (once a switcher exists)
// sticks across visits; otherwise the most recently updated project is a
// sane default. Never blocks the wake cinematic — callers gate panels on
// `loading`, not the room/compass.

import { useEffect, useRef, useState } from 'react'
import { api, type ProjectDTO } from '../lib/client'

const STORAGE_KEY = 'ns-hq'

function readStoredProjectId(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return typeof saved.projectId === 'string' ? saved.projectId : null
  } catch {
    return null
  }
}

function persistProjectId(id: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, projectId: id }))
  } catch {}
}

export interface DeskContext {
  project: ProjectDTO | null
  projectId: string | null
  loading: boolean
  error: string | null
  setProjectId: (id: string) => void
}

// `ready` lets the caller delay the fetch until auth has resolved.
export function useDeskContext(ready: boolean): DeskContext {
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [projectId, setProjectIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const projectsRef = useRef<ProjectDTO[]>([])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { projects } = await api.listProjects()
        if (cancelled) return
        projectsRef.current = projects
        if (projects.length === 0) {
          setLoading(false)
          return
        }
        const storedId = readStoredProjectId()
        const stored = storedId ? projects.find((p) => p.id === storedId) : undefined
        const flagship = stored ?? [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
        setProject(flagship)
        setProjectIdState(flagship.id)
        persistProjectId(flagship.id)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your project.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready])

  const setProjectId = (id: string) => {
    const found = projectsRef.current.find((p) => p.id === id)
    if (!found) return
    setProject(found)
    setProjectIdState(id)
    persistProjectId(id)
  }

  return { project, projectId, loading, error, setProjectId }
}
