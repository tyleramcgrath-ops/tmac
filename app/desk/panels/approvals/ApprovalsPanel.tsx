'use client'

import { useEffect, useState } from 'react'
import { api, ApiError, type RecommendationDTO } from '../../../lib/client'
import type { CompassState } from '../../compass'

type ApproveState = 'idle' | 'working' | 'done'

export default function ApprovalsPanel({
  projectId,
  projectsResolved,
  panelsUp,
  onCompassState,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onCompassState: (s: CompassState) => void
}) {
  const [recs, setRecs] = useState<RecommendationDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approve, setApprove] = useState<ApproveState>('idle')
  const [progOn, setProgOn] = useState(false)
  const [progTask, setProgTask] = useState('Deploying')
  const [progPct, setProgPct] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    ;(async () => {
      try {
        const { recommendations } = await api.listRecommendations(projectId)
        if (!cancelled) setRecs(recommendations)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load approvals.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  // dismissing the panels resets the approve flow, matching the prior behavior
  useEffect(() => {
    if (!panelsUp) {
      setApprove('idle')
      setActionError(null)
    }
  }, [panelsUp])

  const target = (recs ?? []).find((r) => r.status === 'open')

  async function runApprove() {
    if (!projectId || !target || approve !== 'idle') return
    setApprove('working')
    setProgOn(true)
    setProgTask('Reviewing')
    setProgPct(0)
    setActionError(null)
    onCompassState('executing')
    try {
      const { previews } = await api.operatorPreview(projectId, [target.id])
      const preview = previews[0]
      if (!preview || preview.deployable === false || preview.safety?.blocked) {
        throw new Error(
          preview?.safety?.warnings?.[0] ?? preview?.reason ?? 'This fix needs a human look before it can deploy.'
        )
      }
      setProgTask('Deploying')
      onCompassState('deploying')
      const { results } = await api.operatorDeploy(projectId, [{ recommendationId: target.id, approve: true }])
      const result = results[0]
      if (!result?.ok) throw new Error(result?.error ?? 'The deploy did not complete.')
      setProgTask('Verifying')
      onCompassState('verifying')
      setProgPct(100)
      setApprove('done')
      onCompassState('success')
      window.setTimeout(() => {
        setProgOn(false)
        onCompassState('idle')
      }, 2600)
      const { recommendations } = await api.listRecommendations(projectId)
      setRecs(recommendations)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The deploy failed.')
      setApprove('idle')
      setProgOn(false)
      onCompassState('warning')
      window.setTimeout(() => onCompassState('idle'), 2600)
    }
  }

  if (!projectsResolved || (projectId && recs === null && !error)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Approvals</p>
        <span className="ns-skeleton-line" style={{ width: '75%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Approvals</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to see approvals here.</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <p className="ns-panel-eyebrow">Approvals</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error}</p>
      </>
    )
  }

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Approvals</p>
        <p className="ns-panel-status">{approve === 'done' ? 'Verified' : target ? 'Waiting' : 'Clear'}</p>
      </div>
      <h2>{approve === 'done' ? 'Done. Verified by read-back.' : target ? 'One fix awaits your word.' : 'Nothing waiting on you.'}</h2>
      <hr className="ns-panel-divider" />
      <p className="ns-panel-body">
        {approve === 'done'
          ? 'The correction is live. The Core confirmed the change on the page itself.'
          : actionError
            ? actionError
            : target
              ? target.reasoning || target.title
              : 'No open recommendation is ready to deploy right now.'}
      </p>
      {target && (
        <button
          type="button"
          className="ns-approve"
          data-state={approve}
          disabled={approve !== 'idle'}
          onClick={runApprove}
        >
          {approve === 'idle' ? 'Approve the fix' : approve === 'working' ? 'Deploying…' : 'Verified ✓'}
        </button>
      )}
      <div className={`ns-progress${progOn ? ' on' : ''}`}>
        <div
          className={`ns-progress-bar${progOn && progPct < 100 ? ' indeterminate' : ''}`}
          style={{ width: `${progPct}%` }}
        />
      </div>
      <div className={`ns-progress-row${progOn ? ' on' : ''}`}>
        <span>{progTask}</span>
        <b>{Math.round(progPct)}%</b>
      </div>
    </>
  )
}
