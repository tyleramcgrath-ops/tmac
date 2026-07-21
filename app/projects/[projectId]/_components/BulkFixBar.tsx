'use client'

// One-click "fix everything" for a tab. Reuses the exact same safety-gated,
// read-back-verified operator pipeline as the per-recommendation "Fix on
// WordPress" flow (DeployFromRecommendation) — this is only a bulk driver
// over that pipeline, never a shortcut around it. Dangerous rules (indexation/
// canonical/robots) are still hard-blocked server-side regardless of this
// click; only open recommendations the Operator judges safely deployable are
// offered here.

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { api, ApiError, type RecommendationDTO } from '../../../lib/client'

type Phase = 'loading' | 'idle' | 'confirm' | 'running' | 'done'

export function BulkFixBar({ projectId, categories, label, onFixed }: { projectId: string; categories?: string[]; label: string; onFixed?: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [deployable, setDeployable] = useState<RecommendationDTO[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ verified: number; failed: number; total: number } | null>(null)

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
      const { previews } = await api.operatorPreview(projectId, open.map((r) => r.id))
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
    try {
      const items = deployable.map((r) => ({ recommendationId: r.id, approve: true }))
      const { summary } = await api.operatorDeploy(projectId, items, false)
      setResult(summary)
      setPhase('done')
      onFixed?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bulk fix failed.')
      setPhase('idle')
    }
  }

  if (phase === 'loading') return null
  if (deployable.length === 0 && phase !== 'done') return null

  return (
    <div className="rf-card flex flex-wrap items-center justify-between gap-3 border border-[var(--rf-blue-bright)]/30 bg-[var(--rf-blue-bright)]/5 px-4 py-3">
      {phase === 'done' && result ? (
        <>
          <p className="flex items-center gap-1.5 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 text-[var(--rf-green)]" />
            Fixed {result.verified} of {result.total}{result.failed > 0 ? ` (${result.failed} failed — see Recommendations for detail)` : ''}.
          </p>
          <button onClick={() => void load()} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Check again</button>
        </>
      ) : phase === 'confirm' ? (
        <>
          <p className="text-sm text-white">
            Deploy {deployable.length} automatic fix{deployable.length === 1 ? '' : 'es'} to your live WordPress site now? Each is verified by
            read-back and reversible from Deployment history.
          </p>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setPhase('idle')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Cancel</button>
            <button onClick={() => void runAll()} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">Yes, deploy all</button>
          </div>
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
