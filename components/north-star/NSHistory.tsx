'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import type { HistoryItem } from '@/lib/north-star-preview-data'

const outcomeIcons = {
  'no-change': HelpCircle,
  'opportunity-found': AlertCircle,
  'waiting-approval': CheckCircle2,
  'action-completed': CheckCircle2,
  'result-unknown': HelpCircle,
  'check-incomplete': AlertCircle,
}

const outcomeLabels = {
  'no-change': 'No changes',
  'opportunity-found': 'Opportunity found',
  'waiting-approval': 'Awaiting approval',
  'action-completed': 'Completed',
  'result-unknown': 'Result unknown',
  'check-incomplete': 'Incomplete',
}

export function NSHistory({
  items,
  automationNote,
}: {
  items: HistoryItem[]
  automationNote: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!items.length) {
    return null
  }

  return (
    <section className="ns-history-section border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl">
        {/* Collapsible history header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left group mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-light text-white">
                Earlier checks
              </h2>
              <p className="text-sm text-[var(--rf-faint)] mt-2">
                {items.length} previous check{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-[var(--rf-blue-bright)] transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* History items */}
        {isOpen && (
          <div className="space-y-3">
            {items.map((item) => {
              const IconComponent = outcomeIcons[item.outcome]
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 backdrop-blur-sm p-4 sm:p-5 hover:border-[var(--rf-blue-bright)]/30 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <IconComponent className="h-4 w-4 text-[var(--rf-blue-bright)]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium text-white text-sm">{item.summary}</p>
                        <span className="text-xs text-[var(--rf-faint)] whitespace-nowrap">{item.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--rf-faint)]">{outcomeLabels[item.outcome]}</span>
                        {item.johnActed !== null && (
                          <span className="text-xs text-[var(--rf-blue-bright)]">
                            {item.johnActed ? 'Action taken' : 'Action not taken'}
                          </span>
                        )}
                      </div>
                      {item.followUp && (
                        <p className="text-xs text-[var(--rf-text-secondary)] mt-2">{item.followUp}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-[var(--rf-card-line)]/30">
          <p className="text-xs text-[var(--rf-faint)]">{automationNote}</p>
        </div>
      </div>

      <style>{`
        .ns-history-section {
          animation: history-fade-in 0.8s ease-out 1.3s both;
        }

        @keyframes history-fade-in {
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
