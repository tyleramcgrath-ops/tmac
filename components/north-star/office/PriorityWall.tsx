'use client'

import type { PreviewScenario } from '@/lib/north-star-preview-data'

/** Exactly what the spec asks for: the top opportunity, anything waiting for approval,
 *  and the single next recommended action. Never more than three items. */
export function PriorityWall({
  scenario,
  onOpenOpportunity,
  onOpenApproval,
}: {
  scenario: PreviewScenario
  onOpenOpportunity: () => void
  onOpenApproval: () => void
}) {
  const nextAction = scenario.pendingApproval
    ? 'Review the prepared approval'
    : scenario.opportunity && !scenario.opportunityStale
      ? scenario.opportunity.guideSteps[0]?.title ?? 'Review the opportunity below'
      : 'Nothing needs action right now'

  return (
    <div className="office-wall office-wall-right" aria-labelledby="priority-wall-heading">
      <h3 id="priority-wall-heading">Today&apos;s priorities</h3>

      {scenario.opportunity ? (
        <button className="office-wall-item" data-actionable="true" onClick={onOpenOpportunity}>
          <span className="office-wall-dot" style={{ background: '#e08a7f' }} />
          <span>{scenario.opportunity.headline}</span>
        </button>
      ) : (
        <div className="office-wall-item"><span className="office-wall-dot" style={{ background: 'var(--rf-faint)' }} /><span className="office-wall-empty">Nothing needs attention right now.</span></div>
      )}

      {scenario.pendingApproval ? (
        <button className="office-wall-item" data-actionable="true" onClick={onOpenApproval}>
          <span className="office-wall-dot" style={{ background: 'var(--office-brass)' }} />
          <span>{scenario.pendingApproval.title}</span>
        </button>
      ) : (
        <div className="office-wall-item"><span className="office-wall-dot" style={{ background: 'var(--rf-faint)' }} /><span className="office-wall-empty">Nothing waiting for approval.</span></div>
      )}

      <div className="office-wall-item">
        <span className="office-wall-dot" style={{ background: 'var(--rf-blue-bright)' }} />
        <span>Next: {nextAction}</span>
      </div>
    </div>
  )
}
