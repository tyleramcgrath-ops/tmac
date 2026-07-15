'use client'

import { CheckCircle2 } from 'lucide-react'
import type { PendingApproval } from '@/lib/north-star-preview-data'

export function NSApproval({ approval }: { approval: PendingApproval }) {
  return (
    <section className="ns-approval-section border-t border-[var(--rf-card-line)]/30 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[var(--rf-blue-bright)]/30 bg-[var(--rf-blue-bright)]/5 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--rf-blue-bright)]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)] mb-1">
                  Waiting for your approval
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-white">{approval.title}</h3>
              </div>
              <p className="text-sm text-[var(--rf-text-secondary)] leading-relaxed">{approval.detail}</p>
              <div className="flex gap-3 pt-4">
                <button className="rounded-lg bg-[var(--rf-blue-bright)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--rf-blue-bright)]/90">
                  Approve
                </button>
                <button className="rounded-lg border border-[var(--rf-card-line)] px-4 py-2 text-sm font-medium text-[var(--rf-text-secondary)] transition-all hover:bg-white/5">
                  Review details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ns-approval-section {
          animation: approval-fade-in 0.8s ease-out 0.5s both;
        }

        @keyframes approval-fade-in {
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
