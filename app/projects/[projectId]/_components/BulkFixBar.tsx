'use client'

// One-click "fix everything" for a tab. Reuses the exact same safety-gated,
// read-back-verified operator pipeline as the per-recommendation "Fix on
// WordPress" flow (DeployFromRecommendation) — this is only a bulk driver
// over that pipeline, never a shortcut around it. Dangerous rules (indexation/
// canonical/robots) are still hard-blocked server-side regardless of this
// click; only open recommendations the Operator judges safely deployable are
// offered here.
//
// SCALE: a site with hundreds of open recommendations can't go through the
// operator/execute route in one HTTP request — that route runs every item
// sequentially server-side and Vercel functions have a hard 120s ceiling
// (maxDuration on that route), so a single giant request would silently time
// out partway through with the client never learning what actually applied.
// Deploying in small batches keeps every request well under that ceiling,
// surfaces live progress between batches, and lets the user stop before the
// next batch starts (an in-flight batch always finishes — nothing is left
// half-applied).

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Lock, Sparkles, StopCircle } from 'lucide-react'
import { api, ApiError, type RecommendationDTO } from '../../../lib/client'

type Phase = 'loading' | 'idle' | 'confirm' | 'running' | 'done'

const BATCH_SIZE = 10

export function BulkFixBar({ projectId, categories, label, onFixed }: { projectId: string; categories?: string[]; label: string; onFixed?: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [deployable, setDeployable] = useState<RecommendationDTO[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ verified: number; failed: number; total: number; stopped?: boolean } | null>(null)
  const [billingBlocked, setBillingBlocked] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const stopRef = useRef(false)

  const load = useCallback(async () => {
    setPhase('loading')
    try {
      const { recommendations } = await api.listRecommendations(projectId)
      const open = recommendations.filter((r) => r.status === 'open' && (!categories || categories.includes(r.category)))
      if (open.length === 0) {
        setDeployable([])
        setPhase('idle')
        return
      }
      const { previews, billing } = await api.operatorPreview(projectId, open.map((r) => r.id))
      setBillingBlocked(billing.allowed ? null : billing.reason ?? 'Upgrade required to auto-deploy fixes.')
      const byId = new Map(previews.map((p) => [p.recommendationId, p]))
      const fixable = open.filter((r) => {
        const p = byId.get(r.id)
        return p?.deployable === true && p.safety?.blocked !== true
      })
      setDeployable(fixable)
      setPhase('idle')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not check for automatic fixes.')
      setDeployable([])
      setPhase('idle')
    }
  }, [projectId, categories])
  useEffect(() => {
    void load()
  }, [load])

  async function runAll() {
    setPhase('running')
    setError('')
    stopRef.current = false
    const items = deployable.map((r) => ({ recommendationId: r.id, approve: true }))
    setProgress({ done: 0, total: items.length })
    const totals = { verified: 0, failed: 0, total: 0 }
    let stopped = false
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        if (stopRef.current) { stopped = true; break }
        const batch = items.slice(i, i + BATCH_SIZE)
        const { summary } = await api.operatorDeploy(projectId, batch, false)
        totals.verified += summary.verified
        totals.failed += summary.failed
        totals.total += summary.total
        setProgress({ done: Math.min(i + BATCH_SIZE, items.length), total: items.length })
      }
      setResult({ ...totals, stopped })
      setPhase('done')
      onFixed?.()
    } catch (err) {
      setResult(totals.total > 0 ? { ...totals, stopped: true } : null)
      setError(err instanceof ApiError ? err.message : 'Bulk fix failed partway through — already-applied fixes are unaffected; retry to continue with the rest.')
      setPhase(totals.total > 0 ? 'done' : 'idle')
    }
  }

  if (phase === 'loading') return null
  if (deployable.length === 0 && phase !== 'done') return null

  if (billingBlocked && phase !== 'done') {
    return (
      <div className="rf-card flex flex-wrap items-center justify-between gap-3 border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm text-white">
          <Lock className="h-4 w-4 text-amber-400" />
          {label}: {deployable.length} issue{deployable.length === 1 ? '' : 's'} found. {billingBlocked}
        </p>
        <a href="/billing" className="rf-btn-primary shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold">Upgrade</a>
      </div>
    )
  }

  return (
    <div className="rf-card flex flex-wrap items-center justify-between gap-3 border border-[var(--rf-blue-bright)]/30 bg-[var(--rf-blue-bright)]/5 px-4 py-3">
      {phase === 'done' && result ? (
        <>
          <p className="flex items-center gap-1.5 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 text-[var(--rf-green)]" />
            {result.stopped ? 'Stopped. ' : ''}Fixed {result.verified} of {result.total}{result.failed > 0 ? ` (${result.failed} failed — see Recommendations for detail)` : ''}.
          </p>
          <button onClick={() => void load()} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Check again</button>
        </>
      ) : phase === 'confirm' ? (
        <>
          <p className="text-sm text-white">
            Deploy {deployable.length} automatic fix{deployable.length === 1 ? '' : 'es'} to your live WordPress site now? Each is verified by
            read-back and reversible from Deployment history.{deployable.length > BATCH_SIZE ? ` Applied in batches of ${BATCH_SIZE} so you can stop partway through.` : ''}
          </p>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setPhase('idle')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Cancel</button>
            <button onClick={() => void runAll()} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">Yes, deploy all</button>
          </div>
        </>
      ) : phase === 'running' && progress ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm text-white">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              Fixing {progress.done} of {progress.total}…
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--rf-blue-bright)] transition-all" style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} />
            </div>
          </div>
          <button onClick={() => { stopRef.current = true }} className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
            <StopCircle className="h-3.5 w-3.5" /> Stop after this batch
          </button>
        </>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-sm text-white">
            <Sparkles className="h-4 w-4 text-[var(--rf-blue-bright)]" />
            {label}: {deployable.length} issue{deployable.length === 1 ? '' : 's'} can be fixed automatically.
          </p>
          <button
            onClick={() => setPhase('confirm')}
            disabled={phase === 'running'}
            className="rf-btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            {phase === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {phase === 'running' ? 'Fixing…' : `Fix all (${deployable.length})`}
          </button>
        </>
      )}
      {error && <p className="w-full text-xs text-[var(--rf-red)]">{error}</p>}
    </div>
  )
}
