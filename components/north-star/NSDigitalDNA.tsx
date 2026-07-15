'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DigitalDnaArea } from '@/lib/north-star-preview-data'

const understandingColors = {
  'well-understood': 'bg-[var(--rf-green)]/20 border-[var(--rf-green)]/40 text-[var(--rf-green)]',
  'partially-understood': 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  'needs-verification': 'bg-[var(--rf-blue-bright)]/20 border-[var(--rf-blue-bright)]/40 text-[var(--rf-blue-bright)]',
  'not-connected': 'bg-[var(--rf-card-line)]/10 border-[var(--rf-card-line)]/30 text-[var(--rf-faint)]',
}

const understandingLabels = {
  'well-understood': 'Well understood',
  'partially-understood': 'Partially understood',
  'needs-verification': 'Needs verification',
  'not-connected': 'Not connected',
}

export function NSDigitalDNA({
  dnaAreas,
  pagesChecked,
}: {
  dnaAreas: DigitalDnaArea[]
  pagesChecked: number
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const understoodCount = dnaAreas.filter((a) => a.understanding === 'well-understood').length
  const totalAreas = dnaAreas.length

  return (
    <section className="ns-dna-section border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              North Star's Understanding
            </h2>
            <p className="text-base text-[var(--rf-text-secondary)] font-light">
              {understoodCount} of {totalAreas} business areas understood. North Star grows smarter with each check.
            </p>
          </div>
        </div>

        {/* Understanding progression visual */}
        <div className="mb-12 sm:mb-16 grid grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: totalAreas }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx < understoodCount ? 'bg-[var(--rf-green)]' : 'bg-[var(--rf-card-line)]/20'
              }`}
            />
          ))}
        </div>

        {/* DNA Areas grid */}
        <div className="space-y-3">
          {dnaAreas.map((area) => (
            <button
              key={area.key}
              onClick={() => setExpandedId(expandedId === area.key ? null : area.key)}
              className="w-full text-left group"
            >
              <div className={`rounded-lg border transition-all duration-300 p-4 sm:p-5 hover:border-[var(--rf-blue-bright)]/50 ${understandingColors[area.understanding]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-sm text-white">{area.label}</p>
                    <p className="text-xs text-current/60">{understandingLabels[area.understanding]}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-semibold text-current/80">{area.evidenceCount}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        expandedId === area.key ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedId === area.key && (
                  <div className="mt-4 pt-4 border-t border-current/20 text-xs leading-relaxed text-current/70">
                    {area.note}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* How it grows */}
        <div className="mt-12 sm:mt-16 rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 backdrop-blur-sm p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-white mb-4">How this grows</h3>
          <div className="space-y-3 text-sm text-[var(--rf-text-secondary)]">
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-[var(--rf-green)] mt-1">
                <div className="h-1.5 w-1.5 rounded-full" />
              </div>
              <p>Each check adds new evidence to what's known</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-[var(--rf-green)] mt-1">
                <div className="h-1.5 w-1.5 rounded-full" />
              </div>
              <p>Connected sources fill gaps automatically</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-[var(--rf-green)] mt-1">
                <div className="h-1.5 w-1.5 rounded-full" />
              </div>
              <p>Your feedback shapes understanding</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ns-dna-section {
          animation: dna-fade-in 0.8s ease-out 0.7s both;
        }

        @keyframes dna-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  )
}
