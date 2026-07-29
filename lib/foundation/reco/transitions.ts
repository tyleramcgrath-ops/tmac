// The real, enforced recommendation status state machine. Single source of
// truth — both the recommendations API route and the Command Engine
// (Milestone 3) import this rather than each declaring their own copy, so
// there is exactly one place that decides which transitions are legal.

import type { RecommendationStatus } from '../types'

// 'deployed'/'verified'/'rolled_back' are set by the WordPress execution flow
// (deploy-one and the wordpress route both assign them directly and never
// consult this table), and 'regressed' is detected from real rank/traffic
// data. Each is a claim about something that happened on a live site, so none
// is reachable from here — otherwise a user could PATCH a deployed
// recommendation to 'verified' and the UI would report a read-back that never
// occurred. They are terminal, in the direction that matters: nothing leads TO
// them, and only a rollback leads back out.
export const RECOMMENDATION_TRANSITIONS: Record<RecommendationStatus, RecommendationStatus[]> = {
  open: ['accepted', 'modified', 'rejected', 'dismissed'],
  accepted: ['open', 'modified', 'rejected', 'dismissed'],
  modified: ['accepted', 'open', 'rejected', 'dismissed'],
  rejected: ['open'],
  dismissed: ['open'],
  deployed: [],
  verified: [],
  // Reopening after a rollback is an ordinary triage move — 'open' claims
  // nothing about the site.
  rolled_back: ['open'],
  regressed: ['accepted', 'modified', 'rejected', 'dismissed'],
}

export function canTransition(from: RecommendationStatus, to: RecommendationStatus): boolean {
  return RECOMMENDATION_TRANSITIONS[from]?.includes(to) ?? false
}
