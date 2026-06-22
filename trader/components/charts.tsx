'use client'

// Lightweight dependency-free SVG charts. Kept simple and responsive via
// viewBox so the bundle stays tiny and builds anywhere.

export function LineChart({
  data,
  height = 160,
  stroke = 'var(--accent)',
  fill = true,
}: {
  data: number[]
  height?: number
  stroke?: string
  fill?: boolean
}) {
  const width = 600
  if (data.length < 2) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted">Not enough data</div>
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 10) - 5])
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${path} L${width},${height} L0,${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      {fill && <path d={area} fill={stroke} opacity={0.08} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function BarChart({ data, height = 160 }: { data: { label?: string; value: number }[]; height?: number }) {
  const width = 600
  if (!data.length) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted">No data</div>
  }
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.value)))
  const bw = width / data.length
  const mid = height / 2
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <line x1={0} y1={mid} x2={width} y2={mid} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / maxAbs) * (mid - 4)
        const y = d.value >= 0 ? mid - h : mid
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.15}
            y={y}
            width={bw * 0.7}
            height={Math.max(1, h)}
            fill={d.value >= 0 ? 'var(--pos)' : 'var(--neg)'}
            opacity={0.85}
          />
        )
      })}
    </svg>
  )
}

export function Donut({ value, label }: { value: number; label: string }) {
  // value 0..1
  const r = 42
  const c = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(1, value)) * c
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24">
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={10}
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x={50} y={54} textAnchor="middle" className="fill-[var(--text)]" fontSize={18} fontWeight={600}>
          {(value * 100).toFixed(0)}%
        </text>
      </svg>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}
