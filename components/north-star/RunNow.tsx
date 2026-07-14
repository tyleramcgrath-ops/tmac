'use client'

import { useState } from 'react'
import { Zap, Globe, ListChecks, RefreshCcw, CheckCircle2, AlertTriangle, Copy, HelpCircle, ClipboardCheck, Loader2 } from 'lucide-react'
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
  const [simulateOpen, setSimulateOpen] = useState(false)

  const runCheck = () => {
    setState('queued')
    window.setTimeout(() => setState('checking'), 500)
    window.setTimeout(() => setState('result'), 1400)
  }

  const reset = () => setState('idle')

  return (
    <section aria-labelledby="run-now-heading" className="ns-panel ns-fade-in p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="run-now-heading" className="text-lg font-semibold text-white">Check my business now</h2>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--rf-muted)]">
            North Star will review your current business evidence, update what it understands, and prepare a new briefing.
          </p>
        </div>
        {state === 'idle' && (
          <button
            onClick={runCheck}
            className="ns-touch inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-[var(--rf-blue-bright)] to-[var(--rf-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(47,107,255,0.7)] transition-transform hover:-translate-y-0.5"
          >
            <Zap className="h-4 w-4" /> Check my business now
          </button>
        )}
      </div>

      {state === 'idle' && (
        <div className="mt-5 grid gap-3 border-t border-[var(--rf-card-line)] pt-5 sm:grid-cols-3">
          <InfoRow icon={Globe} label="Website" value={scenario.business.domain} />
          <InfoRow icon={ListChecks} label="North Star will review" value="Pages, contact paths, business info, structure" />
          <InfoRow
            icon={RefreshCcw}
            label="This run is"
            value={scenario.briefing.automationConnected ? 'A manual check — daily automatic checks are also on' : 'A one-time manual check'}
          />
        </div>
      )}

      {state === 'queued' && (
        <StatusBlock icon={<Loader2 className="h-5 w-5 animate-spin text-[var(--rf-blue-bright)]" />} title="Queued" detail="North Star is about to start checking your business." />
      )}

      {state === 'checking' && (
        <StatusBlock icon={<Loader2 className="h-5 w-5 animate-spin text-[var(--rf-blue-bright)]" />} title="Checking your website" detail={`Reviewing ${scenario.business.domain}…`} />
      )}

      {state === 'result' && <ResultBlock outcome={outcome} onReset={reset} />}

      {/* Dev-only preview control — clearly labeled, never shown to a real customer */}
      {state === 'idle' && (
        <div className="mt-5 border-t border-[var(--rf-card-line)] pt-4">
          <button
            onClick={() => setSimulateOpen((v) => !v)}
            className="ns-touch inline-flex items-center gap-1.5 text-xs text-[var(--rf-faint)] hover:text-[var(--rf-muted)]"
          >
            <span className="ns-preview-badge">Preview</span>
            Simulate a different result for testing
          </button>
          {simulateOpen && (
            <div className="mt-2.5 flex flex-wrap gap-2">
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
          )}
        </div>
      )}
    </section>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p>
        <p className="mt-0.5 text-sm leading-snug text-white">{value}</p>
      </div>
    </div>
  )
}

function StatusBlock({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-[var(--rf-card-line)] pt-5" role="status" aria-live="polite">
      {icon}
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-[var(--rf-muted)]">{detail}</p>
      </div>
    </div>
  )
}

function ResultBlock({ outcome, onReset }: { outcome: RunOutcome; onReset: () => void }) {
  const content: Record<RunOutcome, { icon: React.ReactNode; title: string; detail: string; tone: string }> = {
    completed: {
      icon: <CheckCircle2 className="h-5 w-5 text-[var(--rf-green)]" />,
      title: 'Check complete',
      detail: 'Your briefing has been updated with what North Star found.',
      tone: 'text-[var(--rf-green)]',
    },
    failed: {
      icon: <AlertTriangle className="h-5 w-5 text-[var(--rf-red)]" />,
      title: "Couldn't complete the check",
      detail: 'Your website may be unreachable right now. North Star will try again automatically.',
      tone: 'text-[var(--rf-red)]',
    },
    duplicate: {
      icon: <Copy className="h-5 w-5 text-[var(--rf-amber)]" />,
      title: 'A check is already running',
      detail: 'North Star started a check moments ago. Let that finish before starting another.',
      tone: 'text-[var(--rf-amber)]',
    },
    'insufficient-evidence': {
      icon: <HelpCircle className="h-5 w-5 text-[var(--rf-muted)]" />,
      title: 'Not enough evidence yet',
      detail: 'North Star reached your site but found too little to confidently update your briefing. It will try again next check.',
      tone: 'text-[var(--rf-muted)]',
    },
    'waiting-approval': {
      icon: <ClipboardCheck className="h-5 w-5 text-[var(--rf-amber)]" />,
      title: 'One update needs your approval',
      detail: 'North Star prepared a change based on this check. Review it above before it goes live.',
      tone: 'text-[var(--rf-amber)]',
    },
  }
  const c = content[outcome]
  return (
    <div className="mt-5 flex items-start justify-between gap-4 border-t border-[var(--rf-card-line)] pt-5" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        {c.icon}
        <div>
          <p className={`text-sm font-medium ${c.tone}`}>{c.title}</p>
          <p className="mt-0.5 max-w-sm text-xs text-[var(--rf-muted)]">{c.detail}</p>
        </div>
      </div>
      <button onClick={onReset} className="ns-touch shrink-0 text-xs font-medium text-[var(--rf-blue-bright)] hover:underline">
        Done
      </button>
    </div>
  )
}
