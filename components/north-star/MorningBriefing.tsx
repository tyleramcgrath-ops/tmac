import { CheckCircle2, Sparkles, AlertTriangle, RadioTower, Compass } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'
import { RunNow } from './RunNow'

export function MorningBriefing({ scenario }: { scenario: PreviewScenario }) {
  const { id, briefing, lastCheckedAt, business } = scenario

  const tone: { icon: typeof Sparkles; iconColor: string } =
    id === 'opportunity-found' || id === 'waiting-approval'
      ? { icon: Sparkles, iconColor: 'text-[var(--rf-amber)]' }
      : id === 'check-failed'
        ? { icon: AlertTriangle, iconColor: 'text-[var(--rf-red)]' }
        : id === 'automation-not-connected'
          ? { icon: RadioTower, iconColor: 'text-[var(--rf-faint)]' }
          : { icon: CheckCircle2, iconColor: 'text-[var(--rf-green)]' }

  const Icon = tone.icon

  return (
    <header className="ns-fade-in">
      <div className="flex items-center gap-2 text-[13px] text-[var(--rf-faint)]">
        <Compass className="h-3.5 w-3.5" />
        <span>{business.name}</span>
        <span aria-hidden="true">·</span>
        <span>{lastCheckedAt ?? 'Not checked yet'}</span>
      </div>

      <h1 className="ns-serif mt-3 text-[30px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[40px]">
        {briefing.headline}
      </h1>

      <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--rf-muted)] sm:text-lg">
        {briefing.subline}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${tone.iconColor}`} aria-hidden="true" />
          <span className="text-[var(--rf-muted)]">
            {statusLabel(scenario)}
          </span>
        </span>
        <span className="flex items-center gap-2 text-[var(--rf-faint)]">
          <span className={`ns-dot ${briefing.automationConnected ? 'ns-dot-good' : 'ns-dot-neutral'}`} aria-hidden="true" />
          {briefing.automationConnected ? 'Daily checks are on' : 'Daily checks are off'}
        </span>
      </div>

      <div className="mt-7 border-t border-[var(--rf-card-line)] pt-6">
        <RunNow scenario={scenario} />
      </div>
    </header>
  )
}

function statusLabel(scenario: PreviewScenario): string {
  switch (scenario.id) {
    case 'opportunity-found':
      return 'One opportunity is ready to review'
    case 'no-changes':
      return 'No action needed today'
    case 'waiting-approval':
      return 'One item is waiting for your approval'
    case 'check-failed':
      return "This morning's check needs attention"
    case 'automation-not-connected':
      return 'Showing your most recent check'
    case 'first-visit':
      return 'Building your first picture of the business'
  }
}
