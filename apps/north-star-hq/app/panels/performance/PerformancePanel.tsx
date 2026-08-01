'use client'

// How the site actually performed — every number here is fetched live from
// Google Search Console and GA4 for this project's own property. There is no
// demo series: if Google isn't connected, or returns nothing for the window,
// this panel says exactly that instead of drawing a plausible-looking line.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { api, ApiError, type GoogleTrendsDTO, type GoogleBreakdownsDTO } from '../../lib/client'
import { LineChart, BarRows, delta, formatValue, type MetricKind, type Series } from './chart'

type GscMetric = 'clicks' | 'impressions' | 'ctr' | 'position'

const GSC_METRICS: { id: GscMetric; label: string; kind: MetricKind; note?: string }[] = [
  { id: 'clicks', label: 'Clicks', kind: 'count' },
  { id: 'impressions', label: 'Impressions', kind: 'count' },
  { id: 'ctr', label: 'CTR', kind: 'ctr' },
  { id: 'position', label: 'Avg position', kind: 'position', note: 'lower is better' },
]

function Delta({ series, invert }: { series: Series[]; invert?: boolean }) {
  const d = delta(series)
  if (!d) return null
  const better = invert ? d.pct < 0 : d.pct > 0
  const sign = d.pct > 0 ? '+' : ''
  return (
    <span className="ns-perf-delta" data-dir={d.pct === 0 ? 'flat' : better ? 'up' : 'down'}>
      {sign}{d.pct.toFixed(1)}% vs prior period
    </span>
  )
}

export default function PerformancePanel({
  projectId,
  enabled,
}: {
  projectId: string | null
  enabled: boolean
}) {
  const [trends, setTrends] = useState<GoogleTrendsDTO | null>(null)
  const [breakdowns, setBreakdowns] = useState<GoogleBreakdownsDTO | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState<GscMetric>('clicks')
  const tabRefs = useRef<Record<GscMetric, HTMLButtonElement | null>>({ clicks: null, impressions: null, ctr: null, position: null })

  // WAI-ARIA APG tab pattern's keyboard contract: arrow keys move both focus
  // and the roving tabindex, wrapping at the ends; activation is automatic
  // (matches the existing click-to-switch behavior) rather than requiring a
  // separate Enter/Space.
  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % GSC_METRICS.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + GSC_METRICS.length) % GSC_METRICS.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = GSC_METRICS.length - 1
    if (nextIndex === null) return
    e.preventDefault()
    const next = GSC_METRICS[nextIndex]
    setMetric(next.id)
    tabRefs.current[next.id]?.focus()
  }

  useEffect(() => {
    if (!projectId || !enabled) return
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([api.getGoogleTrends(projectId), api.getGoogleBreakdowns(projectId)])
      .then(([t, b]) => {
        if (cancelled) return
        setTrends(t)
        setBreakdowns(b)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load performance data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [projectId, enabled])

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Performance</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to start tracking how it performs.</p>
      </>
    )
  }

  if (error || (loading && !trends)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Performance</p>
        <h2>{error ? 'Could not load performance.' : 'Reading Search Console…'}</h2>
        {error && <p className="ns-panel-body">{error}</p>}
      </>
    )
  }

  const gsc = trends?.gsc
  const ga4 = trends?.analytics

  // Not connected is the common case before the user finishes OAuth — say so
  // plainly and point at the one place that fixes it.
  if (gsc && !gsc.ok && (!ga4 || !ga4.ok)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Performance</p>
        <h2>No performance data yet.</h2>
        <p className="ns-panel-body">{gsc.reason}</p>
        <p className="ns-panel-body">
          Connect Google Search Console in the Integrations panel and this fills with your site&rsquo;s real
          clicks, impressions, click-through rate and average position.
        </p>
      </>
    )
  }

  const active = GSC_METRICS.find((m) => m.id === metric)!
  const gscSeries: Series[] = gsc?.ok ? gsc.points.map((p) => ({ date: p.date, value: p[metric] })) : []
  const ga4Series: Series[] = ga4?.ok ? ga4.points.map((p) => ({ date: p.date, value: p.sessions })) : []

  const totalClicks = gsc?.ok ? gsc.points.reduce((a, p) => a + p.clicks, 0) : null
  const totalImpr = gsc?.ok ? gsc.points.reduce((a, p) => a + p.impressions, 0) : null
  const avgCtr = totalImpr && totalImpr > 0 && totalClicks != null ? totalClicks / totalImpr : null

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Performance</p>
        {gsc?.ok && <p className="ns-panel-status">{gsc.points.length} days</p>}
      </div>
      <h2>How the site actually performed.</h2>

      {gsc?.ok && (
        <>
          <div className="ns-perf-stats">
            <div className="ns-perf-stat">
              <span className="ns-perf-stat-label">Clicks</span>
              <span className="ns-perf-stat-value">{formatValue(totalClicks ?? 0, 'count')}</span>
            </div>
            <div className="ns-perf-stat">
              <span className="ns-perf-stat-label">Impressions</span>
              <span className="ns-perf-stat-value">{formatValue(totalImpr ?? 0, 'count')}</span>
            </div>
            <div className="ns-perf-stat">
              <span className="ns-perf-stat-label">CTR</span>
              <span className="ns-perf-stat-value">{avgCtr == null ? '—' : formatValue(avgCtr, 'ctr')}</span>
            </div>
          </div>

          <div className="ns-perf-tabs" role="tablist" aria-label="Search Console metric">
            {GSC_METRICS.map((m, i) => (
              <button
                key={m.id}
                ref={(el) => { tabRefs.current[m.id] = el }}
                id={`ns-perf-tab-${m.id}`}
                type="button"
                role="tab"
                aria-selected={metric === m.id}
                aria-controls={`ns-perf-panel-${m.id}`}
                tabIndex={metric === m.id ? 0 : -1}
                className="ns-perf-tab"
                onClick={() => setMetric(m.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div id={`ns-perf-panel-${active.id}`} role="tabpanel" aria-labelledby={`ns-perf-tab-${active.id}`} tabIndex={0}>
            <div className="ns-perf-chart-head">
              <span className="ns-perf-chart-title">
                Search Console · {active.label}
                {active.note && <em className="ns-perf-note"> ({active.note})</em>}
              </span>
              <Delta series={gscSeries} invert={metric === 'position'} />
            </div>
            <LineChart series={gscSeries} kind={active.kind} label={active.label} />
          </div>
        </>
      )}

      {ga4?.ok && ga4Series.length > 0 && (
        <>
          <hr className="ns-panel-divider" />
          <div className="ns-perf-chart-head">
            <span className="ns-perf-chart-title">Analytics · Sessions</span>
            <Delta series={ga4Series} />
          </div>
          <LineChart series={ga4Series} kind="count" label="Sessions" />
        </>
      )}

      {breakdowns?.gscDevice.ok && breakdowns.gscDevice.rows.length > 0 && (
        <>
          <hr className="ns-panel-divider" />
          <p className="ns-perf-chart-title">Clicks by device</p>
          <BarRows rows={breakdowns.gscDevice.rows.map((r) => ({ key: r.key, value: r.clicks }))} kind="count" />
        </>
      )}

      {breakdowns?.gscCountry.ok && breakdowns.gscCountry.rows.length > 0 && (
        <>
          <hr className="ns-panel-divider" />
          <p className="ns-perf-chart-title">Top countries by clicks</p>
          <BarRows
            rows={breakdowns.gscCountry.rows
              .slice()
              .sort((a, b) => b.clicks - a.clicks)
              .slice(0, 6)
              .map((r) => ({ key: r.key.toUpperCase(), value: r.clicks }))}
            kind="count"
          />
        </>
      )}

      {breakdowns?.ga4Channel.ok && breakdowns.ga4Channel.rows.length > 0 && (
        <>
          <hr className="ns-panel-divider" />
          <p className="ns-perf-chart-title">Sessions by channel</p>
          <BarRows
            rows={breakdowns.ga4Channel.rows.slice(0, 6).map((r) => ({ key: r.channel, value: r.sessions }))}
            kind="count"
          />
        </>
      )}

      {gsc?.ok && !ga4?.ok && ga4 && (
        <p className="ns-panel-body ns-perf-footnote">Analytics: {ga4.reason}</p>
      )}
    </>
  )
}
