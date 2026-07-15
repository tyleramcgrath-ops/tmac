'use client'

import { useState } from 'react'
import { PREVIEW_SCENARIOS, DEFAULT_SCENARIO_ID, type PreviewScenarioId } from '@/lib/north-star-preview-data'
import { PreviewStateSwitcher } from '@/components/north-star/PreviewStateSwitcher'
import { NSArrival } from '@/components/north-star/NSArrival'
import { NSOpportunity } from '@/components/north-star/NSOpportunity'
import { NSApproval } from '@/components/north-star/NSApproval'
import { NSDigitalDNA } from '@/components/north-star/NSDigitalDNA'
import { NSWorking } from '@/components/north-star/NSWorking'
import { NSCompass } from '@/components/north-star/NSCompass'
import { NSHistory } from '@/components/north-star/NSHistory'

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

      <div className="min-h-screen bg-gradient-to-b from-[var(--rf-bg-dark)] via-[var(--rf-bg-dark)] to-[var(--rf-bg-dark)]">
        {/* key forces clean re-entrance animations on scenario switch */}
        <main key={scenarioId} id="main-content" className="ns-main-flow">
          <NSArrival scenario={scenario} />
          <NSOpportunity opportunity={scenario.opportunity ?? undefined} hasOpportunity={!!scenario.opportunity && !scenario.opportunityStale} />
          {scenario.pendingApproval && <NSApproval approval={scenario.pendingApproval} />}
          <NSDigitalDNA dnaAreas={scenario.digitalDna} pagesChecked={scenario.pagesChecked} />
          <NSWorking activity={scenario.activity} />
          <NSCompass scenario={scenario} />
          <NSHistory items={scenario.history} automationNote={scenario.briefing.automationNote} />
        </main>
      </div>
    </>
  )
}
