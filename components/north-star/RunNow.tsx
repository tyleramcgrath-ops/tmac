'use client'

import { useState } from 'react'
import { Zap, ChevronDown } from 'lucide-react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import { Investigation } from './Investigation'

type RunState = 'idle' | 'investigating'

const OUTCOME_OPTIONS: { id: RunOutcome; label: string }[] = [
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'duplicate', label: 'Duplicate run already active' },
  { id: 'insufficient-evidence', label: 'Insufficient evidence' },
  { id: 'waiting-approval', label: 'Waiting for approval' },
]

export function RunNow({ scenario }: { scenario: PreviewScenario }) {
  const [state, setState] = useState<RunState>('idle')
  const [outcome, setOutcome] = useState<RunOutcome>(scenario.defaultRunOutcome)
  const [infoOpen, setInfoOpen] = useState(false)
  const [simulateOpen, setSimulateOpen] = useState(false)

  const runCheck = () => {
    setInfoOpen(false)
    setState('investigating')
  }

  const reset = () => setState('idle')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {state === 'idle' && (
          <>
            <button
              onClick={runCheck}
              className="ns-touch ns-lift inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-[var(--rf-blue-bright)] to-[var(--rf-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(47,107,255,0.7)]"
            >
              <Zap className="h-4 w-4" /> Check my business now
            </button>
            <button
              onClick={() => setInfoOpen((v) => !v)}
              aria-expanded={infoOpen}
              aria-controls="run-now-info"
              className="ns-touch inline-flex items-center gap-1 text-sm text-[var(--rf-faint)] transition-colors hover:text-[var(--rf-muted)]"
            >
              What will this check?
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}
      </div>

      {state === 'idle' && (
        <div className={`ns-expand ${infoOpen ? 'ns-expand-open' : ''}`} id="run-now-info">
          <div>
            <div className="mt-4 grid gap-3 border-t border-[var(--rf-card-line)] pt-4 sm:grid-cols-3">
              <InfoRow label="Website" value={scenario.business.domain} />
              <InfoRow label="North Star will review" value="Pages, contact paths, business info, structure" />
              <InfoRow
                label="This run is"
                value={scenario.briefing.automationConnected ? 'A manual check — daily automatic checks are also on' : 'A one-time manual check'}
              />
            </div>
          </div>
        </div>
      )}

      {state === 'investigating' && (
        <Investigation key={outcome} scenario={scenario} outcome={outcome} onDone={reset} />
      )}

      {/* Dev-only preview control — clearly labeled, never shown to a real customer */}
      {state === 'idle' && (
        <div className="mt-5">
          <button
            onClick={() => setSimulateOpen((v) => !v)}
            className="ns-touch inline-flex items-center gap-1.5 text-xs text-[var(--rf-faint)] hover:text-[var(--rf-muted)]"
          >
            <span className="ns-preview-badge">Preview</span>
            Simulate a different result for testing
          </button>
          <div className={`ns-expand ${simulateOpen ? 'ns-expand-open' : ''}`}>
            <div>
              <div className="mt-2.5 flex flex-wrap gap-2 pt-0.5">
                {OUTCOME_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    className={`ns-touch rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      outcome === o.id
                        ? 'border-[var(--rf-blue-bright)]/50 bg-[var(--rf-blue-bright)]/10 text-[var(--rf-blue-bright)]'
                        : 'border-[var(--rf-card-line)] text-[var(--rf-muted)] hover:border-[var(--rf-card-line-strong)]'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p>
      <p className="mt-0.5 text-sm leading-snug text-white">{value}</p>
    </div>
  )
}
