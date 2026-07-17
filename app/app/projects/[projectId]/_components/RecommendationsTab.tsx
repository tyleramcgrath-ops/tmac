'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AgentReportDTO, type ConsensusMetricsDTO, type RecommendationDTO } from '../../../lib/client'
import { EmptyState, Spinner } from '../../../lib/ui'
import { SeverityDot, StatusChip } from './shared'
import { DeployFromRecommendation } from './DeployFromRecommendation'
import { AgentTeamStrip, ConsensusBlock } from './AgentPanel'

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

  if (recs === null) return <Spinner label="Loading recommendations…" />
  if (recs.length === 0) return <EmptyState title="No recommendations yet" detail="Run a scan on the Audit tab. Recommendations are derived from real crawl findings and stored with evidence and confidence." />

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {metrics && agents.length > 0 && <AgentTeamStrip agents={agents} metrics={metrics} />}
      {recs.map((r) => (
        <div key={r.id} className="rf-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SeverityDot s={r.severity} />
                <p className="font-medium text-white">{r.title}</p>
              </div>
              <p className="mt-1 text-xs text-[var(--rf-muted)]">{r.reasoning}</p>
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
                Deploy fix →
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
