'use client'

import { useRef, useState } from 'react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import type { RevealKind } from '@/lib/north-star-investigation'
import type { CompassContext } from '@/lib/north-star-compass'
import { CCRail, type RailPanel } from './CCRail'
import { CCTopBar } from './CCTopBar'
import { CCDigitalDnaHero } from './CCDigitalDnaHero'
import { CCPriorityPanel } from './CCPriorityPanel'
import { CCTimeline } from './CCTimeline'
import { CCInvestigationBanner } from './CCInvestigationBanner'
import { CCOpportunityWorkspace } from './CCOpportunityWorkspace'
import { CCApprovalCenter } from './CCApprovalCenter'
import { CCCompassPanel } from './CCCompassPanel'
import { CCWorkInProgressOverlay, CCResultsOverlay, CCSourcesOverlay, CCEmptyOverlay } from './CCSecondaryOverlays'
import { CCMobileBar } from './CCMobileBar'

type Overlay =
  | 'opportunity'
  | 'opportunity-empty'
  | 'approval'
  | 'approval-empty'
  | 'compass'
  | 'work-in-progress'
  | 'results'
  | 'sources'
  | null

export function CommandCenter({ scenario }: { scenario: PreviewScenario }) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [compassContext, setCompassContext] = useState<CompassContext>('command-center')
  const [selectedDnaKey, setSelectedDnaKey] = useState<string | null>(null)
  const [investigating, setInvestigating] = useState(false)
  const [lastReveal, setLastReveal] = useState<RevealKind | null>(null)
  const dnaRef = useRef<HTMLDivElement>(null)

  const outcome: RunOutcome = scenario.defaultRunOutcome

  const runCheck = () => {
    setLastReveal(null)
    setInvestigating(true)
  }

  const handleInvestigationComplete = (kind: RevealKind) => {
    setInvestigating(false)
    setLastReveal(kind)
    if (kind === 'opportunity') setOverlay('opportunity')
    else if (kind === 'approval') setOverlay('approval')
  }

  const openCompass = (context: CompassContext) => {
    setCompassContext(context)
    setOverlay('compass')
  }

  const handleRailNavigate = (panel: RailPanel) => {
    switch (panel) {
      case 'command-center':
        setOverlay(null)
        break
      case 'compass':
        openCompass('command-center')
        break
      case 'digital-dna':
        dnaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      case 'opportunities':
        setOverlay(scenario.opportunity ? 'opportunity' : 'opportunity-empty')
        break
      case 'work-in-progress':
        setOverlay('work-in-progress')
        break
      case 'approvals':
        setOverlay(scenario.pendingApproval ? 'approval' : 'approval-empty')
        break
      case 'results':
        setOverlay('results')
        break
      case 'sources':
        setOverlay('sources')
        break
    }
  }

  const approvalCount = scenario.pendingApproval ? 1 : 0
  const opportunityCount = scenario.opportunity && !scenario.opportunityStale ? 1 : 0

  return (
    <div className="cc-shell">
      <CCRail onNavigate={handleRailNavigate} approvalCount={approvalCount} opportunityCount={opportunityCount} />

      <CCTopBar scenario={scenario} investigating={investigating} onCheckNow={runCheck} />

      {investigating && (
        <div className="cc-banner-row">
          <CCInvestigationBanner key={scenario.id} scenario={scenario} outcome={outcome} onComplete={handleInvestigationComplete} />
        </div>
      )}

      {!investigating && lastReveal && (lastReveal === 'quiet' || lastReveal === 'failed' || lastReveal === 'duplicate' || lastReveal === 'insufficient') && (
        <div className="cc-banner-row">
          <div className="cc-investigation-banner cc-fade-in" role="status">
            <span className="ns-dot ns-dot-good" aria-hidden="true" />
            <span>
              {lastReveal === 'quiet' && `Checked ${scenario.pagesChecked} pages — nothing rose to the level of your attention.`}
              {lastReveal === 'failed' && `${scenario.business.domain} didn't respond. I'll try again automatically.`}
              {lastReveal === 'duplicate' && 'A check is already underway — let that finish first.'}
              {lastReveal === 'insufficient' && "Not enough evidence gathered before the connection dropped. I'll try again next check."}
            </span>
          </div>
        </div>
      )}

      <div className="cc-workspace">
        <div className="cc-center" ref={dnaRef}>
          <CCDigitalDnaHero
            areas={scenario.digitalDna}
            pagesChecked={scenario.pagesChecked}
            selectedKey={selectedDnaKey}
            onSelect={(key) => setSelectedDnaKey(key === selectedDnaKey ? null : key)}
          />
        </div>
        <CCPriorityPanel
          scenario={scenario}
          onOpenOpportunity={() => setOverlay('opportunity')}
          onOpenApproval={() => setOverlay('approval')}
        />
      </div>

      <CCTimeline scenario={scenario} investigating={investigating} />

      <CCMobileBar
        onCompass={() => openCompass('command-center')}
        onDna={() => dnaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        onOpportunities={() => setOverlay(scenario.opportunity ? 'opportunity' : 'opportunity-empty')}
        onApprovals={() => setOverlay(scenario.pendingApproval ? 'approval' : 'approval-empty')}
        approvalCount={approvalCount}
        opportunityCount={opportunityCount}
      />

      {overlay === 'opportunity' && scenario.opportunity && (
        <CCOpportunityWorkspace opportunity={scenario.opportunity} stale={scenario.opportunityStale} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'opportunity-empty' && (
        <CCEmptyOverlay title="No opportunities" eyebrow="Opportunities" message="North Star hasn't found anything worth reviewing yet." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'approval' && scenario.pendingApproval && (
        <CCApprovalCenter approval={scenario.pendingApproval} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'approval-empty' && (
        <CCEmptyOverlay title="Nothing pending" eyebrow="Approvals" message="Nothing is waiting on your approval right now." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'compass' && (
        <CCCompassPanel scenario={scenario} context={compassContext} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'work-in-progress' && (
        <CCWorkInProgressOverlay activity={scenario.activity} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'results' && (
        <CCResultsOverlay history={scenario.history} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'sources' && (
        <CCSourcesOverlay areas={scenario.digitalDna} pagesChecked={scenario.pagesChecked} onClose={() => setOverlay(null)} />
      )}
    </div>
  )
}
