'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type DeploymentDTO } from '../../../lib/client'
import { EmptyState, Spinner } from '../../../lib/ui'
import { ChangeRow, StatusChip } from './shared'
import { ConnectWordPress, DeployForm } from './WpForms'
import { WpBrowseOptimize } from './WpOptimizer'

export function WordPressTab({ projectId }: { projectId: string }) {
  const [state, setState] = useState<{ connection: { siteUrl: string; username: string; aioseo: boolean } | null; deployments: DeploymentDTO[] } | null>(null)
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
            <p className="mt-1 text-xs text-[var(--rf-muted)]">User {state.connection.username} · AIOSEO {state.connection.aioseo ? 'detected' : 'not detected'}</p>
          </div>
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
