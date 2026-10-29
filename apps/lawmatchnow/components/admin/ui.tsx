import Link from 'next/link'
import type { ReactNode } from 'react'

export const fmt = (n: number) => n.toLocaleString('en-US')
export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`

export function Kpi({ label, value, prev, hint }: { label: string; value: number | string; prev?: number; hint?: string }) {
  const n = typeof value === 'number' ? value : NaN
  const change = prev !== undefined && prev > 0 && !Number.isNaN(n) ? (n - prev) / prev : null
  return (
    <div className="ad-kpi">
      <span className="ad-kpi-l">{label}</span>
      <b>{typeof value === 'number' ? fmt(value) : value}</b>
      {change !== null ? <span className={`ad-delta ${change >= 0 ? 'up' : 'down'}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(0)}% vs previous</span> : hint ? <span className="ad-delta">{hint}</span> : null}
    </div>
  )
}

/** Server-drawn bar chart; one or two series. */
export function Bars({ data, a, b, labelA, labelB }: { data: Record<string, number | string>[]; a: string; b?: string; labelA: string; labelB?: string }) {
  if (!data.length) return <p className="muted">No data yet.</p>
  const max = Math.max(1, ...data.map((d) => Number(d[a]) || 0), ...(b ? data.map((d) => Number(d[b]) || 0) : []))
  const w = 100 / data.length
  return (
    <figure className="ad-chart">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={labelA}>
        {data.map((d, i) => {
          const ha = ((Number(d[a]) || 0) / max) * 38
          const hb = b ? ((Number(d[b]) || 0) / max) * 38 : 0
          return (
            <g key={i}>
              <rect x={i * w + w * 0.12} y={40 - ha} width={w * (b ? 0.38 : 0.76)} height={ha} className="bar-a"><title>{`${d.day ?? ''} ${labelA}: ${d[a]}`}</title></rect>
              {b && <rect x={i * w + w * 0.5} y={40 - hb} width={w * 0.38} height={hb} className="bar-b"><title>{`${d.day ?? ''} ${labelB}: ${d[b]}`}</title></rect>}
            </g>
          )
        })}
      </svg>
      <figcaption>
        <span><i className="sw a" />{labelA}</span>{b && <span><i className="sw b" />{labelB}</span>}
        <span className="muted">{String(data[0].day ?? '')} → {String(data.at(-1)!.day ?? '')}</span>
      </figcaption>
    </figure>
  )
}

/** A ranked list with proportional bars. */
export function Ranked({ rows, empty = 'No data yet.', link }: { rows: { k: string; n: number; extra?: ReactNode }[]; empty?: string; link?: (k: string) => string | null }) {
  if (!rows.length) return <p className="muted">{empty}</p>
  const max = Math.max(...rows.map((r) => r.n), 1)
  return (
    <ol className="ad-ranked">
      {rows.map((r) => {
        const href = link?.(r.k)
        return (
          <li key={r.k}>
            <span className="ad-rk">{href ? <Link href={href}>{r.k}</Link> : r.k}{r.extra}</span>
            <span className="ad-rn">{fmt(r.n)}</span>
            <span className="ad-rb" style={{ width: `${(r.n / max) * 100}%` }} />
          </li>
        )
      })}
    </ol>
  )
}

export function Panel({ title, children, actions, wide = false }: { title: string; children: ReactNode; actions?: ReactNode; wide?: boolean }) {
  return (
    <section className={`ad-panel${wide ? ' wide' : ''}`}>
      <header><h2>{title}</h2>{actions}</header>
      {children}
    </section>
  )
}

export function RangePicker({ days, base }: { days: number; base: string }) {
  return (
    <nav className="ad-range" aria-label="Date range">
      {[7, 30, 90].map((d) => <Link key={d} href={`${base}?d=${d}`} className={d === days ? 'on' : undefined}>{d} days</Link>)}
    </nav>
  )
}

export const daysParam = (v?: string) => ([7, 30, 90].includes(Number(v)) ? Number(v) : 30)

export function Setup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="ad-setup"><b>{title}</b><div>{children}</div><Link href="/admin/settings" className="link-arrow">Setup steps</Link></div>
}
