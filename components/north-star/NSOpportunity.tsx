'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Opportunity } from '@/lib/north-star-preview-data'

export function NSOpportunity({
  opportunity,
  hasOpportunity,
}: {
  opportunity?: Opportunity
  hasOpportunity: boolean
}) {
  const [expandedSection, setExpandedSection] = useState<'evidence' | 'unknown' | 'recommendation' | null>(null)

  if (!hasOpportunity || !opportunity) {
    return (
      <section className="ns-opportunity-section border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-4">
            <p className="text-xl sm:text-2xl font-light text-white leading-relaxed">
              Everything is running as expected.
            </p>
            <p className="text-base text-[var(--rf-text-secondary)] font-light">
              No material changes since your last check. Your business is stable.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="ns-opportunity-section relative border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
      {/* Subtle highlight background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--rf-blue-bright)]/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative mx-auto max-w-2xl">
        {/* The reveal moment - quiet confidence */}
        <div className="mb-12 space-y-6 sm:mb-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--rf-blue-bright)] mb-3">
              What I found
            </p>
            <h2 className="text-3xl sm:text-4xl font-light leading-tight text-white">
              {opportunity.headline}
            </h2>
          </div>

          <p className="text-lg text-[var(--rf-text-secondary)] font-light leading-relaxed">
            {opportunity.businessReason}
          </p>
        </div>

        {/* Evidence section */}
        <div className="space-y-6 rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 backdrop-blur-sm p-6 sm:p-8">
          {/* Evidence header - always visible */}
          <button
            onClick={() => setExpandedSection(expandedSection === 'evidence' ? null : 'evidence')}
            className="w-full text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)] mb-2">
                  North Star verified
                </p>
                <p className="text-base font-medium text-white">{opportunity.evidenceSummary}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[var(--rf-blue-bright)] mt-1 flex-shrink-0 transition-transform duration-300 ${
                  expandedSection === 'evidence' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Evidence details */}
          {expandedSection === 'evidence' && (
            <div className="border-t border-[var(--rf-card-line)]/30 pt-6 space-y-4">
              {opportunity.evidence.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-sm text-[var(--rf-text-secondary)]">{item.detail}</p>
                </div>
              ))}
              <div className="text-xs text-[var(--rf-faint)] pt-4 border-t border-[var(--rf-card-line)]/20">
                Evidence source: {opportunity.evidenceSource}
              </div>
            </div>
          )}
        </div>

        {/* What remains unknown */}
        <div className="mt-6 rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 backdrop-blur-sm p-6 sm:p-8">
          <button
            onClick={() => setExpandedSection(expandedSection === 'unknown' ? null : 'unknown')}
            className="w-full text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)] mb-2">
                  What remains unknown
                </p>
                <p className="text-base font-medium text-white">{opportunity.cannotMeasure.length} factors we cannot measure yet</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[var(--rf-blue-bright)] mt-1 flex-shrink-0 transition-transform duration-300 ${
                  expandedSection === 'unknown' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedSection === 'unknown' && (
            <div className="border-t border-[var(--rf-card-line)]/30 pt-6 space-y-3">
              {opportunity.cannotMeasure.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 text-[var(--rf-blue-bright)] mt-1">
                    <div className="h-1.5 w-1.5 rounded-full" />
                  </div>
                  <p className="text-sm text-[var(--rf-text-secondary)]">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Three decision paths */}
        <div className="mt-12 sm:mt-16 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)]">What you can do</p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Path 1: Explain */}
            <button className="group relative rounded-lg border border-[var(--rf-card-line)]/50 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-white/10 hover:border-[var(--rf-blue-bright)]/50">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-2">
                <p className="font-semibold text-white text-sm">Explain it to me</p>
                <p className="text-xs text-[var(--rf-text-secondary)]">Why this matters and what it means</p>
              </div>
            </button>

            {/* Path 2: Help */}
            <button className="group relative rounded-lg border border-[var(--rf-card-line)]/50 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-white/10 hover:border-[var(--rf-blue-bright)]/50">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-2">
                <p className="font-semibold text-white text-sm">Help me do it</p>
                <p className="text-xs text-[var(--rf-text-secondary)]">A guided sequence to fix it</p>
              </div>
            </button>

            {/* Path 3: Prepare */}
            <button className="group relative rounded-lg border border-[var(--rf-card-line)]/50 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-white/10 hover:border-[var(--rf-blue-bright)]/50">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-2">
                <p className="font-semibold text-white text-sm">Prepare it for me</p>
                <p className="text-xs text-[var(--rf-text-secondary)]">Ready to review and approve</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ns-opportunity-section {
          animation: opportunity-slide-up 0.8s ease-out 0.3s both;
        }

        @keyframes opportunity-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
