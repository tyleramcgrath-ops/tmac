'use client'

import type { PreviewScenario } from '@/lib/north-star-preview-data'
import { CCOverlayShell } from '../CCOverlay'

/** A real executive briefing, not a card: status, what changed and didn't,
 *  the one opportunity that matters, approval needs, current work, unknowns,
 *  next check, and a single recommended decision. Readable in under a minute. */
export function MorningBriefingOverlay({ scenario, onClose }: { scenario: PreviewScenario; onClose: () => void }) {
  const currentActivity = scenario.activity.find((a) => a.status !== 'finished' && a.status !== 'waiting')
  const recommendedDecision = scenario.pendingApproval
    ? `Review and decide on: ${scenario.pendingApproval.title}`
    : scenario.opportunity && !scenario.opportunityStale
      ? `Review the opportunity: ${scenario.opportunity.headline}`
      : 'No decision needed today — everything is on track.'

  return (
    <CCOverlayShell title={scenario.briefing.headline} eyebrow="Morning briefing" onClose={onClose}>
      <div className="cc-field">
        <p className="cc-field-label">Current status</p>
        <p className="cc-field-value">{scenario.briefing.subline}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">{scenario.briefing.materialChange ? 'What changed' : 'What did not change'}</p>
        <p className="cc-field-value">
          {scenario.briefing.materialChange
            ? (scenario.opportunity?.evidenceSummary ?? scenario.pendingApproval?.detail ?? 'Something worth reviewing came up on this check.')
            : 'Everything looked the way you left it on your last check.'}
        </p>
      </div>
      {scenario.opportunity && (
        <div className="cc-field">
          <p className="cc-field-label">Primary opportunity</p>
          <p className="cc-field-value">{scenario.opportunity.headline}</p>
        </div>
      )}
      <div className="cc-field">
        <p className="cc-field-label">Approval needs</p>
        <p className="cc-field-value">{scenario.pendingApproval ? scenario.pendingApproval.title : 'Nothing waiting on you.'}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">North Star&apos;s current work</p>
        <p className="cc-field-value">{currentActivity ? currentActivity.label : 'Idle — watching for your next check.'}</p>
      </div>
      {scenario.opportunity && (
        <div className="cc-field">
          <p className="cc-field-label">What remains unknown</p>
          <p className="cc-field-value">{scenario.opportunity.cannotMeasure[0]}</p>
        </div>
      )}
      <div className="cc-field">
        <p className="cc-field-label">Next check</p>
        <p className="cc-field-value">{scenario.briefing.automationConnected ? 'Automatic, tomorrow at 6:00 AM.' : 'Manual — press Check my business whenever you like.'}</p>
      </div>
      <div className="cc-field" style={{ marginBottom: 0 }}>
        <p className="cc-field-label">Recommended decision</p>
        <p className="cc-field-value" style={{ color: 'var(--office-ink)', fontWeight: 500 }}>{recommendedDecision}</p>
      </div>
    </CCOverlayShell>
  )
}
