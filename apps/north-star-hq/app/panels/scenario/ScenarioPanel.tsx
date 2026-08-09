'use client'

// UI layer for the scenario simulator.
//
// The hard part of this panel is what it must NOT show. There is no projected
// visibility score, no "estimated lift", no headline number — because nothing
// in North Star can derive one, and an invented number is worse than a blank
// once someone plans around it. See lib/foundation/simulate/engine.ts.
//
// So the layout leads with exposure (real counting), then deterministic
// deltas (arithmetic, with the arithmetic shown), then historical base rates
// (measured outcomes, with sample sizes) — and ends with `unknowns`, rendered
// as prominently as the results. A user who reads only the top of this panel
// should not come away thinking they were given a forecast.

import { useState } from 'react'
import { api, ApiError, type RecommendationDTO, type SimulationDTO } from '../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

const POLL_MS = 30_000

const OPEN_STATUSES = new Set(['open', 'accepted', 'modified', 'regressed'])

function delta(n: number | null, unit: string): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n} ${unit}`
}

export default function ScenarioPanel({ projectId, enabled }: { projectId: string | null; enabled: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sim, setSim] = useState<SimulationDTO | null>(null)
  const [running, setRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const { data, error, loading } = useLivePoll<{ recommendations: RecommendationDTO[] }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.listRecommendations(projectId)
    },
    { enabled: Boolean(projectId) && enabled, intervalMs: POLL_MS }
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // The previous result described a different selection, so it stops being
    // true the moment the selection changes. Clearing it beats leaving a
    // stale panel that looks current.
    setSim(null)
    setSimError(null)
  }

  async function run() {
    if (!projectId || selected.size === 0) return
    setRunning(true)
    setSimError(null)
    try {
      setSim(await api.simulate(projectId, [...selected]))
    } catch (err) {
      setSimError(err instanceof ApiError ? err.message : 'Could not run the scenario.')
    } finally {
      setRunning(false)
    }
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Scenario</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to model a set of fixes.</p>
      </>
    )
  }

  if (loading && !data && !error) {
    return (
      <>
        <p className="ns-panel-eyebrow">Scenario</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">Scenario</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Could not load recommendations.'}</p>
      </>
    )
  }

  const open = data.recommendations
    .filter((r) => OPEN_STATUSES.has(r.status))
    .sort((a, b) => (a.userPriority ?? a.priorityRank ?? 999) - (b.userPriority ?? b.priorityRank ?? 999))

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Scenario</p>
        <p className="ns-panel-status">{selected.size ? `${selected.size} selected` : 'Pick some fixes'}</p>
      </div>
      <h2>What would shipping these actually change?</h2>

      {open.length === 0 ? (
        <p className="ns-panel-body">Nothing open to model — every finding is handled, deployed, or dismissed.</p>
      ) : (
        <>
          <ul className="ns-scn-picks">
            {open.map((r) => (
              <li key={r.id}>
                <label>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <span className="ns-scn-pick-text">
                    <b>{r.title}</b>
                    <span>
                      {r.severity} · {r.evidence.affectedUrls.length} page
                      {r.evidence.affectedUrls.length === 1 ? '' : 's'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="ns-scn-actions">
            <button type="button" className="ns-console-btn" onClick={run} disabled={selected.size === 0 || running}>
              {running ? 'Working…' : 'Run scenario'}
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                className="ns-console-btn"
                onClick={() => {
                  setSelected(new Set())
                  setSim(null)
                }}
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {simError && <p className="ns-panel-body">{simError}</p>}

      {sim && (
        <>
          <hr className="ns-panel-divider" />
          <ul className="ns-kv-list">
            <li className="ns-kv-row">
              <span className="ns-kv-label">Pages touched</span>
              <span className="ns-kv-value">
                {sim.exposure.pagesTouched}
                {sim.exposure.pagesCrawled > 0 ? ` of ${sim.exposure.pagesCrawled} crawled` : ''}
              </span>
            </li>
            <li className="ns-kv-row">
              <span className="ns-kv-label">Tracked keywords on those pages</span>
              <span
                className="ns-kv-value"
                data-unavailable={sim.exposure.keywordsOnTouchedPages.length ? undefined : true}
              >
                {sim.exposure.keywordsOnTouchedPages.length} of {sim.exposure.keywordsTracked}
              </span>
            </li>
          </ul>

          {sim.exposure.keywordsOnTouchedPages.length > 0 && (
            <ul className="ns-chips">
              {sim.exposure.keywordsOnTouchedPages.slice(0, 8).map((k) => (
                <li key={k.keyword}>
                  <span>{k.keyword}</span>
                  {/* null position means genuinely not found — never rendered as 0. */}
                  <b>{k.position === null ? 'not ranking' : `#${k.position}`}</b>
                </li>
              ))}
            </ul>
          )}

          {sim.deterministic.length > 0 && (
            <>
              <hr className="ns-panel-divider" />
              <p className="ns-scn-heading">Changes by arithmetic</p>
              <ul className="ns-scn-list">
                {sim.deterministic.map((d) => (
                  <li key={d.metric}>
                    <b>
                      {d.metric}: {d.before} → {d.after}
                    </b>
                    <span>{d.basis}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {sim.baseRates.length > 0 && (
            <>
              <hr className="ns-panel-divider" />
              <p className="ns-scn-heading">What happened last time on this project</p>
              <ul className="ns-scn-list">
                {sim.baseRates.map((b) => (
                  <li key={b.ruleId}>
                    <b>
                      {b.ruleId}: {delta(b.medianClicksDelta, 'clicks')}, {delta(b.medianPositionDelta, 'positions')}
                    </b>
                    {/* The sample size travels with the number, always. */}
                    <span>{b.caveat}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <hr className="ns-panel-divider" />
          <p className="ns-scn-heading">What this cannot tell you</p>
          <ul className="ns-scn-unknowns">
            {sim.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
