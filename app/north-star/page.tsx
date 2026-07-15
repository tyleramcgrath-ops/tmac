'use client'

import { useState } from 'react'
import { PREVIEW_SCENARIOS, DEFAULT_SCENARIO_ID, type PreviewScenarioId } from '@/lib/north-star-preview-data'
import { PreviewStateSwitcher } from '@/components/north-star/PreviewStateSwitcher'
import { ExecutiveOffice } from '@/components/north-star/office/ExecutiveOffice'

export default function NorthStarPage() {
  const [scenarioId, setScenarioId] = useState<PreviewScenarioId>(DEFAULT_SCENARIO_ID)
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

      <ExecutiveOffice key={scenarioId} scenario={scenario} />
    </>
  )
}
