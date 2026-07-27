'use client'

// Digital DNA — the one place that answers "what does this thing actually
// know about my business, and what is it plugged into?"
//
// The strands are the executive brief's own dataSources list, which is
// already the honest connectivity map the briefing grades itself against:
// three internal systems that are always present, four external providers
// that are only present once the user connects them, and Notifications,
// which isn't built. Nothing here claims a connection the app doesn't have;
// an unconnected source shows its real reason and leaves a break in the helix.

import { useEffect, useState } from 'react'
import { api, ApiError, type ExecutiveBriefDTO, type IntegrationDTO, type ProjectDTO } from '../../lib/client'
import Helix, { type Strand } from './Helix'

export default function DigitalDnaPanel({
  project,
  projectId,
  enabled,
}: {
  project: ProjectDTO | null
  projectId: string | null
  enabled: boolean
}) {
  const [brief, setBrief] = useState<ExecutiveBriefDTO | null>(null)
  const [integrations, setIntegrations] = useState<IntegrationDTO[]>([])
  const [error, setError] = useState('')
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !enabled) return
    let cancelled = false
    setError('')
    Promise.all([api.getExecutiveBrief(projectId), api.listIntegrations(projectId)])
      .then(([b, i]) => {
        if (cancelled) return
        setBrief(b.brief)
        setIntegrations(i.integrations)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not read this project.')
      })
    return () => { cancelled = true }
  }, [projectId, enabled])

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Digital DNA</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Add a site and its DNA assembles here.</p>
      </>
    )
  }

  if (error || !brief) {
    return (
      <>
        <p className="ns-panel-eyebrow">Digital DNA</p>
        <h2>{error ? 'Could not read the DNA.' : 'Sequencing…'}</h2>
        {error && <p className="ns-panel-body">{error}</p>}
      </>
    )
  }

  // The Google rows carry the account they're bound to, which the brief's
  // coarser available/reason pair doesn't know about.
  const detailFor = (name: string, fallback: string | null): string | null => {
    const kind = name.startsWith('Search Console') ? 'search-console' : name.startsWith('Analytics') ? 'analytics' : null
    if (!kind) return fallback
    const row = integrations.find((i) => i.kind === kind)
    if (row?.status === 'connected' && row.accountEmail) return row.accountEmail
    return row?.detail || fallback
  }

  const strands: Strand[] = brief.dataSources.map((s) => ({
    id: s.name,
    label: s.name,
    connected: s.available,
    detail: detailFor(s.name, s.reason),
  }))

  const connected = strands.filter((s) => s.connected).length
  const active = hover ? strands.find((s) => s.id === hover) ?? null : null

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Digital DNA</p>
        <p className="ns-panel-status">{connected} of {strands.length} connected</p>
      </div>
      <h2>Everything {project?.name || brief.project.name} is made of.</h2>

      {project && (
        <ul className="ns-kv-list ns-dna-identity">
          <li className="ns-kv-row"><span className="ns-kv-label">Domain</span><span className="ns-kv-value">{project.domain}</span></li>
          {project.industry && (
            <li className="ns-kv-row"><span className="ns-kv-label">Industry</span><span className="ns-kv-value">{project.industry}</span></li>
          )}
        </ul>
      )}

      <div className="ns-dna-stage">
        <Helix strands={strands} activeId={hover} onHover={setHover} />
        <p className="ns-dna-caption">
          {active
            ? `${active.label} — ${active.connected ? active.detail || 'Connected.' : active.detail || 'Not connected.'}`
            : connected === strands.length
              ? 'Every strand is bonded. The picture is complete.'
              : `${strands.length - connected} strand${strands.length - connected === 1 ? '' : 's'} unbonded — hover a rung to see which.`}
        </p>
      </div>

      <hr className="ns-panel-divider" />

      <ul className="ns-row-list ns-dna-list">
        {strands.map((s) => (
          <li
            key={s.id}
            className="ns-row"
            data-status={s.connected ? 'done' : undefined}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="ns-row-dot" aria-hidden />
            <span className="ns-row-text">
              <b className="ns-row-title">{s.label}</b>
              <span className="ns-row-desc" data-unavailable={s.connected ? undefined : ''}>
                {s.connected ? s.detail || 'Connected.' : s.detail || 'Not connected.'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
