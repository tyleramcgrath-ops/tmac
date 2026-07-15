'use client'

import type { DigitalDnaArea, DigitalDnaUnderstanding } from '@/lib/north-star-preview-data'

const STATE_COLOR: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': '#7fd8ae',
  'partially-understood': '#e3b563',
  'needs-verification': '#7fa8d8',
  'not-connected': '#565c6b',
}
const STATE_LABEL: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': 'Understood',
  'partially-understood': 'Developing',
  'needs-verification': 'Needs confirmation',
  'not-connected': 'Not connected',
}

/** The three sections that anchor the business — everything else is a supporting signal, not equally loud. */
const MAJOR_KEYS = ['identity', 'services', 'website']

const CX = 550, CY = 190, RX = 430, RY = 150

function layout(areas: DigitalDnaArea[]) {
  const hub = areas.find((a) => a.key === 'identity')
  const spokes = areas.filter((a) => a.key !== 'identity')
  const positions = new Map<string, { x: number; y: number }>()
  if (hub) positions.set(hub.key, { x: CX, y: CY })
  spokes.forEach((a, i) => {
    const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2
    positions.set(a.key, { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) })
  })
  return positions
}

function strengthenHint(u: DigitalDnaUnderstanding): string {
  switch (u) {
    case 'not-connected': return 'Connecting a new source or running another check will start building this out.'
    case 'needs-verification': return 'A few more checks over time would confirm this.'
    case 'partially-understood': return 'Checking additional pages or connecting another source would complete this picture.'
    case 'well-understood': return 'This is solid. Occasional re-checks will keep it current.'
  }
}

export function DnaSculpture({
  areas,
  pagesChecked,
  selectedKey,
  activeKey,
  onSelect,
  onAskCompass,
}: {
  areas: DigitalDnaArea[]
  pagesChecked: number
  selectedKey: string | null
  activeKey: string | null
  onSelect: (key: string) => void
  onAskCompass?: () => void
}) {
  const positions = layout(areas)
  const understood = areas.filter((a) => a.understanding === 'well-understood').length
  const selected = areas.find((a) => a.key === selectedKey)

  return (
    <section aria-label="Digital DNA">
      <div className="office-dna-wrap">
        <div className="office-dna-core" data-active={activeKey === 'identity'} aria-hidden="true" />
        {areas.map((area) => {
          const pos = positions.get(area.key)
          if (!pos) return null
          const isMajor = MAJOR_KEYS.includes(area.key)
          const size = isMajor ? 30 : 15 + Math.min(area.evidenceCount, 5) * 2
          return (
            <button
              key={area.key}
              className="office-dna-node"
              data-selected={selectedKey === area.key}
              data-active={activeKey === area.key}
              style={{
                left: pos.x - size / 2,
                top: pos.y - size / 2,
                width: size,
                height: size,
                background: STATE_COLOR[area.understanding],
                boxShadow: `0 0 ${isMajor ? 30 : 16}px -2px ${STATE_COLOR[area.understanding]}`,
              }}
              onClick={() => onSelect(area.key)}
              aria-pressed={selectedKey === area.key}
              aria-label={`${area.label}: ${STATE_LABEL[area.understanding]}`}
            >
              <span className="office-dna-label" data-major={isMajor}>{area.label}</span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-[var(--rf-faint)]" style={{ marginTop: -4 }}>
        {understood} of {areas.length} areas understood · built from {pagesChecked} page{pagesChecked === 1 ? '' : 's'} checked
      </p>

      <div className="office-dna-legend">
        {(Object.keys(STATE_LABEL) as DigitalDnaUnderstanding[]).map((k) => (
          <span key={k} className="office-dna-legend-item">
            <span className="office-dna-legend-dot" style={{ background: STATE_COLOR[k] }} />
            {STATE_LABEL[k]}
          </span>
        ))}
      </div>

      {selected && (
        <div className="office-dna-detail" role="region" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{selected.label}</p>
            <span className="text-xs font-medium" style={{ color: STATE_COLOR[selected.understanding] }}>{STATE_LABEL[selected.understanding]}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--rf-muted)] leading-relaxed">{selected.note}</p>
          <p className="mt-2 text-xs text-[var(--rf-faint)]">What would strengthen this: {strengthenHint(selected.understanding)}</p>
          {onAskCompass && (
            <button onClick={onAskCompass} className="mt-3 text-xs font-medium text-[var(--office-brass-bright)] hover:underline">
              Ask Compass about this →
            </button>
          )}
        </div>
      )}
    </section>
  )
}
