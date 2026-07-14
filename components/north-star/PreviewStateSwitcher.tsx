'use client'

import { PREVIEW_SCENARIOS, type PreviewScenarioId } from '@/lib/north-star-preview-data'

const ORDER: PreviewScenarioId[] = [
  'opportunity-found',
  'no-changes',
  'waiting-approval',
  'check-failed',
  'automation-not-connected',
  'first-visit',
]

export function PreviewStateSwitcher({
  active,
  onChange,
}: {
  active: PreviewScenarioId
  onChange: (id: PreviewScenarioId) => void
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
        <span className="ns-preview-badge">Preview data</span>
        <span className="mr-1 text-xs text-[var(--rf-faint)]">Not connected to production. Switch states:</span>
        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((id) => {
            const s = PREVIEW_SCENARIOS[id]
            const isActive = id === active
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                aria-pressed={isActive}
                title={s.switcherHint}
                className={`ns-touch rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border-[var(--rf-blue-bright)]/60 bg-[var(--rf-blue-bright)]/15 text-[var(--rf-blue-bright)]'
                    : 'border-[var(--rf-card-line)] text-[var(--rf-muted)] hover:border-[var(--rf-card-line-strong)] hover:text-white'
                }`}
              >
                {s.switcherLabel}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
