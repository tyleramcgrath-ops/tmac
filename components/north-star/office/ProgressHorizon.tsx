'use client'

import type { PreviewScenario, HistoryOutcome } from '@/lib/north-star-preview-data'

const OUTCOME_PHRASE: Record<HistoryOutcome, string> = {
  'no-change': 'No material change',
  'opportunity-found': 'Opportunity discovered',
  'waiting-approval': 'Correction prepared',
  'action-completed': 'Change completed',
  'result-unknown': 'Result still unknown',
  'check-incomplete': 'Check incomplete',
}

export function ProgressHorizon({ scenario, onOpen }: { scenario: PreviewScenario; onOpen: () => void }) {
  const items = scenario.history.slice(0, 3)
  const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length

  if (items.length === 0) {
    return <p className="office-horizon-empty">This is your first check — progress will appear here as North Star learns more.</p>
  }

  return (
    <button className="office-horizon" onClick={onOpen} aria-label="Open progress and results history">
      <span className="office-horizon-item"><b>{understood}/{scenario.digitalDna.length}</b> areas understood</span>
      {items.map((h) => (
        <span key={h.id} className="office-horizon-item">· <b>{OUTCOME_PHRASE[h.outcome]}</b> ({h.date})</span>
      ))}
    </button>
  )
}
