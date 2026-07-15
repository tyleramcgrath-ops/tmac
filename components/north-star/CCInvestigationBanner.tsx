'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import { buildInvestigationSteps, revealKindFor, type InvestigationStep, type RevealKind } from '@/lib/north-star-investigation'

type Phase = 'stepping' | 'settling' | 'done'

export function CCInvestigationBanner({
  scenario,
  outcome,
  onComplete,
}: {
  scenario: PreviewScenario
  outcome: RunOutcome
  onComplete: (kind: RevealKind) => void
}) {
  const steps = useRef<InvestigationStep[]>(buildInvestigationSteps(scenario, outcome)).current
  const [visibleCount, setVisibleCount] = useState(1)
  const [phase, setPhase] = useState<Phase>('stepping')

  useEffect(() => {
    if (phase !== 'stepping') return
    if (visibleCount >= steps.length) {
      const t = window.setTimeout(() => setPhase('settling'), 450)
      return () => window.clearTimeout(t)
    }
    const current = steps[visibleCount - 1]
    const t = window.setTimeout(() => setVisibleCount((n) => n + 1), current.durationMs)
    return () => window.clearTimeout(t)
  }, [visibleCount, phase, steps])

  useEffect(() => {
    if (phase !== 'settling') return
    const t = window.setTimeout(() => {
      setPhase('done')
      onComplete(revealKindFor(scenario, outcome))
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const currentStepText = steps[Math.min(visibleCount, steps.length) - 1]?.text ?? ''

  if (phase === 'done') return null

  return (
    <div className="cc-investigation-banner cc-fade-in" role="status" aria-live="polite">
      <span className="cc-pulse h-2 w-2 rounded-full bg-[var(--rf-blue-bright)]" aria-hidden="true" />
      <span>{currentStepText}</span>
      <span className="sr-only">
        {steps.slice(0, visibleCount - 1).map((s) => s.text).join('. ')}
      </span>
      <span className="ml-auto flex items-center gap-1 text-xs text-[var(--rf-faint)]" aria-hidden="true">
        {visibleCount - 1}/{steps.length} <Check className="h-3 w-3" />
      </span>
    </div>
  )
}
