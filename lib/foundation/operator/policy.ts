// Approval Workflows + Automation Rules (Phase D §4). Decides whether a
// proposed fix can be auto-approved or must wait for a human. Conservative by
// default: nothing auto-approves unless a policy explicitly allows it AND the
// safety engine did not block it.

import type { SafetyAssessment } from './safety'
import type { GeneratedFix } from './fixgen'

export interface AutomationPolicy {
  // Auto-approve these fix kinds up to the given max risk (never 'blocked').
  autoApprove: {
    title?: 'low' | 'medium'
    metaDescription?: 'low' | 'medium'
    schema?: 'low'
  }
  // Fix kinds that always require explicit human approval even if low-risk.
  alwaysRequireApproval: string[]
  // Max pages a single auto-approved action may touch.
  maxAutoApprovePages: number
}

export const DEFAULT_POLICY: AutomationPolicy = {
  autoApprove: {}, // opt-in only — nothing auto-approves out of the box
  alwaysRequireApproval: ['robots-directive', 'canonical', 'redirect', 'sitemap', 'noindex'],
  maxAutoApprovePages: 5,
}

// Example policy a user might opt into (documented in AUTOMATION_RULES.md).
export const EXAMPLE_POLICY: AutomationPolicy = {
  autoApprove: { title: 'low', metaDescription: 'low' },
  alwaysRequireApproval: ['robots-directive', 'canonical', 'redirect', 'sitemap', 'noindex'],
  maxAutoApprovePages: 5,
}

export type ApprovalDecision =
  | { decision: 'auto-approved'; reason: string }
  | { decision: 'requires-approval'; reason: string }
  | { decision: 'blocked'; reason: string }

const RISK_RANK = { low: 1, medium: 2, high: 3, blocked: 4 }

export function evaluatePolicy(
  policy: AutomationPolicy,
  fix: GeneratedFix,
  safety: SafetyAssessment
): ApprovalDecision {
  if (safety.blocked) {
    return { decision: 'blocked', reason: safety.blockReason ?? 'Blocked by safety engine.' }
  }
  if (policy.alwaysRequireApproval.includes(fix.kind)) {
    return { decision: 'requires-approval', reason: `Policy always requires approval for ${fix.kind}.` }
  }
  if (safety.affectedPages > policy.maxAutoApprovePages) {
    return { decision: 'requires-approval', reason: `Touches ${safety.affectedPages} pages (> auto-approve cap ${policy.maxAutoApprovePages}).` }
  }
  const allowed = (policy.autoApprove as Record<string, 'low' | 'medium' | undefined>)[fix.kind]
  if (allowed && RISK_RANK[safety.risk] <= RISK_RANK[allowed]) {
    return { decision: 'auto-approved', reason: `Policy auto-approves ${fix.kind} at ${safety.risk} risk (≤ ${allowed}).` }
  }
  return { decision: 'requires-approval', reason: 'No auto-approve policy matches; human approval required.' }
}
