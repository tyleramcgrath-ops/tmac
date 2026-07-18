'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { api, ApiError, type DeploymentDTO, type DeploymentOutcomeDTO } from '../../../lib/client'
import { EmptyState, Spinner } from '../../../lib/ui'
import { ChangeRow, StatusChip } from './shared'
import { ConnectWordPress, DeployForm } from './WpForms'
import { WpBrowseOptimize } from './WpOptimizer'

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

      <div>
        <p className="mb-2 text-sm font-semibold text-white">Deployment history</p>
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
