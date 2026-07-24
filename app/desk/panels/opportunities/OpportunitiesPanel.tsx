'use client'

import { useEffect, useState } from 'react'
import { api, ApiError, type RecommendationDTO } from '../../../lib/client'

export default function OpportunitiesPanel({
  projectId,
  projectsResolved,
}: {
  projectId: string | null
  projectsResolved: boolean
}) {
  const [recs, setRecs] = useState<RecommendationDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    ;(async () => {
      try {
        const { recommendations } = await api.listRecommendations(projectId)
        if (!cancelled) setRecs(recommendations)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load opportunities.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (!projectsResolved || (projectId && recs === null && !error)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Opportunities</p>
        <span className="ns-skeleton-line" style={{ width: '80%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Opportunities</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to see opportunities here.</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <p className="ns-panel-eyebrow">Opportunities</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error}</p>
      </>
    )
  }

  const open = (recs ?? [])
    .filter((r) => r.status === 'open')
    .sort((a, b) => (a.userPriority ?? a.priorityRank ?? 999) - (b.userPriority ?? b.priorityRank ?? 999))
    .slice(0, 3)

  return (
    <>
      <p className="ns-panel-eyebrow">Opportunities</p>
      <h2>{open.length ? `${open.length} quick win${open.length > 1 ? 's' : ''} in reach.` : 'Nothing waiting right now.'}</h2>
      {open.length > 0 && (
        <ul className="ns-chips">
          {open.map((r) => (
            <li key={r.id}>
              <span>{r.title}</span>
              <b>{r.expectedImpact?.size || r.severity}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="ns-panel-body">
        {open.length
          ? "The Core has drafted the moves. Approve when you're ready."
          : 'Every open finding has been handled or is already deployed.'}
      </p>
    </>
  )
}
