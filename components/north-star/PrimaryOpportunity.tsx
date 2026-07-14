'use client'

import { useId, useState } from 'react'
import {
  Sparkles,
  Eye,
  ListChecks,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  MapPin as PageIcon,
  History,
} from 'lucide-react'
import type { Opportunity } from '@/lib/north-star-preview-data'

type Section = 'why' | 'guide' | 'prepare' | null

export function PrimaryOpportunity({
  opportunity,
  stale,
}: {
  opportunity: Opportunity | null
  stale: boolean
}) {
  const [section, setSection] = useState<Section>(null)

  if (!opportunity) {
    return (
      <section aria-label="Today's most important opportunity" className="ns-panel ns-fade-in p-8 text-center sm:p-10">
        <Sparkles className="mx-auto h-6 w-6 text-[var(--rf-faint)]" aria-hidden="true" />
        <p className="mt-3 text-base font-medium text-white">Nothing new to review today.</p>
        <p className="mt-1.5 text-sm text-[var(--rf-muted)] max-w-md mx-auto">
          North Star checked your business and didn&apos;t find anything that needs your attention. We&apos;ll keep watching.
        </p>
      </section>
    )
  }

  return (
    <section
      id="primary-opportunity"
      aria-labelledby="opportunity-heading"
      className="ns-panel ns-fade-in overflow-hidden border-[var(--rf-card-line-strong)] shadow-[0_30px_80px_-40px_rgba(47,107,255,0.35)]"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && section) setSection(null)
      }}
    >
      <div className="p-6 sm:p-9">
        {stale && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--rf-card-line-strong)] bg-white/[0.02] px-3 py-1 text-[11px] text-[var(--rf-faint)]">
            <History className="h-3 w-3" /> Based on your last successful check — not confirmed today
          </div>
        )}
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1.5 h-4 w-4 shrink-0 text-[var(--rf-amber)]" aria-hidden="true" />
          <h2 id="opportunity-heading" className="ns-serif text-2xl font-semibold leading-[1.2] text-white sm:text-[28px]">
            {opportunity.headline}
          </h2>
        </div>
        <p className="mt-3 max-w-2xl pl-7 text-sm leading-relaxed text-[var(--rf-muted)] sm:text-base">
          {opportunity.businessReason}
        </p>

        {/* Affected pages */}
        <div className="mt-5 flex flex-wrap gap-2 pl-7">
          {opportunity.affectedPages.map((p) => (
            <a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ns-touch ns-lift inline-flex items-center gap-1.5 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.015] px-2.5 py-1.5 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-card-line-strong)] hover:text-white"
            >
              <PageIcon className="h-3 w-3 shrink-0" /> {p.label}
            </a>
          ))}
        </div>

        <p className="mt-4 pl-7 text-xs text-[var(--rf-faint)]">{opportunity.evidenceSource}</p>
      </div>

      {/* Three actions */}
      <div
        role="tablist"
        aria-label="What would you like to do about this opportunity?"
        className="grid grid-cols-1 gap-2.5 border-t border-[var(--rf-card-line)] p-4 sm:grid-cols-3 sm:gap-3 sm:p-5"
      >
        <OpportunityAction
          icon={Eye}
          label="Show me why"
          description="See the evidence"
          isOpen={section === 'why'}
          onClick={() => setSection(section === 'why' ? null : 'why')}
        />
        <OpportunityAction
          icon={ListChecks}
          label="Guide me through it"
          description="Step-by-step plan"
          isOpen={section === 'guide'}
          onClick={() => setSection(section === 'guide' ? null : 'guide')}
        />
        <OpportunityAction
          icon={FileText}
          label="Prepare it for me"
          description="Review what North Star can draft"
          isOpen={section === 'prepare'}
          onClick={() => setSection(section === 'prepare' ? null : 'prepare')}
        />
      </div>

      <ExpandPanel open={section === 'why'}>
        <WhyPanel opportunity={opportunity} />
      </ExpandPanel>
      <ExpandPanel open={section === 'guide'}>
        <GuidePanel opportunity={opportunity} />
      </ExpandPanel>
      <ExpandPanel open={section === 'prepare'}>
        <PreparePanel opportunity={opportunity} />
      </ExpandPanel>
    </section>
  )
}

function ExpandPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`ns-expand ${open ? 'ns-expand-open' : ''}`}>
      <div>
        <div className="border-t border-[var(--rf-card-line)] bg-white/[0.012] p-5 sm:p-8">{children}</div>
      </div>
    </div>
  )
}

function OpportunityAction({
  icon: Icon,
  label,
  description,
  isOpen,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  isOpen: boolean
  onClick: () => void
}) {
  const id = useId()
  return (
    <button
      id={`${id}-tab`}
      role="tab"
      aria-selected={isOpen}
      aria-controls={`${id}-panel`}
      onClick={onClick}
      className={`ns-touch ns-lift flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left ${
        isOpen
          ? 'border-[var(--rf-blue-bright)]/50 bg-[var(--rf-blue-bright)]/10'
          : 'border-[var(--rf-card-line)] bg-white/[0.012] hover:border-[var(--rf-card-line-strong)]'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 shrink-0 ${isOpen ? 'text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`} />
          <span className={`text-sm font-medium ${isOpen ? 'text-[var(--rf-blue-bright)]' : 'text-white'}`}>{label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--rf-faint)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </span>
      <span className="text-xs text-[var(--rf-faint)]">{description}</span>
    </button>
  )
}

function WhyPanel({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-white">What we verified</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">{opportunity.evidenceSummary}</p>
        <ul className="mt-4 space-y-3">
          {opportunity.evidence.map((e) => (
            <li key={e.label} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-green)]" />
              <span>
                <span className="font-medium text-white">{e.label}.</span>{' '}
                <span className="text-[var(--rf-muted)]">{e.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">What we cannot measure yet</h3>
        <ul className="mt-2 space-y-3">
          {opportunity.cannotMeasure.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <Circle className="mt-1 h-2 w-2 shrink-0 text-[var(--rf-faint)]" />
              {item}
            </li>
          ))}
        </ul>
        <h4 className="mt-5 text-sm font-semibold text-white">What would improve this recommendation</h4>
        <ul className="mt-2 space-y-2">
          {opportunity.additionalDataNeeded.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <Circle className="mt-1 h-2 w-2 shrink-0 text-[var(--rf-faint)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function GuidePanel({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">A simple plan — no technical background needed</h3>
      <ol className="mt-4 space-y-4">
        {opportunity.guideSteps.map((step, i) => (
          <li key={step.title} className="flex gap-3.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--rf-blue-bright)]/15 text-xs font-semibold text-[var(--rf-blue-bright)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--rf-muted)]">{step.description}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--rf-faint)]">
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {step.timeEstimate}</span>
                <span>Needs: {step.whatYouNeed}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PreparePanel({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">What North Star can prepare</h3>
      <p className="mt-2 text-sm text-[var(--rf-muted)]">
        North Star can draft the pieces below once your real business details are confirmed. Nothing is published or fabricated without your review.
      </p>
      <ul className="mt-4 space-y-3">
        {opportunity.prepareChecklist.map((item) => (
          <li key={item.label} className="ns-panel-quiet flex items-start gap-3 p-3.5">
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <StatusPill status={item.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--rf-muted)]">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--rf-faint)]">
        North Star never invents a business name, phone number, address, or hours. Anything published requires your explicit approval.
      </p>
    </div>
  )
}

function StatusIcon({ status }: { status: Opportunity['prepareChecklist'][number]['status'] }) {
  if (status === 'ready') return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
}

function StatusPill({ status }: { status: Opportunity['prepareChecklist'][number]['status'] }) {
  const label = status === 'ready' ? 'Ready' : status === 'needs-info' ? 'Needs your info' : 'Needs your approval'
  const cls = status === 'ready' ? 'ns-pill ns-pill-well' : status === 'needs-info' ? 'ns-pill ns-pill-partial' : 'ns-pill ns-pill-verify'
  return <span className={cls}>{label}</span>
}
