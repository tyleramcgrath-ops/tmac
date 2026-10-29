'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import { api, ApiError, type DeploymentDTO, type DeploymentOutcomeDTO } from '../../../lib/client'
import { summarizeOutcomes } from '../../../lib/outcome-summary'
import { EmptyState, Spinner } from '../../../lib/ui'
import { ChangeRow, StatusChip } from './shared'
import { ConnectWordPress, DeployForm } from './WpForms'
import { WpBrowseOptimize } from './WpOptimizer'
import { downloadCsv } from '../../../lib/csv'

// One-click "restore everything" — rolls back every deployment RankForge has
// made to this project that hasn't already been rolled back (or failed), via
// the same per-deployment rollback (stored "before" snapshot restore, read-
// back verified) as the single-row button below, just looped over all of
// them. Irreversible in the sense that re-applying the original fixes is a
// fresh deploy, not an undo of the undo — so this always warns before running.
function RestoreAllButton({ projectId, eligible, onDone }: { projectId: string; eligible: DeploymentDTO[]; onDone: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'running' | 'done'>('idle')
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<{ ok: number; total: number } | null>(null)

  async function run() {
    setPhase('running')
    setError('')
    try {
      const { results } = await api.operatorRollback(projectId, eligible.map((d) => d.id))
      const ok = results.filter((r) => r.ok).length
      setSummary({ ok, total: eligible.length })
      setPhase('done')
      await onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Restore failed.')
      setPhase('idle')
    }
  }

  if (eligible.length === 0) return null

  if (phase === 'confirm') {
    return (
      <div className="rf-card w-full border border-red-500/30 bg-red-500/5 p-4 text-sm">
        <p className="font-semibold text-white">Roll back all {eligible.length} deployment{eligible.length === 1 ? '' : 's'}?</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">
          This restores every title/meta/content change RankForge has made on this site back to what it was before — one at a time, each verified
          by read-back. This cannot be undone automatically; re-applying a fix afterward is a fresh deploy.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setPhase('idle')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Cancel</button>
          <button onClick={() => void run()} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30">
            Yes, roll everything back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={() => setPhase('confirm')} disabled={phase === 'running'} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-300 disabled:opacity-60">
        <RotateCcw className="h-3.5 w-3.5" /> {phase === 'running' ? 'Restoring…' : `Restore everything (${eligible.length})`}
      </button>
      {phase === 'done' && summary && <p className="text-[11px] text-[var(--rf-muted)]">Rolled back {summary.ok} of {summary.total}.</p>}
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  )
}

function exportDeploymentsCsv(deployments: DeploymentDTO[]) {
  const rows: (string | number)[][] = [
    ['Date', 'Page', 'Status', 'Title before', 'Title after', 'Meta before', 'Meta after', 'Reason', 'Result', 'Clicks delta', 'Position delta'],
    ...deployments.map((d) => [
      d.createdAt, d.postUrl, d.status,
      d.before.title, d.after.title ?? '', d.before.metaDescription, d.after.metaDescription ?? '',
      d.reason, d.result,
      d.outcome?.delta?.clicks ?? '', d.outcome?.delta?.position ?? '',
    ]),
  ]
  downloadCsv(`rankforge-deployments-${new Date().toISOString().slice(0, 10)}.csv`, rows)
}

// The headline the outcome-measurement flywheel exists to produce: proof, in
// aggregate, that deployed fixes move real Search Console metrics — not just
// a per-deployment delta buried in a list. Renders nothing when there's
// nothing to report yet (no fabricated claim on empty data).
function OutcomeSummaryCard({ deployments }: { deployments: DeploymentDTO[] }) {
  const s = summarizeOutcomes(deployments)
  if (s.measured === 0 && s.pending === 0 && s.skipped === 0) return null

  return (
    <div className="rf-card p-4">
      <p className="text-sm font-semibold text-white">Outcomes — did the fixes work?</p>
      {s.measured > 0 ? (
        <>
          <p className="mt-1 text-xs text-[var(--rf-muted)]">
            <span className="rf-mono text-[var(--rf-green)]">{s.improvedClicks}</span> of{' '}
            <span className="rf-mono text-white">{s.measured}</span> measured fixes increased clicks — avg{' '}
            <span className="rf-mono">{s.avgClicksDelta >= 0 ? '+' : ''}{s.avgClicksDelta.toFixed(1)}</span> clicks,{' '}
            avg position {s.avgPositionDelta >= 0 ? '+' : ''}{s.avgPositionDelta.toFixed(1)}{' '}
            ({s.avgPositionDelta < 0 ? 'improved' : s.avgPositionDelta > 0 ? 'worsened' : 'unchanged'}), 14 days before vs after.
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-[var(--rf-muted)]">No fixes measured yet.</p>
      )}
      {(s.pending > 0 || s.skipped > 0) && (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">
          {s.pending > 0 && `${s.pending} pending (measured ~14 days after deployment)`}
          {s.pending > 0 && s.skipped > 0 && ' · '}
          {s.skipped > 0 && `${s.skipped} not measured (no Search Console connected, or a permanent read failure)`}
        </p>
      )}
    </div>
  )
}

// Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): did this fix
// actually move Search Console clicks/impressions/position for the affected
// URL? Populated ~14 days after a verified deployment. Honest states only —
// pending (not captured yet), skipped (no GSC connected / permanent
// failure, with the real reason), or a real before/after delta. Never a
// fabricated number.
function OutcomeRow({ outcome }: { outcome?: DeploymentOutcomeDTO }) {
  if (!outcome) {
    return (
      <p className="mt-2 text-[11px] text-[var(--rf-faint)]">
        Outcome: pending — Search Console clicks/impressions are compared ~14 days after deployment.
      </p>
    )
  }
  if (outcome.skipped) {
    return <p className="mt-2 text-[11px] text-[var(--rf-faint)]">Outcome: not measured — {outcome.reason}</p>
  }
  const d = outcome.delta!
  const clickTone = d.clicks > 0 ? 'text-[var(--rf-green)]' : d.clicks < 0 ? 'text-[var(--rf-red)]' : 'text-[var(--rf-muted)]'
  // Position: lower number = better rank, so a NEGATIVE delta is the win.
  const posTone = d.position < 0 ? 'text-[var(--rf-green)]' : d.position > 0 ? 'text-[var(--rf-red)]' : 'text-[var(--rf-muted)]'
  return (
    <div className="mt-2 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
      <p className="text-[11px] font-medium text-white">Outcome — 14 days before vs after (Search Console)</p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <span className={`rf-mono flex items-center gap-1 ${clickTone}`}>
          {d.clicks !== 0 && (d.clicks > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
          clicks {d.clicks >= 0 ? '+' : ''}{d.clicks}
        </span>
        <span className="rf-mono text-[var(--rf-muted)]">impressions {d.impressions >= 0 ? '+' : ''}{d.impressions}</span>
        <span className={`rf-mono flex items-center gap-1 ${posTone}`}>
          {d.position !== 0 && (d.position < 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
          position {d.position >= 0 ? '+' : ''}{d.position.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

const SEO_PLUGIN_LABEL: Record<'aioseo' | 'rankmath' | 'yoast' | 'core', string> = {
  aioseo: 'All in One SEO',
  rankmath: 'Rank Math',
  yoast: 'Yoast SEO',
  core: 'none (writes to excerpt)',
}

// No SEO plugin detected on the connected site — meta descriptions currently
// fall back to the post excerpt. Offer to install one, but ONLY on explicit
// per-plugin click: this runs arbitrary plugin code with full site
// privileges and, unlike a title/meta write, has no clean rollback, so it's
// never triggered automatically. Honest about the common failure mode too —
// many managed hosts block direct plugin installs.
function InstallSeoPlugin({ projectId, onInstalled }: { projectId: string; onInstalled: () => void }) {
  const [installing, setInstalling] = useState<'yoast' | 'aioseo' | null>(null)
  const [error, setError] = useState('')

  async function install(plugin: 'yoast' | 'aioseo') {
    setInstalling(plugin)
    setError('')
    try {
      await api.installWordpressPlugin(projectId, plugin)
      onInstalled()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Install failed.')
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="rf-card p-4">
      <p className="text-sm font-semibold text-white">No SEO plugin detected</p>
      <p className="mt-1 text-xs text-[var(--rf-muted)]">
        Meta descriptions currently fall back to the post excerpt. Install a plugin for full support — this writes
        directly to your live site and can&apos;t be undone from RankForge (deactivate it from wp-admin if needed).
        Some hosts block automatic plugin installs; you&apos;ll get an honest error if that happens.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => install('yoast')}
          disabled={installing !== null}
          className="rf-btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {installing === 'yoast' ? 'Installing…' : 'Install Yoast SEO'}
        </button>
        <button
          onClick={() => install('aioseo')}
          disabled={installing !== null}
          className="rf-btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {installing === 'aioseo' ? 'Installing…' : 'Install All in One SEO'}
        </button>
      </div>
      {error && <p className="mt-2 text-[11px] text-[var(--rf-red)]">{error}</p>}
    </div>
  )
}

export function WordPressTab({ projectId }: { projectId: string }) {
  const [state, setState] = useState<{ connection: { siteUrl: string; username: string; aioseo: boolean; seoPlugin?: 'aioseo' | 'rankmath' | 'yoast' | 'core' } | null; deployments: DeploymentDTO[] } | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setState(await api.getWordpress(projectId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load WordPress state.')
      setState({ connection: null, deployments: [] })
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function rollback(id: string) {
    try {
      await api.rollbackWordpress(projectId, id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rollback failed.')
    }
  }

  if (state === null) return <Spinner label="Loading WordPress…" />

  const rollbackEligible = state.deployments.filter((d) => d.status !== 'rolled_back' && d.status !== 'failed')

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!state.connection ? (
        <ConnectWordPress projectId={projectId} onConnected={load} />
      ) : (
        <>
          <div className="rf-card p-4">
            <p className="text-sm font-semibold text-white">Connected</p>
            <p className="rf-mono text-xs text-[var(--rf-blue-bright)]">{state.connection.siteUrl}</p>
            <p className="mt-1 text-xs text-[var(--rf-muted)]">User {state.connection.username} · SEO plugin: {SEO_PLUGIN_LABEL[state.connection.seoPlugin ?? (state.connection.aioseo ? 'aioseo' : 'core')]}</p>
          </div>
          {(state.connection.seoPlugin ?? (state.connection.aioseo ? 'aioseo' : 'core')) === 'core' && (
            <InstallSeoPlugin projectId={projectId} onInstalled={load} />
          )}
          <WpBrowseOptimize projectId={projectId} onDeployed={load} />
          <DeployForm projectId={projectId} onDeployed={load} />
        </>
      )}

      {state.deployments.length > 0 && <OutcomeSummaryCard deployments={state.deployments} />}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Deployment history</p>
          <div className="flex flex-wrap items-center gap-2">
            {state.deployments.length > 0 && (
              <button onClick={() => exportDeploymentsCsv(state.deployments)} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            )}
            <RestoreAllButton projectId={projectId} eligible={rollbackEligible} onDone={load} />
          </div>
        </div>
        {state.deployments.length === 0 ? (
          <EmptyState title="No deployments yet" detail="Deployments are durable server-side records — they survive refresh, logout, and other devices. Nothing is shown as 'verified' unless the changed value was read back and matched." />
        ) : (
          <div className="space-y-2">
            {state.deployments.map((d) => (
              <div key={d.id} className="rf-card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <a href={d.postUrl} target="_blank" rel="noreferrer" className="rf-mono text-xs text-[var(--rf-blue-bright)] hover:text-white">
                    {d.postType}/{d.postId}
                  </a>
                  <StatusChip status={d.status} />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {d.after.title !== undefined && (
                    <ChangeRow label="Title" before={d.before.title} after={d.after.title ?? ''} />
                  )}
                  {d.after.metaDescription !== undefined && (
                    <ChangeRow label="Meta description" before={d.before.metaDescription} after={d.after.metaDescription ?? ''} />
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[var(--rf-muted)]">Reason: {d.reason}</p>
                {d.verification && (
                  <p className="mt-1 text-[11px] text-[var(--rf-faint)]">
                    Verification: {d.verification.note} (title match: {String(d.verification.titleMatches)}, meta match: {String(d.verification.metaMatches)})
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Result: {d.result}</p>
                {(d.status === 'verified' || d.status === 'rolled_back' || d.outcome) && <OutcomeRow outcome={d.outcome} />}
                {d.status !== 'rolled_back' && d.status !== 'failed' && (
                  <button onClick={() => rollback(d.id)} className="rf-btn-ghost mt-2 rounded-md px-3 py-1 text-[11px]">
                    Roll back
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
