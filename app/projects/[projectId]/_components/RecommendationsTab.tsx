'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api, ApiError, type AgentReportDTO, type ConsensusMetricsDTO, type RecommendationDTO } from '../../../lib/client'
import { EmptyState, Spinner } from '../../../lib/ui'
import { SeverityDot, StatusChip } from './shared'
import { DeployFromRecommendation } from './DeployFromRecommendation'
import { BulkFixBar } from './BulkFixBar'
import { AgentTeamStrip, ConsensusBlock } from './AgentPanel'
import { downloadCsv } from '../../../lib/csv'

function exportRecommendationsCsv(recs: RecommendationDTO[]) {
  const rows: (string | number)[][] = [
    ['Title', 'Category', 'Severity', 'Status', 'Confidence', 'Affected URLs', 'Reasoning', 'Created'],
    ...recs.map((r) => [r.title, r.category, r.severity, r.status, r.confidence, r.evidence.affectedUrls.join('; '), r.reasoning, r.createdAt]),
  ]
  downloadCsv(`rankforge-recommendations-${new Date().toISOString().slice(0, 10)}.csv`, rows)
}

export function RecommendationsTab({ projectId }: { projectId: string }) {
  const [recs, setRecs] = useState<RecommendationDTO[] | null>(null)
  const [agents, setAgents] = useState<AgentReportDTO[]>([])
  const [metrics, setMetrics] = useState<ConsensusMetricsDTO | null>(null)
  const [error, setError] = useState('')
  const [deployRec, setDeployRec] = useState<RecommendationDTO | null>(null)

  const load = useCallback(async () => {
    try {
      const { recommendations, agents, metrics } = await api.listRecommendations(projectId)
      setRecs(recommendations)
      setAgents(agents)
      setMetrics(metrics)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load recommendations.')
      setRecs([])
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(id: string, status: string) {
    try {
      const { recommendation } = await api.setRecommendationStatus(projectId, id, status)
      setRecs((prev) => (prev ?? []).map((r) => (r.id === id ? recommendation : r)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update.')
    }
  }

  // Human priority override (Phase H): move a recommendation up/down by setting
  // its userPriority just across its neighbour's effective rank, then reload so
  // the server-side ordering is authoritative.
  const effRank = (r: RecommendationDTO) => r.userPriority ?? (r.priorityRank ?? 9999)
  async function move(index: number, dir: -1 | 1) {
    if (!recs) return
    const target = index + dir
    if (target < 0 || target >= recs.length) return
    const me = recs[index]
    const neighbour = recs[target]
    const newPriority = dir < 0 ? effRank(neighbour) - 0.5 : effRank(neighbour) + 0.5
    try {
      await api.setRecommendationPriority(projectId, me.id, newPriority)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reorder.')
    }
  }
  async function resetPriority(id: string) {
    try {
      await api.setRecommendationPriority(projectId, id, null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset priority.')
    }
  }

  if (recs === null) return <Spinner label="Loading recommendations…" />
  if (recs.length === 0) return <EmptyState title="No recommendations yet" detail="Run a scan on the Audit tab. Recommendations are derived from real crawl findings and stored with evidence and confidence." />

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <BulkFixBar projectId={projectId} label="Fix everything" onFixed={load} />
      <div className="flex justify-end">
        <button onClick={() => exportRecommendationsCsv(recs)} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      {metrics && agents.length > 0 && <AgentTeamStrip agents={agents} metrics={metrics} />}
      {recs.map((r, index) => (
        <div key={r.id} className="rf-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {/* Priority reorder controls (Phase H) */}
              <div className="flex flex-col items-center gap-0.5 pt-0.5">
                <span className="rf-mono text-[10px] text-[var(--rf-faint)]">#{index + 1}</span>
                <button onClick={() => move(index, -1)} disabled={index === 0} className="rf-btn-ghost rounded px-1 text-[10px] leading-none disabled:opacity-30" title="Move up">▲</button>
                <button onClick={() => move(index, 1)} disabled={index === recs.length - 1} className="rf-btn-ghost rounded px-1 text-[10px] leading-none disabled:opacity-30" title="Move down">▼</button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SeverityDot s={r.severity} />
                  <p className="font-medium text-white">{r.title}</p>
                  {r.userPriority !== undefined && (
                    <button onClick={() => resetPriority(r.id)} className="rf-mono rounded border border-[var(--rf-card-line)] px-1 text-[9px] uppercase text-[var(--rf-blue-bright)]" title="Custom priority — click to reset to the engine's ranking">pinned ✕</button>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--rf-muted)]">{r.reasoning}</p>
              </div>
            </div>
            <StatusChip status={r.status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[var(--rf-muted)] sm:grid-cols-4">
            <span>Confidence: <b className="text-white">{r.confidence}</b></span>
            <span>Impact: <b className="text-white">{r.expectedImpact.size}</b> ({r.expectedImpact.category})</span>
            <span>Risk: <b className="text-white">{r.risk.level}</b></span>
            <span>Evidence: <b className="text-white">{r.evidence.affectedUrls.length}</b> URLs</span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--rf-faint)]">{r.confidenceBasis}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {['accepted', 'modified', 'rejected', 'dismissed', 'open'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(r.id, s)}
                disabled={r.status === s}
                className="rf-btn-ghost rounded-md px-2.5 py-1 text-[11px] capitalize disabled:opacity-40"
              >
                {s}
              </button>
            ))}
            {r.evidence.affectedUrls.length > 0 && (
              <button
                onClick={() => setDeployRec(r)}
                className="rf-btn-primary rounded-md px-2.5 py-1 text-[11px] font-semibold"
              >
                Fix on WordPress →
              </button>
            )}
          </div>
          {r.coordination && <ConsensusBlock coordination={r.coordination} />}
        </div>
      ))}
      {deployRec && (
        <DeployFromRecommendation
          projectId={projectId}
          rec={deployRec}
          onClose={() => setDeployRec(null)}
          onDeployed={() => {
            setDeployRec(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
