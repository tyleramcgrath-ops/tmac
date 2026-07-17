// Stable cross-scan recommendation identity (Phase D.6 P1).
//
// A recommendation's identity is its BUSINESS MEANING, not a random UUID. The
// same logical issue (this rule, on this logical target, in this project) gets
// the SAME issueId on every rescan, so the human's triage (accepted / rejected
// / verified / rolled_back), confidence history, evidence, and rule evolution
// survive re-crawls instead of being silently orphaned and reset.
//
// issueId format: `${ruleId}::${scope}` where scope is:
//   - 'site'            for site-wide, page-agnostic rules (one issue/project)
//   - the finding title for page-type-specific schema rules
//   - the shared value  for cross-page duplicate groups
// It is project-scoped by storage (unique per project), so it need not embed
// the projectId. Readable + deterministic + reproducible in a SQL backfill.

import type { Recommendation } from '../types'

export function makeIssueId(ruleId: string, scope: string): string {
  // Keep it bounded and stable; collapse whitespace so trivial text drift in a
  // title/shared-value doesn't fork identity.
  const s = (scope || 'site').trim().replace(/\s+/g, ' ').slice(0, 200)
  return `${ruleId}::${s}`
}

// Merge a freshly-generated recommendation onto the existing persisted one,
// PRESERVING identity + human triage + history and REFRESHING the analysed
// content. Status is never silently reset; history is carried forward (and a
// rule-version change is recorded so rule evolution is auditable).
export function mergeForUpsert(existing: Recommendation, incoming: Recommendation): Recommendation {
  const history = [...(existing.history ?? [])]
  if (existing.ruleVersion !== incoming.ruleVersion) {
    history.push({
      at: incoming.createdAt,
      by: 'system',
      from: existing.status,
      to: existing.status,
    })
  }
  return {
    ...incoming,
    // identity + triage preserved from the existing row
    id: existing.id,
    issueId: existing.issueId,
    status: existing.status,
    createdAt: existing.createdAt,
    history,
    // everything else on `incoming` (confidence, evidence, priority, title,
    // reasoning, ruleVersion, scanId, severity…) is the refreshed analysis.
  }
}
