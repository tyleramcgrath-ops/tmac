'use client'

import { useState } from 'react'
import { Compass } from 'lucide-react'
import { PREVIEW_SCENARIOS, DEFAULT_SCENARIO_ID, type PreviewScenarioId } from '@/lib/north-star-preview-data'
import { PreviewStateSwitcher } from '@/components/north-star/PreviewStateSwitcher'
import { MorningBriefing } from '@/components/north-star/MorningBriefing'
import { ApprovalNeeded } from '@/components/north-star/ApprovalNeeded'
import { PrimaryOpportunity } from '@/components/north-star/PrimaryOpportunity'
import { RunNow } from '@/components/north-star/RunNow'
import { AgentActivity } from '@/components/north-star/AgentActivity'
import { DigitalDNASummary } from '@/components/north-star/DigitalDNASummary'
import { AskCompass } from '@/components/north-star/AskCompass'
import { BriefingHistory } from '@/components/north-star/BriefingHistory'

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

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-white sm:mb-10">
          <Compass className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          North Star
          <span className="hidden font-normal text-[var(--rf-faint)] sm:inline">— your business growth advisor</span>
        </div>

        <main id="main-content" className="flex flex-col gap-6 sm:gap-8">
          <MorningBriefing scenario={scenario} />

          <PrimaryOpportunity opportunity={scenario.opportunity} stale={scenario.opportunityStale} />

          <RunNow scenario={scenario} />

          {scenario.pendingApproval && <ApprovalNeeded approval={scenario.pendingApproval} />}

          <div className="grid items-start gap-6 sm:gap-8 md:grid-cols-2">
            <AgentActivity items={scenario.activity} />
            <DigitalDNASummary areas={scenario.digitalDna} pagesChecked={scenario.pagesChecked} />
          </div>

          <AskCompass scenario={scenario} />

          <BriefingHistory items={scenario.history} />
        </main>

        <footer className="mt-10 border-t border-[var(--rf-card-line)] pt-6 text-xs text-[var(--rf-faint)]">
          <p>{scenario.briefing.automationNote}</p>
        </footer>
      </div>
    </>
  )
}
