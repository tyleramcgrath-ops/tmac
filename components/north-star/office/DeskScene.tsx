'use client'

import type { PreviewScenario } from '@/lib/north-star-preview-data'

export function DeskScene({
  scenario,
  investigating,
  onOpenBriefing,
  onOpenCompass,
  onOpenApproval,
  onCheckNow,
}: {
  scenario: PreviewScenario
  investigating: boolean
  onOpenBriefing: () => void
  onOpenCompass: () => void
  onOpenApproval: () => void
  onCheckNow: () => void
}) {
  const needsAttention = scenario.activity.some((a) => a.status === 'needs-attention')

  return (
    <div className="office-desk-zone" aria-label="Executive desk">
      <div className="office-desk-surface" />
      <div className="office-desk-edge" />
      <div className="office-desk-front" />
      <div className="office-desk-objects">
        <button className="office-obj office-obj-briefing ns-serif" onClick={onOpenBriefing} aria-label="Open Morning Briefing">
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6 }}>Morning Briefing</div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{scenario.briefing.headline}</div>
        </button>

        <button className="office-obj office-obj-compass" onClick={onOpenCompass} aria-label="Ask Compass">
          <span className="office-compass-face"><span className="office-compass-needle" /></span>
          <span style={{ fontSize: 11, color: 'var(--rf-muted)' }}>Ask Compass</span>
        </button>

        <button className="office-obj office-obj-tray" onClick={onOpenApproval} aria-label={scenario.pendingApproval ? 'Open Approval Center' : 'Approval tray, empty'}>
          <div style={{ fontSize: 11, color: 'var(--rf-muted)' }}>Approval tray</div>
          <div style={{ fontSize: 12, color: scenario.pendingApproval ? 'var(--office-brass-bright)' : 'var(--rf-faint)', marginTop: 4 }}>
            {scenario.pendingApproval ? '1 waiting' : 'Empty'}
          </div>
        </button>

        <button className="office-obj-cta ns-touch office-obj" onClick={onCheckNow} disabled={investigating} aria-label="Check my business now">
          ⚡ {investigating ? 'Checking…' : 'Check my business'}
        </button>

        <span className="office-activity-light" style={{ background: needsAttention ? 'var(--rf-red)' : 'var(--rf-green)', boxShadow: `0 0 14px 3px ${needsAttention ? 'var(--rf-red)' : 'var(--rf-green)'}` }} aria-hidden="true" />
      </div>
    </div>
  )
}
