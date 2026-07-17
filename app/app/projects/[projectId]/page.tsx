'use client'

// Project workspace shell (Phase D.6 P8). This file owns ONLY page-level
// concerns: project fetch, error/loading gating, and tab routing. Each tab's
// presentation + state lives in its own module under ./_components, so no
// single file carries five tabs, three forms, and a modal at once.

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError, type ProjectDTO, type ScanSummary } from '../../lib/client'
import { EmptyState, Spinner } from '../../lib/ui'
import { DangerZone } from './_components/shared'
import { AuditTab } from './_components/AuditTab'
import { RecommendationsTab } from './_components/RecommendationsTab'
import { OperatorTab } from './_components/OperatorTab'
import { WordPressTab } from './_components/WordPressTab'
import { HistoryTab } from './_components/HistoryTab'

type Tab = 'audit' | 'recommendations' | 'operator' | 'wordpress' | 'history'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [tab, setTab] = useState<Tab>('audit')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { project, scans } = await api.getProject(projectId)
      setProject(project)
      setScans(scans)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Project not found, or you do not have access.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not load project.')
      }
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  if (error) return <EmptyState title="Unavailable" detail={error} action={<Link href="/app/projects" className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Back to projects</Link>} />
  if (!project) return <Spinner label="Loading project…" />

  const tabs: { id: Tab; label: string }[] = [
    { id: 'audit', label: 'Audit' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'operator', label: 'Operator' },
    { id: 'wordpress', label: 'WordPress' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/app/projects" className="rf-mono text-xs text-[var(--rf-muted)] hover:text-white">← Projects</Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{project.name}</h1>
          <p className="rf-mono text-sm text-[var(--rf-blue-bright)]">{project.domain}</p>
        </div>
        <DangerZone projectId={projectId} onDeleted={() => router.replace('/app/projects')} />
      </div>

      <div className="flex gap-1 border-b border-[var(--rf-card-line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-b-2 border-[var(--rf-blue-bright)] text-white' : 'text-[var(--rf-muted)] hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'audit' && <AuditTab project={project} scans={scans} onScanDone={load} />}
      {tab === 'recommendations' && <RecommendationsTab projectId={projectId} />}
      {tab === 'operator' && <OperatorTab projectId={projectId} />}
      {tab === 'wordpress' && <WordPressTab projectId={projectId} />}
      {tab === 'history' && <HistoryTab scans={scans} />}
    </div>
  )
}
