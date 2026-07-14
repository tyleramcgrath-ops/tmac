'use client'

import { useState } from 'react'
import { Zap, CheckCircle2, AlertTriangle, Copy, HelpCircle, ClipboardCheck, Loader2, ChevronDown } from 'lucide-react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'

type RunState = 'idle' | 'queued' | 'checking' | 'result'

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
    setState('queued')
    window.setTimeout(() => setState('checking'), 450)
    window.setTimeout(() => setState('result'), 1350)
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

      {state === 'queued' && (
        <StatusBlock icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--rf-blue-bright)]" />} title="Queued" detail="North Star is about to start checking your business." />
      )}

      {state === 'checking' && (
        <StatusBlock icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--rf-blue-bright)]" />} title="Checking your website" detail={`Reviewing ${scenario.business.domain}…`} skeleton />
      )}

      {state === 'result' && <ResultBlock outcome={outcome} onReset={reset} />}

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

function StatusBlock({ icon, title, detail, skeleton }: { icon: React.ReactNode; title: string; detail: string; skeleton?: boolean }) {
  return (
    <div className="mt-4 flex items-center gap-3" role="status" aria-live="polite">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {skeleton ? (
          <div className="ns-skeleton mt-1.5 h-3 w-40 max-w-full" aria-hidden="true" />
        ) : (
          <p className="text-xs text-[var(--rf-muted)]">{detail}</p>
        )}
      </div>
    </div>
  )
}

function ResultBlock({ outcome, onReset }: { outcome: RunOutcome; onReset: () => void }) {
  const content: Record<RunOutcome, { icon: React.ReactNode; title: string; detail: string; tone: string }> = {
    completed: {
      icon: <CheckCircle2 className="h-4 w-4 text-[var(--rf-green)]" />,
      title: 'Check complete',
      detail: 'Your briefing has been updated with what North Star found.',
      tone: 'text-[var(--rf-green)]',
    },
    failed: {
      icon: <AlertTriangle className="h-4 w-4 text-[var(--rf-red)]" />,
      title: "Couldn't complete the check",
      detail: 'Your website may be unreachable right now. North Star will try again automatically.',
      tone: 'text-[var(--rf-red)]',
    },
    duplicate: {
      icon: <Copy className="h-4 w-4 text-[var(--rf-amber)]" />,
      title: 'A check is already running',
      detail: 'North Star started a check moments ago. Let that finish before starting another.',
      tone: 'text-[var(--rf-amber)]',
    },
    'insufficient-evidence': {
      icon: <HelpCircle className="h-4 w-4 text-[var(--rf-muted)]" />,
      title: 'Not enough evidence yet',
      detail: 'North Star reached your site but found too little to confidently update your briefing. It will try again next check.',
      tone: 'text-[var(--rf-muted)]',
    },
    'waiting-approval': {
      icon: <ClipboardCheck className="h-4 w-4 text-[var(--rf-amber)]" />,
      title: 'One update needs your approval',
      detail: 'North Star prepared a change based on this check. Review it below before it goes live.',
      tone: 'text-[var(--rf-amber)]',
    },
  }
  const c = content[outcome]
  return (
    <div className="mt-4 flex items-start justify-between gap-4" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        {c.icon}
        <div>
          <p className={`text-sm font-medium ${c.tone}`}>{c.title}</p>
          <p className="mt-0.5 max-w-sm text-xs text-[var(--rf-muted)]">{c.detail}</p>
        </div>
      </div>
      <button onClick={onReset} className="ns-touch ns-quiet-link shrink-0 text-xs font-medium">
        Done
      </button>
    </div>
  )
}
