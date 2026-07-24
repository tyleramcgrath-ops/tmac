// The real, enforced recommendation status state machine. Single source of
// truth — both the recommendations API route and the Command Engine
// (Milestone 3) import this rather than each declaring their own copy, so
// there is exactly one place that decides which transitions are legal.

import type { RecommendationStatus } from '../types'

// 'deployed'/'verified'/'rolled_back' are set by the WordPress execution
// flow, not by a direct user-driven status write, so they are terminal here.
export const RECOMMENDATION_TRANSITIONS: Record<RecommendationStatus, RecommendationStatus[]> = {
  open: ['accepted', 'modified', 'rejected', 'dismissed'],
  accepted: ['open', 'modified', 'rejected', 'dismissed'],
  modified: ['accepted', 'open', 'rejected', 'dismissed'],
  rejected: ['open'],
  dismissed: ['open'],
  deployed: ['verified', 'rolled_back'],
  verified: ['rolled_back'],
  rolled_back: ['open'],
  regressed: ['accepted', 'modified', 'rejected', 'dismissed'],
}

export function canTransition(from: RecommendationStatus, to: RecommendationStatus): boolean {
  return RECOMMENDATION_TRANSITIONS[from]?.includes(to) ?? false
}
