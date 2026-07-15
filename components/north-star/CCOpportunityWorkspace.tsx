'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, MapPin } from 'lucide-react'
import type { Opportunity } from '@/lib/north-star-preview-data'
import { CCOverlayShell } from './CCOverlay'

const PRIORITY_CLASS = {
  high: 'cc-priority-pill cc-priority-pill-high',
  medium: 'cc-priority-pill cc-priority-pill-medium',
  low: 'cc-priority-pill cc-priority-pill-low',
}

const DISMISS_REASONS = ['Not relevant to my business', 'Already handled elsewhere', 'Will revisit later', 'Disagree with the finding']

export function CCOpportunityWorkspace({ opportunity, stale, onClose }: { opportunity: Opportunity; stale: boolean; onClose: () => void }) {
  const [dismissing, setDismissing] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const canApprove = opportunity.prepareChecklist.every((i) => i.status === 'ready')

  if (dismissed) {
    return (
      <CCOverlayShell title="Dismissed" eyebrow="Opportunity" onClose={onClose}>
        <p className="text-sm text-[var(--rf-muted)]">
          Dismissed: <span className="text-white font-medium">{dismissed}</span>. North Star won&apos;t resurface this exact finding unless something changes.
        </p>
      </CCOverlayShell>
    )
  }

  return (
    <CCOverlayShell title={opportunity.headline} eyebrow="Opportunity command view" onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <span className={PRIORITY_CLASS[opportunity.priority]}>{opportunity.priority} priority</span>
        {stale && <span className="text-xs text-[var(--rf-faint)]">Based on your last successful check — not confirmed today</span>}
      </div>

      <div className="cc-field">
        <p className="cc-field-label">Why this could matter</p>
        <p className="cc-field-value">{opportunity.businessReason}</p>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">Affected business areas</p>
        <div className="flex flex-wrap gap-2">
          {opportunity.affectedAreas.map((a) => (
            <span key={a} className="text-xs rounded-full border border-[var(--rf-card-line)] px-2.5 py-1 text-[var(--rf-muted)]">{a}</span>
          ))}
        </div>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">Affected pages</p>
        <div className="flex flex-wrap gap-2">
          {opportunity.affectedPages.map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="ns-touch inline-flex items-center gap-1.5 rounded-lg border border-[var(--rf-card-line)] px-2.5 py-1.5 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-card-line-strong)] hover:text-white">
              <MapPin className="h-3 w-3" /> {p.label}
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--rf-faint)]">{opportunity.evidenceSource}</p>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">What North Star verified</p>
        <ul className="space-y-2.5">
          {opportunity.evidence.map((e) => (
            <li key={e.label} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-green)]" />
              <span><span className="font-medium text-white">{e.label}.</span> <span className="text-[var(--rf-muted)]">{e.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">What remains unknown</p>
        <ul className="space-y-2">
          {opportunity.cannotMeasure.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <Circle className="mt-1 h-2 w-2 shrink-0 text-[var(--rf-faint)]" /> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">Assumptions</p>
        <ul className="space-y-2">
          {opportunity.additionalDataNeeded.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <Circle className="mt-1 h-2 w-2 shrink-0 text-[var(--rf-faint)]" /> Would improve certainty: {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">What North Star can prepare</p>
        <ul className="space-y-3">
          {opportunity.prepareChecklist.map((item) => (
            <li key={item.label} className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.012] p-3.5 flex items-start gap-3">
              {item.status === 'ready' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-faint)]" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--rf-muted)]">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--rf-faint)]">North Star never invents a business name, phone number, address, or hours. Anything published requires your explicit approval.</p>
      </div>

      <div className="cc-field">
        <p className="cc-field-label">Recommended action</p>
        <ol className="space-y-3">
          {opportunity.guideSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--rf-blue-bright)]/15 text-xs font-semibold text-[var(--rf-blue-bright)]">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="mt-1 text-sm text-[var(--rf-muted)]">{step.description}</p>
                <div className="mt-1.5 flex gap-3 text-xs text-[var(--rf-faint)]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {step.timeEstimate}</span>
                  <span>Needs: {step.whatYouNeed}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {dismissing ? (
        <div className="cc-field">
          <p className="cc-field-label">Dismiss with reason</p>
          <div className="flex flex-wrap gap-2">
            {DISMISS_REASONS.map((r) => (
              <button key={r} onClick={() => setDismissed(r)} className="cc-btn-ghost ns-touch">{r}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-[var(--rf-card-line)] mt-6">
          <button className="cc-btn-primary ns-touch">Explain this</button>
          <button className="cc-btn-ghost ns-touch">Prepare the work</button>
          <button className="cc-btn-amber ns-touch" disabled={!canApprove} style={!canApprove ? { opacity: 0.4, cursor: 'default' } : undefined} title={!canApprove ? 'Confirm your business details first' : undefined}>
            Approve
          </button>
          <button onClick={onClose} className="cc-btn-ghost ns-touch">Not now</button>
          <button onClick={() => setDismissing(true)} className="cc-btn-ghost ns-touch">Dismiss with reason</button>
        </div>
      )}
    </CCOverlayShell>
  )
}
