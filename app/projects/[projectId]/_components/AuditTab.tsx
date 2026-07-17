'use client'

import { useState } from 'react'
import { api, ApiError, type ProjectDTO, type ScanSummary } from '../../../lib/client'
import { EmptyState } from '../../../lib/ui'
import { runCrawl } from '../../../lib/crawl-runner'
import { Stat, StatusChip } from './shared'

export function AuditTab({ project, scans, onScanDone }: { project: ProjectDTO; scans: ScanSummary[]; onScanDone: () => void }) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const latest = scans[0]

  async function run() {
    setRunning(true)
    setError('')
    setProgress('Starting scan…')
    let scanId = ''
    try {
      const started = await api.startScan(project.id)
      scanId = started.scan.id
      const result = await runCrawl(project.domain, (msg) => setProgress(msg))
      setProgress('Saving results…')
      await api.completeScan(project.id, scanId, result.pages, result.blocked, result.discovered)
      onScanDone()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'The crawl failed.'
      setError(message)
      if (scanId) await api.failScan(project.id, scanId, message).catch(() => {})
    } finally {
      setRunning(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--rf-muted)]">Run a real crawl of {project.domain}. Results are persisted to this project.</p>
        <button onClick={run} disabled={running} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {running ? 'Crawling…' : 'Run scan'}
        </button>
      </div>
      {running && <div className="rf-card p-4 text-sm text-[var(--rf-muted)]">{progress}</div>}
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!running && !latest && <EmptyState title="No scans yet" detail="Run your first scan to populate this project's audit, recommendations, and history." />}
      {latest && (
        <div className="rf-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Latest scan</p>
            <StatusChip status={latest.status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Site score" value={String(latest.summary.siteScore)} />
            <Stat label="Pages crawled" value={String(latest.summary.pagesCrawled)} />
            <Stat label="Blocked (unknown)" value={String(latest.summary.blockedCount)} />
            <Stat label="Critical issues" value={String(latest.summary.critical)} />
          </div>
          <p className="mt-3 text-[11px] text-[var(--rf-faint)]">Ran {new Date(latest.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}
