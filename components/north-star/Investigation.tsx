'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Sparkles, AlertTriangle, Copy, HelpCircle, ClipboardCheck, CheckCircle2 } from 'lucide-react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import { buildInvestigationSteps, revealKindFor, type InvestigationStep } from '@/lib/north-star-investigation'

function scrollToAndHighlight(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  el.classList.remove('ns-highlight-once')
  void el.offsetWidth // force reflow so the animation can retrigger
  el.classList.add('ns-highlight-once')
}

type Phase = 'stepping' | 'settling' | 'revealed'

export function Investigation({
  scenario,
  outcome,
  onDone,
}: {
  scenario: PreviewScenario
  outcome: RunOutcome
  onDone: () => void
}) {
  const steps = useRef<InvestigationStep[]>(buildInvestigationSteps(scenario, outcome)).current
  const [visibleCount, setVisibleCount] = useState(1)
  const [phase, setPhase] = useState<Phase>('stepping')

  useEffect(() => {
    if (phase !== 'stepping') return
    if (visibleCount >= steps.length) {
      const t = window.setTimeout(() => setPhase('settling'), 500)
      return () => window.clearTimeout(t)
    }
    const current = steps[visibleCount - 1]
    const t = window.setTimeout(() => setVisibleCount((n) => n + 1), current.durationMs)
    return () => window.clearTimeout(t)
  }, [visibleCount, phase, steps])

  useEffect(() => {
    if (phase !== 'settling') return
    const t = window.setTimeout(() => setPhase('revealed'), 350)
    return () => window.clearTimeout(t)
  }, [phase])

  const currentStepText = steps[Math.min(visibleCount, steps.length) - 1]?.text ?? ''

  return (
    <div className="mt-4">
      {/* Screen readers get the current step and, once ready, the reveal — not a rapid-fire transcript of every line. */}
      <p className="sr-only" role="status" aria-live="polite">
        {phase === 'stepping' ? currentStepText : ''}
      </p>

      {phase !== 'revealed' && (
        <ul className="space-y-2.5" aria-hidden="true">
          {steps.slice(0, visibleCount).map((step, i) => {
            const isActive = phase === 'stepping' && i === visibleCount - 1
            return (
              <li key={step.id} className="ns-step-row">
                <span className="ns-step-marker">
                  {isActive ? (
                    <span className="ns-step-active-ring" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-[var(--rf-faint)]" />
                  )}
                </span>
                <span className={`text-sm leading-snug ${isActive ? 'text-white' : 'text-[var(--rf-muted)]'}`}>
                  {step.text}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {phase === 'revealed' && <Reveal scenario={scenario} outcome={outcome} onDone={onDone} />}
    </div>
  )
}

function Reveal({ scenario, outcome, onDone }: { scenario: PreviewScenario; outcome: RunOutcome; onDone: () => void }) {
  const kind = revealKindFor(scenario, outcome)

  const body = (() => {
    switch (kind) {
      case 'opportunity': {
        const opp = scenario.opportunity!
        return (
          <>
            <RevealHeader icon={<Sparkles className="h-4 w-4 text-[var(--rf-amber)]" />} eyebrow="One opportunity, worth your attention" />
            <h3 className="ns-serif mt-1.5 text-lg font-semibold leading-snug text-white">{opp.headline}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">{opp.businessReason}</p>
            <dl className="mt-3 space-y-1 text-xs text-[var(--rf-faint)]">
              <div><dt className="inline font-medium text-[var(--rf-muted)]">Why I believe it: </dt><dd className="inline">{opp.evidence.length} piece{opp.evidence.length === 1 ? '' : 's'} of evidence from this check, across {opp.affectedPages.length} page{opp.affectedPages.length === 1 ? '' : 's'}.</dd></div>
              <div><dt className="inline font-medium text-[var(--rf-muted)]">What I still don&apos;t know: </dt><dd className="inline">{opp.cannotMeasure.length} thing{opp.cannotMeasure.length === 1 ? '' : 's'} I can&apos;t measure yet — see below.</dd></div>
            </dl>
            <button onClick={() => scrollToAndHighlight('primary-opportunity')} className="ns-touch ns-quiet-link mt-3 inline-block text-sm font-medium">
              Review it in full below ↓
            </button>
          </>
        )
      }
      case 'approval': {
        const approval = scenario.pendingApproval!
        return (
          <>
            <RevealHeader icon={<ClipboardCheck className="h-4 w-4 text-[var(--rf-amber)]" />} eyebrow="Something worth fixing" />
            <h3 className="ns-serif mt-1.5 text-lg font-semibold leading-snug text-white">{approval.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              I prepared a fix, but nothing changes until you say so.
            </p>
            <button onClick={() => scrollToAndHighlight('pending-approval')} className="ns-touch ns-quiet-link mt-3 inline-block text-sm font-medium">
              Review it below ↓
            </button>
          </>
        )
      }
      case 'quiet':
        return (
          <>
            <RevealHeader icon={<CheckCircle2 className="h-4 w-4 text-[var(--rf-green)]" />} eyebrow="Nothing rose to the level of your attention" />
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              I checked {scenario.pagesChecked} page{scenario.pagesChecked === 1 ? '' : 's'} and compared them against what I already knew. Everything continues to work the way you left it.
              {scenario.briefing.automationConnected ? " I'll keep watching automatically." : ''}
            </p>
          </>
        )
      case 'failed':
        return (
          <>
            <RevealHeader icon={<AlertTriangle className="h-4 w-4 text-[var(--rf-red)]" />} eyebrow="Couldn't complete this check" />
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              {`${scenario.business.domain} didn't respond. This can happen if your site is briefly down or blocking automated visits. I'll try again automatically — you can also try again now.`}
            </p>
          </>
        )
      case 'duplicate':
        return (
          <>
            <RevealHeader icon={<Copy className="h-4 w-4 text-[var(--rf-amber)]" />} eyebrow="Already in progress" />
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              A check started moments ago. Let that finish before starting another — I don&apos;t want to give you two half-finished answers.
            </p>
          </>
        )
      case 'insufficient':
        return (
          <>
            <RevealHeader icon={<HelpCircle className="h-4 w-4 text-[var(--rf-muted)]" />} eyebrow="Not enough evidence yet" />
            <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
              I reached your site but didn&apos;t gather enough before the connection dropped. Rather than guess, I&apos;ll try again on your next check.
            </p>
          </>
        )
    }
  })()

  return (
    <div className="ns-reveal-in">
      {body}
      <div className="mt-4 border-t border-[var(--rf-card-line)] pt-3">
        <button onClick={onDone} className="ns-touch ns-quiet-link text-xs font-medium">
          Done
        </button>
      </div>
    </div>
  )
}

function RevealHeader({ icon, eyebrow }: { icon: React.ReactNode; eyebrow: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-faint)]">{eyebrow}</p>
    </div>
  )
}
