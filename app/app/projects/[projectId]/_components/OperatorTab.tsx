'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type OperatorMetricsDTO, type OperatorPreviewDTO } from '../../../lib/client'
import { EmptyState, Spinner } from '../../../lib/ui'
import { Stat } from './shared'

// A rate (0-1) as a percent, or "—" when there is no data yet (null).
function pct(v: number | null): string {
  return v === null ? '—' : `${Math.round(v * 100)}%`
}

// Render one side of a char diff (the "before" = equal+delete, "after" = equal+insert).
function renderDiff(diff: OperatorPreviewDTO['diff'], side: 'delete' | 'insert'): string {
  if (!diff) return ''
  return diff.filter((s) => s.type === 'equal' || s.type === side).map((s) => s.text).join('') || '(empty)'
}

export function OperatorTab({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<OperatorMetricsDTO | null>(null)
  const [previews, setPreviews] = useState<OperatorPreviewDTO[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [log, setLog] = useState<string[]>([])

  const load = useCallback(async () => {
    setError('')
    try {
      const [m, p] = await Promise.all([api.operatorMetrics(projectId), api.operatorPreview(projectId)])
      setMetrics(m.metrics)
      // Only actionable+deployable previews are operable; keep the rest visible.
      setPreviews(p.previews)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the operator view.')
      setPreviews([])
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  const deployable = (previews ?? []).filter((p) => p.deployable)

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function run(dryRun: boolean) {
    setBusy(true)
    setError('')
    try {
      const items = [...selected].map((recommendationId) => ({ recommendationId, approve: true }))
      if (items.length === 0) {
        setError('Select at least one deployable fix.')
        setBusy(false)
        return
      }
      const res = await api.operatorDeploy(projectId, items, dryRun)
      setLog(
        res.results.map((r) => {
          if (r.dryRun) return `DRY-RUN ${r.recommendationId?.slice(0, 8)}: would deploy (${(r as { decision?: string }).decision ?? 'approved'})`
          if (r.ok) return `✓ ${r.recommendationId?.slice(0, 8)}: ${r.status}`
          if (r.reopened) return `⟲ ${r.recommendationId?.slice(0, 8)}: ${r.status} — reopened (${r.note ?? ''})`
          if (r.blocked) return `⛔ ${r.recommendationId?.slice(0, 8)}: blocked (${r.error})`
          if (r.requiresApproval) return `● ${r.recommendationId?.slice(0, 8)}: needs approval`
          return `✗ ${r.recommendationId?.slice(0, 8)}: ${r.error ?? r.stage}`
        })
      )
      if (!dryRun) {
        setSelected(new Set())
        await load()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Operator run failed.')
    } finally {
      setBusy(false)
    }
  }

  if (previews === null) return <Spinner label="Loading operator…" />

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {/* Executive metrics (execution-focused). "—" means no data yet — a fresh
          project shows no fabricated trust/success baseline (RC1 honesty fix). */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Trust score" value={metrics.trustScore === null ? '—' : String(metrics.trustScore)} />
          <Stat label="Verified fixes" value={String(metrics.verifiedImprovements)} />
          <Stat label="Pending approvals" value={String(metrics.pendingApprovals)} />
          <Stat label="Rollback rate" value={pct(metrics.rollbackRate)} />
          <Stat label="Deployments" value={String(metrics.deploymentsTotal)} />
          <Stat label="Automation success" value={pct(metrics.automationSuccessRate)} />
          <Stat label="Verify-fail rate" value={pct(metrics.verificationFailureRate)} />
          <Stat label="Avg resolution (h)" value={metrics.avgTimeToResolutionHours === null ? '—' : String(metrics.avgTimeToResolutionHours)} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Deployable fixes ({deployable.length})</p>
          <p className="text-xs text-[var(--rf-muted)]">Every deploy is previewed, verified by read-back, and reversible. Blocked/advisory fixes are shown but not deployable.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => run(true)} disabled={busy || selected.size === 0} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-40">Dry run</button>
          <button onClick={() => run(false)} disabled={busy || selected.size === 0} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
            {busy ? 'Working…' : `Approve & deploy (${selected.size})`}
          </button>
        </div>
      </div>

      {deployable.length === 0 ? (
        <EmptyState title="No deployable fixes" detail="Run a scan and generate recommendations. Title/meta fixes with a matched WordPress post become deployable here; schema/alt fixes are advisory." />
      ) : (
        <div className="space-y-2">
          {deployable.map((p) => (
            <label key={p.recommendationId} className="rf-card flex cursor-pointer gap-3 p-4">
              <input type="checkbox" checked={selected.has(p.recommendationId)} onChange={() => toggle(p.recommendationId)} className="mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{p.title}</p>
                  <span className={`rf-mono text-[10px] uppercase ${p.safety?.risk === 'blocked' ? 'text-red-300' : p.safety?.risk === 'high' ? 'text-yellow-300' : 'text-[var(--rf-muted)]'}`}>{p.safety?.risk} risk · conf {p.confidence}</span>
                </div>
                <div className="mt-2 rounded-md border border-[var(--rf-card-line)] p-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{p.fixKind} · {p.pageType}</p>
                  <p className="font-mono text-red-300">{renderDiff(p.diff, 'delete')}</p>
                  <p className="font-mono text-[var(--rf-green)]">{renderDiff(p.diff, 'insert')}</p>
                </div>
                <p className="mt-1 text-[11px] text-[var(--rf-muted)]">{p.decision?.decision === 'auto-approved' ? 'Auto-approved by policy' : p.decision?.reason} · {p.note}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {log.length > 0 && (
        <div className="rf-card p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Last run</p>
          <ul className="space-y-0.5 font-mono text-[11px] text-[var(--rf-text)]">
            {log.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
