'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PendingApproval } from '@/lib/north-star-preview-data'
import { CCOverlayShell } from './CCOverlay'

export function CCApprovalCenter({ approval, onClose }: { approval: PendingApproval; onClose: () => void }) {
  const [state, setState] = useState<'pending' | 'approved' | 'declined'>('pending')

  return (
    <CCOverlayShell title={approval.title} eyebrow="Approval center" onClose={onClose}>
      <div className="cc-field">
        <p className="cc-field-label">What will change</p>
        <p className="cc-field-value">{approval.whatChanges}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">Why North Star recommends it</p>
        <p className="cc-field-value">{approval.whyRecommended}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">Required spend</p>
        <p className="cc-field-value">{approval.requiredSpend}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">Customer-facing impact</p>
        <p className="cc-field-value">{approval.customerImpact}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">Rollback plan</p>
        <p className="cc-field-value">{approval.rollbackPlan}</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">What happens after approval</p>
        <p className="cc-field-value">North Star publishes this change and confirms it on your next check.</p>
      </div>
      <div className="cc-field">
        <p className="cc-field-label">What will be measured</p>
        <p className="cc-field-value">{approval.whatWillBeMeasured}</p>
      </div>
      <p className="text-xs text-[var(--rf-faint)] mb-6">Prepared by {approval.preparedBy}. Nothing is published without your explicit approval.</p>

      {state === 'pending' && (
        <div className="flex flex-wrap gap-2.5 pt-4 border-t border-[var(--rf-card-line)]">
          <button onClick={() => setState('approved')} className="cc-btn-amber ns-touch">
            <Check className="h-4 w-4" /> Approve &amp; publish this exact change
          </button>
          <button onClick={() => setState('declined')} className="cc-btn-ghost ns-touch">
            <X className="h-4 w-4" /> Not now
          </button>
        </div>
      )}
      {state === 'approved' && (
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--rf-green)] pt-4 border-t border-[var(--rf-card-line)]">
          <Check className="h-4 w-4" /> Approved. This will publish and be confirmed on your next check.
        </p>
      )}
      {state === 'declined' && (
        <p className="text-sm text-[var(--rf-muted)] pt-4 border-t border-[var(--rf-card-line)]">
          Left as a draft. Nothing changed — you can come back to this anytime from Approvals.
        </p>
      )}
    </CCOverlayShell>
  )
}
