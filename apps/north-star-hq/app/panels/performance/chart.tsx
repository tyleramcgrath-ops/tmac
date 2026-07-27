'use client'

// Hand-rolled SVG charts — the app has no chart library and doesn't need one
// for two shapes (a line over time, a ranked bar list). Every value rendered
// here comes from Google Search Console / GA4; nothing is generated, padded,
// or back-filled. A gap in the data stays a gap.

import { useState } from 'react'

const W = 320
const H = 120
const PAD_L = 34
const PAD_R = 8
const PAD_T = 10
const PAD_B = 18

export interface Series {
  date: string
  value: number
}

export function formatValue(v: number, kind: MetricKind): string {
  if (kind === 'ctr') return `${(v * 100).toFixed(2)}%`
  if (kind === 'position') return v.toFixed(1)
  if (kind === 'currency') return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return Math.round(v).toLocaleString()
}

export type MetricKind = 'count' | 'ctr' | 'position' | 'currency'

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function LineChart({
  series,
  kind,
  label,
}: {
  series: Series[]
  kind: MetricKind
  label: string
}) {
  const [hover, setHover] = useState<number | null>(null)

  if (series.length < 2) {
    return <p className="ns-chart-empty">Not enough days of data to draw a trend yet.</p>
  }

  const vals = series.map((s) => s.value)
  const rawMin = Math.min(...vals)
  const rawMax = Math.max(...vals)
  // A perfectly flat series would divide by zero; give it a band so the line
  // renders through the middle instead of collapsing onto an edge.
  const flat = rawMax - rawMin < 1e-9
  const min = flat ? rawMin - 1 : rawMin
  const max = flat ? rawMax + 1 : rawMax
  const span = max - min

  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (series.length - 1)
  const y = (v: number) => PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B)

  const pts = series.map((s, i) => [x(i), y(s.value)] as const)
  const line = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H - PAD_B} L ${pts[0][0].toFixed(1)} ${H - PAD_B} Z`

  const gid = `ns-chart-${label.replace(/\W+/g, '')}`
  const active = hover != null ? series[hover] : null

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const step = (W - PAD_L - PAD_R) / (series.length - 1)
    const i = Math.round((px - PAD_L) / step)
    setHover(i >= 0 && i < series.length ? i : null)
  }

  return (
    <div className="ns-chart">
      <div className="ns-chart-readout">
        <span className="ns-chart-readout-label">{active ? shortDate(active.date) : label}</span>
        <span className="ns-chart-readout-value">
          {active ? formatValue(active.value, kind) : `${formatValue(rawMin, kind)} – ${formatValue(rawMax, kind)}`}
        </span>
      </div>
      <svg
        className="ns-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} over ${series.length} days, from ${formatValue(rawMin, kind)} to ${formatValue(rawMax, kind)}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(240,200,120,0.30)" />
            <stop offset="1" stopColor="rgba(240,200,120,0)" />
          </linearGradient>
        </defs>

        <line className="ns-chart-grid" x1={PAD_L} y1={PAD_T} x2={W - PAD_R} y2={PAD_T} />
        <line className="ns-chart-grid" x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} />

        <text className="ns-chart-axis" x={PAD_L - 5} y={PAD_T + 4} textAnchor="end">{formatValue(max, kind)}</text>
        <text className="ns-chart-axis" x={PAD_L - 5} y={H - PAD_B} textAnchor="end">{formatValue(min, kind)}</text>
        <text className="ns-chart-axis" x={PAD_L} y={H - 5}>{shortDate(series[0].date)}</text>
        <text className="ns-chart-axis" x={W - PAD_R} y={H - 5} textAnchor="end">{shortDate(series[series.length - 1].date)}</text>

        <path d={area} fill={`url(#${gid})`} stroke="none" />
        <path className="ns-chart-line" d={line} />

        {hover != null && (
          <g>
            <line className="ns-chart-rule" x1={pts[hover][0]} y1={PAD_T} x2={pts[hover][0]} y2={H - PAD_B} />
            <circle className="ns-chart-dot" cx={pts[hover][0]} cy={pts[hover][1]} r="3" />
          </g>
        )}
      </svg>
    </div>
  )
}

export function BarRows({
  rows,
  kind,
}: {
  rows: { key: string; value: number }[]
  kind: MetricKind
}) {
  if (rows.length === 0) return <p className="ns-chart-empty">No rows reported for this period.</p>
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul className="ns-bars">
      {rows.map((r) => (
        <li key={r.key} className="ns-bar-row">
          <span className="ns-bar-key">{r.key}</span>
          <span className="ns-bar-track">
            <span className="ns-bar-fill" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </span>
          <span className="ns-bar-val">{formatValue(r.value, kind)}</span>
        </li>
      ))}
    </ul>
  )
}

// Period-over-period change on the real series: the most recent half of the
// window against the half before it. Returns null when there aren't enough
// days to make an honest comparison rather than inventing a baseline.
export function delta(series: Series[]): { pct: number; recent: number; prior: number } | null {
  if (series.length < 4) return null
  const half = Math.floor(series.length / 2)
  const prior = series.slice(0, half).reduce((a, s) => a + s.value, 0)
  const recent = series.slice(series.length - half).reduce((a, s) => a + s.value, 0)
  if (prior === 0) return null
  return { pct: ((recent - prior) / prior) * 100, recent, prior }
}
