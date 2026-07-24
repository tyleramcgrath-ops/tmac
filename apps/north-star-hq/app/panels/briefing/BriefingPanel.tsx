'use client'

// UI layer (Engine -> API -> UI): pure presentation. Every sentence, item,
// and number below is read directly off the ExecutiveBriefDTO the API
// already computed by aggregating the Mission Queue, Agent Roster, Activity
// Stream, and Mission Atlas — no derivation happens in this component. The
// Compass briefly walks listening -> thinking -> planning -> success while
// the real request is in flight; it never fabricates progress.

import { useEffect, useState } from 'react'
import { api, ApiError, type ExecutiveBriefDTO, type GoogleTrendsDTO } from '../../lib/client'
import type { CompassState } from '../../compass'

// Smooth quadratic-curve sparkline through real GSC click points — mirrors
// the curve-building approach used by the room's own SVG elements, just fed
// by real day-by-day trend data instead of a hardcoded series.
function buildSparkline(points: { clicks: number }[]) {
  if (points.length < 2) return null
  const vals = points.map((p) => p.clicks)
  const min = Math.min(...vals)
  const span = Math.max(1, Math.max(...vals) - min)
  const pts = points.map((p, i) => [
    +(i * 120 / (points.length - 1)).toFixed(1),
    +(31 - ((p.clicks - min) / span) * 27).toFixed(1),
  ] as [number, number])
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const xc = (pts[i - 1][0] + pts[i][0]) / 2
    const yc = (pts[i - 1][1] + pts[i][1]) / 2
    d += ` Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${xc.toFixed(2)} ${yc.toFixed(2)}`
  }
  d += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`
  return { d, lastY: pts[pts.length - 1][1] }
}

export default function BriefingPanel({
  projectId,
  projectsResolved,
  onCompassState,
}: {
  projectId: string | null
  projectsResolved: boolean
  onCompassState?: (s: CompassState) => void
}) {
  const [brief, setBrief] = useState<ExecutiveBriefDTO | null>(null)
  const [trends, setTrends] = useState<GoogleTrendsDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    // The room's own wake choreography (page.tsx's runWake) authoritatively
    // sets the Compass through 'awakening' -> 'idle' during the first few
    // seconds after wake, ending with its own C('idle') call around 3.7s in
    // non-quick mode. Starting the brief's real listening/thinking/planning
    // sequence immediately on mount would be overwritten by that call a
    // moment later — this delay ensures the brief's real generation states
    // are the ones the user actually sees, not swallowed by wake's own
    // scripted timers. The panel itself isn't visible until the user
    // summons it (well after this window), so the delay is not felt as a
    // loading stall.
    const WAKE_SETTLE_MS = 4200
    const timer = window.setTimeout(() => {
      if (cancelled) return
      onCompassState?.('listening')
      ;(async () => {
        try {
          onCompassState?.('thinking')
          const [briefRes, trend] = await Promise.all([api.getExecutiveBrief(projectId), api.getGoogleTrends(projectId)])
          if (cancelled) return
          onCompassState?.('planning')
          setBrief(briefRes.brief)
          setTrends(trend)
          onCompassState?.('success')
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof ApiError ? err.message : 'Could not load the morning briefing.')
            onCompassState?.('error')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, WAKE_SETTLE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (!projectsResolved || loading) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to start receiving a morning briefing here.</p>
      </>
    )
  }

  if (error || !brief) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Could not load your briefing.'}</p>
      </>
    )
  }

  const gscTrend = trends?.gsc.ok ? trends.gsc.points : null
  const spark = gscTrend ? buildSparkline(gscTrend) : null
  const connectedSources = brief.dataSources.filter((s) => s.available).length

  const findSource = (name: string) => brief.dataSources.find((s) => s.name === name)
  const searchConsole = findSource('Search Console')
  const analytics = findSource('Analytics (GA4)')
  const gscMetric = brief.performance.metrics.find((m) => m.source === 'Search Console')
  const ga4Metric = brief.performance.metrics.find((m) => m.source === 'Analytics (GA4)')

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <p className="ns-panel-status">{connectedSources} of {brief.dataSources.length} sources</p>
      </div>
      <h2>{brief.executiveSummary}</h2>
      {spark && (
        <svg className="ns-spark" viewBox="0 0 120 36" aria-hidden>
          <defs>
            <linearGradient id="ns-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(240,200,120,0.35)" />
              <stop offset="1" stopColor="rgba(240,200,120,0)" />
            </linearGradient>
          </defs>
          <path d={`${spark.d} L 120 36 L 0 36 Z`} fill="url(#ns-spark-fill)" stroke="none" />
          <path d={spark.d} fill="none" stroke="#ecc276" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="120" cy={spark.lastY} r="2.2" fill="#ffe2a4" />
        </svg>
      )}
      <hr className="ns-panel-divider" />
      <ul className="ns-kv-list">
        <li className="ns-kv-row">
          <span className="ns-kv-label">Priorities</span>
          <span className="ns-kv-value">{brief.priorities.length ? brief.priorities[0].text : 'None waiting'}</span>
        </li>
        <li className="ns-kv-row">
          <span className="ns-kv-label">Attention</span>
          <span className="ns-kv-value">{brief.attentionRequired.length ? `${brief.attentionRequired.length} item${brief.attentionRequired.length === 1 ? '' : 's'}` : 'None'}</span>
        </li>
        <li className="ns-kv-row">
          <span className="ns-kv-label">Search Console</span>
          <span className="ns-kv-value" data-unavailable={searchConsole?.available ? undefined : true}>
            {searchConsole?.available && gscMetric ? `${gscMetric.value} clicks` : 'Requires Search Console'}
          </span>
        </li>
        <li className="ns-kv-row">
          <span className="ns-kv-label">Analytics</span>
          <span className="ns-kv-value" data-unavailable={analytics?.available ? undefined : true}>
            {analytics?.available && ga4Metric ? `${ga4Metric.value} sessions` : 'Requires GA4 connection'}
          </span>
        </li>
      </ul>
      <p className="ns-panel-body">
        {brief.recommendation ? brief.recommendation.text : 'No strong signal yet — not enough evidence for a confident recommendation.'}
      </p>
    </>
  )
}
