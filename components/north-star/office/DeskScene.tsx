'use client'

import type { PreviewScenario } from '@/lib/north-star-preview-data'

export function DeskScene({
  scenario,
  investigating,
  briefPulse = false,
  approvalArrived = false,
  compassReaction = null,
  onOpenBriefing,
  onOpenCompass,
  onOpenApproval,
  onCheckNow,
}: {
  scenario: PreviewScenario
  investigating: boolean
  briefPulse?: boolean
  approvalArrived?: boolean
  compassReaction?: string | null
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
        {/* Stage 5: Morning Brief flashes an "updated" highlight when the check rewrites it */}
        <button className={`office-obj office-obj-briefing ns-serif${briefPulse ? ' brief-updated' : ''}`} onClick={onOpenBriefing} aria-label={`Open Morning Briefing${briefPulse ? ', updated moments ago' : ''}`}>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6 }}>
            Morning Briefing{briefPulse && <span style={{ color: 'var(--office-brass-bright)' }}> · updated</span>}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{scenario.briefing.headline}</div>
        </button>

        {/* Stage 4: Compass speaks from understanding, present on the desk */}
        <button className={`office-obj office-obj-compass${compassReaction ? ' compass-speaking' : ''}`} onClick={onOpenCompass} aria-label={`Ask Compass${compassReaction ? ': ' + compassReaction : ''}`}>
          <span className="office-compass-face"><span className="office-compass-needle" /></span>
          <span style={{ fontSize: 11, color: 'var(--rf-muted)' }}>{compassReaction ? 'Compass' : 'Ask Compass'}</span>
          {compassReaction && <span className="office-compass-say" role="status" aria-live="polite">{compassReaction}</span>}
        </button>

        {/* Stage 6: prepared work — a folder that slides onto the desk, or an empty tray */}
        {scenario.pendingApproval ? (
          <button className={`office-obj office-obj-folder${approvalArrived ? ' folder-arrived' : ''}`} onClick={onOpenApproval} aria-label="Open the prepared approval folder">
            <span className="office-folder-tab" aria-hidden="true" />
            <div style={{ fontSize: 11, color: 'var(--rf-muted)' }}>Prepared for you</div>
            <div style={{ fontSize: 12, color: 'var(--office-brass-bright)', marginTop: 3, fontWeight: 600 }}>{scenario.pendingApproval.title}</div>
          </button>
        ) : (
          <button className="office-obj office-obj-tray" onClick={onOpenApproval} aria-label="Approval tray, empty">
            <div style={{ fontSize: 11, color: 'var(--rf-muted)' }}>Approval tray</div>
            <div style={{ fontSize: 12, color: 'var(--rf-faint)', marginTop: 4 }}>Empty</div>
          </button>
        )}

        <button className="office-obj-cta ns-touch office-obj" onClick={onCheckNow} disabled={investigating} aria-label="Check my business now">
          ⚡ {investigating ? 'Checking…' : 'Check my business'}
        </button>

        <span className="office-activity-light" style={{ background: needsAttention ? 'var(--rf-red)' : 'var(--rf-green)', boxShadow: `0 0 14px 3px ${needsAttention ? 'var(--rf-red)' : 'var(--rf-green)'}` }} aria-hidden="true" />
      </div>
    </div>
  )
}
