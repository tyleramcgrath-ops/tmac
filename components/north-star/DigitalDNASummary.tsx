'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DigitalDnaArea, DigitalDnaUnderstanding } from '@/lib/north-star-preview-data'

const UNDERSTANDING_LABEL: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': 'Well understood',
  'partially-understood': 'Partially understood',
  'needs-verification': 'Needs verification',
  'not-connected': 'Not connected',
}

const UNDERSTANDING_CLASS: Record<DigitalDnaUnderstanding, string> = {
  'well-understood': 'ns-pill ns-pill-well',
  'partially-understood': 'ns-pill ns-pill-partial',
  'needs-verification': 'ns-pill ns-pill-verify',
  'not-connected': 'ns-pill ns-pill-off',
}

/** Content-only: the Digital DNA summary + expandable area list, no outer card of its own. Meant to live inside a shared shell (see BehindTheScenes.tsx). */
export function DigitalDNAList({ areas, pagesChecked }: { areas: DigitalDnaArea[]; pagesChecked: number }) {
  const [expanded, setExpanded] = useState(false)
  const wellUnderstood = areas.filter((a) => a.understanding === 'well-understood').length

  return (
    <div>
      <p className="text-sm leading-relaxed text-[var(--rf-muted)]">
        North Star keeps learning every time it checks — <span className="font-medium text-white">{wellUnderstood} of {areas.length}</span> areas are well understood so far, based on {pagesChecked} page{pagesChecked === 1 ? '' : 's'} checked.
      </p>

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="dna-areas"
        className="ns-touch mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--rf-blue-bright)] hover:underline"
      >
        {expanded ? 'Hide the detail' : 'See what North Star knows, area by area'}
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`ns-expand ${expanded ? 'ns-expand-open' : ''}`} id="dna-areas">
        <div>
          <ul className="mt-4 divide-y divide-[var(--rf-card-line)] border-t border-[var(--rf-card-line)]">
            {areas.map((area) => (
              <li key={area.key} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{area.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--rf-muted)]">{area.note}</p>
                </div>
                <span className={`${UNDERSTANDING_CLASS[area.understanding]} shrink-0`}>
                  {UNDERSTANDING_LABEL[area.understanding]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
