'use client'

import { useState } from 'react'
import { PREVIEW_SCENARIOS, DEFAULT_SCENARIO_ID, type PreviewScenarioId } from '@/lib/north-star-preview-data'
import { PreviewStateSwitcher } from '@/components/north-star/PreviewStateSwitcher'
import { ExecutiveOffice } from '@/components/north-star/office/ExecutiveOffice'
import { LiveDigitalDna } from '@/components/north-star/LiveDigitalDna'

export default function NorthStarPage() {
  const [scenarioId, setScenarioId] = useState<PreviewScenarioId>(DEFAULT_SCENARIO_ID)
  const [showLive, setShowLive] = useState(false)
  const scenario = PREVIEW_SCENARIOS[scenarioId]

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--rf-blue-bright)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <PreviewStateSwitcher active={scenarioId} onChange={setScenarioId} />

      {/* Live data (real engine, same-origin /api/*). Preview stays available. */}
      <button
        onClick={() => setShowLive(true)}
        className="fixed right-4 top-4 z-50 rounded-full border border-[#c9a87766] bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#c9a877] hover:bg-black/70"
      >
        Live data
      </button>

      <ExecutiveOffice key={scenarioId} scenario={scenario} />

      {showLive && <LiveDigitalDna onClose={() => setShowLive(false)} />}
    </>
  )
}
