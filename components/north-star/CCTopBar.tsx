'use client'

import { CheckCircle2, Sparkles, AlertTriangle, RadioTower, Zap } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'

export function CCTopBar({
  scenario,
  investigating,
  onCheckNow,
}: {
  scenario: PreviewScenario
  investigating: boolean
  onCheckNow: () => void
}) {
  const { briefing, business, lastCheckedAt } = scenario

  const tone =
    scenario.id === 'opportunity-found' || scenario.id === 'waiting-approval'
      ? { Icon: Sparkles, cls: 'text-[var(--rf-amber)]' }
      : scenario.id === 'check-failed'
        ? { Icon: AlertTriangle, cls: 'text-[var(--rf-red)]' }
        : scenario.id === 'automation-not-connected'
          ? { Icon: RadioTower, cls: 'text-[var(--rf-faint)]' }
          : { Icon: CheckCircle2, cls: 'text-[var(--rf-green)]' }

  const { Icon } = tone

  return (
    <header className="cc-topbar">
      <div className="cc-topbar-inner">
        <div className="cc-topbar-status">
          <Icon className={`h-4 w-4 shrink-0 ${tone.cls}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="cc-topbar-headline truncate">{briefing.headline} {briefing.subline}</p>
            <p className="text-xs text-[var(--rf-faint)] truncate">{business.name} · {business.domain}</p>
          </div>
        </div>

        <div className="cc-topbar-meta">
          <span className="cc-topbar-meta-item">
            <span className={`ns-dot ${scenario.lastCheckStatus === 'failed' ? 'ns-dot-attention' : 'ns-dot-good'}`} aria-hidden="true" />
            Last check: {lastCheckedAt ?? 'Not checked yet'}
          </span>
          <span className="cc-topbar-meta-item">
            <span className={`ns-dot ${briefing.automationConnected ? 'ns-dot-good' : 'ns-dot-neutral'}`} aria-hidden="true" />
            {briefing.automationConnected ? 'Daily checks on' : 'Manual mode'}
          </span>
          {scenario.pendingApproval && (
            <span className="cc-topbar-meta-item">
              <span className="ns-dot ns-dot-watch" aria-hidden="true" />
              1 waiting for approval
            </span>
          )}
        </div>

        <button onClick={onCheckNow} disabled={investigating} className="cc-topbar-cta ns-touch">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          {investigating ? 'Checking…' : 'Check my business now'}
        </button>
      </div>
    </header>
  )
}
