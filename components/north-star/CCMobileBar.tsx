'use client'

import { Compass, Dna, Target, ClipboardCheck } from 'lucide-react'

export function CCMobileBar({
  onCompass,
  onDna,
  onOpportunities,
  onApprovals,
  approvalCount,
  opportunityCount,
}: {
  onCompass: () => void
  onDna: () => void
  onOpportunities: () => void
  onApprovals: () => void
  approvalCount: number
  opportunityCount: number
}) {
  return (
    <nav className="cc-mobile-bar" aria-label="North Star quick actions">
      <button className="cc-mobile-bar-item ns-touch" onClick={onDna}>
        <Dna className="h-5 w-5" aria-hidden="true" /> Digital DNA
      </button>
      <button className="cc-mobile-bar-item ns-touch" data-has-badge={opportunityCount > 0} onClick={onOpportunities}>
        <Target className="h-5 w-5" aria-hidden="true" /> Opportunities
      </button>
      <button className="cc-mobile-bar-item ns-touch" data-has-badge={approvalCount > 0} onClick={onApprovals}>
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> Approvals
      </button>
      <button className="cc-mobile-bar-item ns-touch" onClick={onCompass}>
        <Compass className="h-5 w-5" aria-hidden="true" /> Compass
      </button>
    </nav>
  )
}
