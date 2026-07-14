'use client'

import { useState } from 'react'
import { ClipboardCheck, Check, X } from 'lucide-react'
import type { PendingApproval } from '@/lib/north-star-preview-data'

export function ApprovalNeeded({ approval }: { approval: PendingApproval }) {
  const [state, setState] = useState<'pending' | 'approved' | 'dismissed'>('pending')

  if (state === 'dismissed') return null

  return (
    <section
      id="pending-approval"
      aria-label="Waiting for your approval"
      className="ns-panel ns-fade-in relative overflow-hidden border-[var(--rf-amber)]/25 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rf-amber)]/15">
          <ClipboardCheck className="h-4 w-4 text-[var(--rf-amber)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-amber)]">Waiting for your approval</p>
          <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">{approval.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">{approval.detail}</p>

          {state === 'pending' ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={() => setState('approved')}
                className="ns-touch ns-lift inline-flex items-center gap-2 rounded-xl bg-[var(--rf-amber)] px-4 py-2 text-sm font-semibold text-[#1a1200]"
              >
                <Check className="h-4 w-4" /> Approve &amp; publish
              </button>
              <button
                onClick={() => setState('dismissed')}
                className="ns-touch ns-lift rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                <X className="h-4 w-4" /> Not now
              </button>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--rf-green)]">
              <Check className="h-4 w-4" /> Approved. North Star prepared by {approval.preparedBy} — this will publish shortly.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
