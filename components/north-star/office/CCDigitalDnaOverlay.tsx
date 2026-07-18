'use client'

import { useState } from 'react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'
import { CCOverlayShell } from '../CCOverlay'
import { DnaSculpture } from './DnaSculpture'

/**
 * The Digital DNA destination — where the Business Twin used to live in the
 * confirmed baseline (north-star-station @ 546fb87). Same drawer mechanism
 * as every other executive destination (CCOverlayShell), just carrying the
 * Living Digital DNA sculpture instead of the old evidence-graph
 * constellation view: the one-for-one substitution the restoration asked
 * for, in the destination's exact position and footprint.
 */
export function CCDigitalDnaOverlay({
  scenario,
  investigating,
  activeKey,
  onClose,
  onAskCompass,
  onOpenSources,
}: {
  scenario: PreviewScenario
  investigating: boolean
  activeKey: string | null
  onClose: () => void
  onAskCompass: () => void
  onOpenSources: () => void
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
  // the same weighting DnaSculpture uses internally for its own light source,
  // read here only to let the DNA cast that same light into the room around it
  const warmth = scenario.digitalDna.length
    ? scenario.digitalDna.reduce((sum, a) => sum + (
        a.understanding === 'well-understood' ? 1
        : a.understanding === 'partially-understood' ? 0.5
        : a.understanding === 'needs-verification' ? 0.2
        : 0
      ), 0) / scenario.digitalDna.length
    : 0

  return (
    <CCOverlayShell title="Your living understanding of the business" eyebrow="Digital DNA" onClose={onClose}>
      <p className="text-sm text-[var(--rf-muted)] mb-2">
        {understood} of {scenario.digitalDna.length} areas well understood — built from {scenario.pagesChecked} page
        {scenario.pagesChecked === 1 ? '' : 's'} checked. Select a strand to see what it means and what would strengthen it.
      </p>
      <div className="relative">
        {/* the sculpture casts believable light into its own room, not just
            onto itself — a soft, understanding-scaled glow behind the canvas */}
        <div
          aria-hidden="true"
          className="hq-dna-cast pointer-events-none absolute inset-0 -z-10"
          style={{ opacity: 0.35 + warmth * 0.55 }}
        />
        <DnaSculpture
          areas={scenario.digitalDna}
          pagesChecked={scenario.pagesChecked}
          selectedKey={selectedKey}
          activeKey={activeKey}
          investigating={investigating}
          onSelect={(k) => setSelectedKey(k === selectedKey ? null : k)}
          onAskCompass={onAskCompass}
        />
      </div>
      <button onClick={onOpenSources} className="mt-2 text-xs font-medium text-[var(--office-brass-bright)] hover:underline">
        View all sources →
      </button>
    </CCOverlayShell>
  )
}
