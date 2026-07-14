import { CheckCircle2, Sparkles, ClipboardCheck, Check, HelpCircle, AlertTriangle } from 'lucide-react'
import type { HistoryItem, HistoryOutcome } from '@/lib/north-star-preview-data'

const OUTCOME_META: Record<HistoryOutcome, { label: string; icon: typeof Sparkles; tone: string }> = {
  'no-change': { label: 'No material change', icon: CheckCircle2, tone: 'text-[var(--rf-green)]' },
  'opportunity-found': { label: 'Opportunity found', icon: Sparkles, tone: 'text-[var(--rf-amber)]' },
  'waiting-approval': { label: 'Waiting for approval', icon: ClipboardCheck, tone: 'text-[var(--rf-amber)]' },
  'action-completed': { label: 'Action completed', icon: Check, tone: 'text-[var(--rf-green)]' },
  'result-unknown': { label: 'Result not known yet', icon: HelpCircle, tone: 'text-[var(--rf-muted)]' },
  'check-incomplete': { label: 'Check incomplete', icon: AlertTriangle, tone: 'text-[var(--rf-red)]' },
}

export function BriefingHistory({ items }: { items: HistoryItem[] }) {
  return (
    <section aria-labelledby="history-heading" className="ns-panel ns-fade-in p-5 sm:p-7">
      <h2 id="history-heading" className="text-lg font-semibold text-white">Morning briefing history</h2>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">What North Star has found on past checks.</p>

      <ol className="mt-4 space-y-0 border-t border-[var(--rf-card-line)]">
        {items.map((item) => {
          const meta = OUTCOME_META[item.outcome]
          const Icon = meta.icon
          return (
            <li key={item.id} className="flex items-start gap-3.5 border-b border-[var(--rf-card-line)] py-3.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-white">{item.date}</span>
                  <span className={`text-xs font-medium ${meta.tone}`}>{meta.label}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--rf-muted)]">{item.summary}</p>
                {item.followUp && <p className="mt-1 text-xs text-[var(--rf-faint)]">{item.followUp}</p>}
                {item.johnActed !== null && (
                  <p className="mt-1 text-xs text-[var(--rf-faint)]">
                    {item.johnActed ? 'You acted on this.' : 'Not yet acted on.'}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
