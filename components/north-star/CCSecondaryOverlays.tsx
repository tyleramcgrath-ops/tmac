'use client'

import { CheckCircle2, Circle, AlertTriangle, Clock, Sparkles, ClipboardCheck, Check, HelpCircle } from 'lucide-react'
import type { ActivityItem, HistoryItem, HistoryOutcome, DigitalDnaArea } from '@/lib/north-star-preview-data'
import { CCOverlayShell } from './CCOverlay'

const PERSISTENCE_LABEL = { temporary: 'Temporary — this run only', persistent: 'Persistent — runs automatically', 'not-connected': 'Not connected' }

export function CCWorkInProgressOverlay({ activity, onClose }: { activity: ActivityItem[]; onClose: () => void }) {
  return (
    <CCOverlayShell title="Work in progress" eyebrow="What North Star is doing" onClose={onClose}>
      <ul className="space-y-3">
        {activity.map((item) => (
          <li key={item.id} className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.012] p-4">
            <div className="flex items-start gap-3">
              {item.status === 'needs-attention' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-red)]" />
              ) : item.status === 'finished' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
              ) : item.status === 'waiting-approval' ? (
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-amber)]" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{item.label}</p>
                {item.finding && <p className="mt-1 text-sm text-[var(--rf-muted)]">{item.finding}</p>}
                <p className="mt-2 text-xs text-[var(--rf-faint)]">{PERSISTENCE_LABEL[item.persistence]}</p>
                <p className="mt-1 text-xs text-[var(--rf-faint)]">{item.technicalDetail}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CCOverlayShell>
  )
}

const OUTCOME_META: Record<HistoryOutcome, { label: string; icon: typeof Sparkles; cls: string }> = {
  'no-change': { label: 'No material change', icon: CheckCircle2, cls: 'text-[var(--rf-green)]' },
  'opportunity-found': { label: 'Opportunity found', icon: Sparkles, cls: 'text-[var(--rf-amber)]' },
  'waiting-approval': { label: 'Waiting for approval', icon: ClipboardCheck, cls: 'text-[var(--rf-amber)]' },
  'action-completed': { label: 'Action completed', icon: Check, cls: 'text-[var(--rf-green)]' },
  'result-unknown': { label: 'Result not known yet', icon: HelpCircle, cls: 'text-[var(--rf-muted)]' },
  'check-incomplete': { label: 'Check incomplete', icon: AlertTriangle, cls: 'text-[var(--rf-red)]' },
}

export function CCResultsOverlay({ history, onClose }: { history: HistoryItem[]; onClose: () => void }) {
  return (
    <CCOverlayShell title="Results" eyebrow="Progress over time" onClose={onClose}>
      {history.length === 0 ? (
        <p className="text-sm text-[var(--rf-muted)]">No earlier checks yet — this is your first.</p>
      ) : (
        <ol className="space-y-0 border-t border-[var(--rf-card-line)]">
          {history.map((item) => {
            const meta = OUTCOME_META[item.outcome]
            const Icon = meta.icon
            return (
              <li key={item.id} className="flex items-start gap-3 border-b border-[var(--rf-card-line)] py-4">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-white">{item.date}</span>
                    <span className={`text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--rf-muted)]">{item.summary}</p>
                  {item.followUp && <p className="mt-1 text-xs text-[var(--rf-faint)]">{item.followUp}</p>}
                  {item.johnActed !== null && (
                    <p className="mt-1 text-xs text-[var(--rf-faint)]">{item.johnActed ? 'You acted on this.' : 'Not yet acted on.'}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </CCOverlayShell>
  )
}

const UNDERSTANDING_LABEL = {
  'well-understood': 'Well understood',
  'partially-understood': 'Partially understood',
  'needs-verification': 'Needs verification',
  'not-connected': 'Not connected',
}

export function CCSourcesOverlay({ areas, pagesChecked, onClose }: { areas: DigitalDnaArea[]; pagesChecked: number; onClose: () => void }) {
  return (
    <CCOverlayShell title="Sources" eyebrow="Where North Star's understanding comes from" onClose={onClose}>
      <p className="text-sm text-[var(--rf-muted)] mb-4">Your website check ({pagesChecked} page{pagesChecked === 1 ? '' : 's'}) is the only connected source right now. Connecting more sources — Google Business Profile, customer records, advertising accounts — will fill in the areas below marked not connected.</p>
      <ul className="space-y-3">
        {areas.map((a) => (
          <li key={a.key} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.012] p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{a.label}</p>
              <p className="mt-1 text-xs text-[var(--rf-muted)]">{a.note}</p>
            </div>
            <span className="text-xs text-[var(--rf-faint)] shrink-0">{UNDERSTANDING_LABEL[a.understanding]}</span>
          </li>
        ))}
      </ul>
    </CCOverlayShell>
  )
}

export function CCEmptyOverlay({ title, eyebrow, message, onClose }: { title: string; eyebrow: string; message: string; onClose: () => void }) {
  return (
    <CCOverlayShell title={title} eyebrow={eyebrow} onClose={onClose}>
      <div className="flex items-start gap-3">
        <Circle className="mt-1 h-3 w-3 text-[var(--rf-faint)]" />
        <p className="text-sm text-[var(--rf-muted)]">{message}</p>
      </div>
    </CCOverlayShell>
  )
}
