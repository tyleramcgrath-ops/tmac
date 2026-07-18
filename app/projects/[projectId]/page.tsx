'use client'

// Project workspace entry. New projects land in the connect-first onboarding
// (confirm site → run first audit → connect WordPress/Google); once a real
// audit exists the project opens in the full Command Center dashboard. All data
// is server-side and persisted — the dashboard derives its views from the
// latest scan, never from localStorage.

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiError, type ProjectDTO, type ScanSummary } from '../../lib/client'
import { EmptyState, Spinner } from '../../lib/ui'
import { ProjectDashboard } from './_components/ProjectDashboard'
import { ConnectFirst } from './_components/ConnectFirst'

type Mode = 'loading' | 'wizard' | 'dashboard'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [mode, setMode] = useState<Mode>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { project, scans } = await api.getProject(projectId)
      setProject(project)
      setScans(scans)
      // Decide the entry mode only once, on first load: returning projects with
      // a completed audit open straight into the dashboard; brand-new ones start
      // in onboarding. Later reloads (after running an audit) never yank the user
      // out of whichever surface they're on.
      setMode((prev) => {
        if (prev !== 'loading') return prev
        const hasScan = scans.some((s) => s.status === 'completed' || s.status === 'complete')
        return hasScan ? 'dashboard' : 'wizard'
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError('Project not found, or you do not have access.')
      else setError(err instanceof ApiError ? err.message : 'Could not load project.')
    }
  }, [projectId])

  useEffect(() => { void load() }, [load])

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <EmptyState title="Unavailable" detail={error} action={<Link href="/projects" className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Back to projects</Link>} />
      </div>
    )
  }
  if (!project || mode === 'loading') return <Spinner label="Loading project…" />

  if (mode === 'wizard') {
    return <ConnectFirst project={project} scans={scans} onReload={load} onEnter={() => setMode('dashboard')} />
  }
  return <ProjectDashboard project={project} scans={scans} onReload={load} />
}
