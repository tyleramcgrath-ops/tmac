'use client'

import type { DigitalDnaArea, DigitalDnaUnderstanding } from '@/lib/north-star-preview-data'

const STATE_COLOR: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': '#34d399',
  'partially-understood': '#fbbf24',
  'needs-verification': '#4f8bff',
  'not-connected': '#4b5568',
}

const STATE_LABEL: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': 'Understood',
  'partially-understood': 'Developing',
  'needs-verification': 'Needs confirmation',
  'not-connected': 'Not connected',
}

/** Semantic relationships — each pair reflects an actual business connection, not decoration. */
const EDGES: [string, string][] = [
  ['identity', 'services'],
  ['identity', 'locations'],
  ['identity', 'customers'],
  ['services', 'customers'],
  ['services', 'competitors'],
  ['locations', 'reputation'],
  ['reputation', 'website'],
  ['website', 'conversion'],
  ['offers', 'marketing'],
  ['marketing', 'competitors'],
  ['seasonality', 'services'],
]

const VIEW_W = 600
const VIEW_H = 400
const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 }
const RADIUS = 155

function layoutNodes(areas: DigitalDnaArea[]) {
  const hub = areas.find((a) => a.key === 'identity')
  const spokes = areas.filter((a) => a.key !== 'identity')
  const positions = new Map<string, { x: number; y: number }>()
  if (hub) positions.set(hub.key, CENTER)
  spokes.forEach((a, i) => {
    const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2
    positions.set(a.key, {
      x: CENTER.x + RADIUS * Math.cos(angle),
      y: CENTER.y + RADIUS * Math.sin(angle) * 0.82,
    })
  })
  return positions
}

function strengthenHint(u: DigitalDnaUnderstanding): string {
  switch (u) {
    case 'not-connected':
      return 'Connecting a new source or running another check will start building this out.'
    case 'needs-verification':
      return 'A few more checks over time would confirm this.'
    case 'partially-understood':
      return 'Checking additional pages or connecting another source would complete this picture.'
    case 'well-understood':
      return 'This is solid. Occasional re-checks will keep it current.'
  }
}

export function CCDigitalDnaHero({
  areas,
  pagesChecked,
  selectedKey,
  onSelect,
}: {
  areas: DigitalDnaArea[]
  pagesChecked: number
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  const positions = layoutNodes(areas)
  const understood = areas.filter((a) => a.understanding === 'well-understood').length

  return (
    <section className="cc-dna-hero cc-fade-in" aria-labelledby="dna-hero-heading">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 id="dna-hero-heading" className="text-base font-semibold text-white">Digital DNA</h2>
          <p className="mt-1 text-xs text-[var(--rf-faint)]">
            {understood} of {areas.length} areas understood · built from {pagesChecked} page{pagesChecked === 1 ? '' : 's'} checked
          </p>
        </div>
      </div>

      <div className="cc-dna-svg-wrap">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" role="img" aria-label="Digital DNA relationship map">
          <g aria-hidden="true">
            {EDGES.map(([a, b], i) => {
              const pa = positions.get(a)
              const pb = positions.get(b)
              if (!pa || !pb) return null
              return (
                <line
                  key={i}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke="rgba(148,173,224,0.18)"
                  strokeWidth={1}
                />
              )
            })}
          </g>
          {areas.map((area) => {
            const pos = positions.get(area.key)
            if (!pos) return null
            const isHub = area.key === 'identity'
            const r = isHub ? 15 : 9 + Math.min(area.evidenceCount, 6)
            const color = STATE_COLOR[area.understanding]
            const isRight = pos.x >= CENTER.x
            return (
              <g
                key={area.key}
                className="cc-dna-node"
                data-selected={selectedKey === area.key}
                tabIndex={0}
                role="button"
                aria-pressed={selectedKey === area.key}
                aria-label={`${area.label}: ${STATE_LABEL[area.understanding]}`}
                onClick={() => onSelect(area.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(area.key) } }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={color}
                  fillOpacity={selectedKey === area.key ? 0.9 : 0.7}
                  stroke={selectedKey === area.key ? 'white' : 'transparent'}
                  strokeWidth={1.5}
                />
                <text
                  x={pos.x + (isRight ? r + 8 : -(r + 8))}
                  y={pos.y + 4}
                  textAnchor={isRight ? 'start' : 'end'}
                  fontSize={12}
                  fontWeight={isHub ? 700 : 500}
                  fill={selectedKey === area.key ? '#fff' : '#c7d2e8'}
                >
                  {area.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="cc-dna-legend">
        {(Object.keys(STATE_LABEL) as DigitalDnaUnderstanding[]).map((k) => (
          <span key={k} className="cc-dna-legend-item">
            <span className="cc-dna-legend-dot" style={{ background: STATE_COLOR[k] }} />
            {STATE_LABEL[k]}
          </span>
        ))}
      </div>

      {selectedKey && (() => {
        const area = areas.find((a) => a.key === selectedKey)
        if (!area) return null
        return (
          <div className="mt-4 rounded-xl border border-[var(--rf-card-line)] bg-white/[0.015] p-4 cc-fade-in">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{area.label}</p>
              <span className="text-xs font-medium" style={{ color: STATE_COLOR[area.understanding] }}>{STATE_LABEL[area.understanding]}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--rf-muted)] leading-relaxed">{area.note}</p>
            <p className="mt-2 text-xs text-[var(--rf-faint)]">What would strengthen this: {strengthenHint(area.understanding)}</p>
          </div>
        )
      })()}
    </section>
  )
}
