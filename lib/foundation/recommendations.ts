// Recommendation builder — Phase C wires this to Recommendation Engine V2.
//
// V2 replaces the old rule-driven, prevalence-weighted builder with an
// evidence-driven, page-type-aware, business-aware engine (lib/foundation/
// reco/). buildRecommendationsFromScan keeps its signature for existing
// callers; generateRecommendationsFromScan additionally returns the engine's
// self-evaluation.

import type { Recommendation, Scan } from './types'
import { generateRecommendationsV2 } from './reco/engine'
import type { ProjectContext } from './reco/business'
import type { SelfEvaluation } from './reco/engine'

export function generateRecommendationsFromScan(
  scan: Scan,
  project?: ProjectContext
): { recommendations: Recommendation[]; selfEvaluation: SelfEvaluation } {
  const { recommendations, selfEvaluation } = generateRecommendationsV2(scan, project)
  return { recommendations, selfEvaluation }
}

// Back-compat wrapper (A8 signature). maxRecommendations caps the list after
// the engine's priority ranking, so the highest-priority items are kept.
export function buildRecommendationsFromScan(scan: Scan, maxRecommendations = 50): Recommendation[] {
  return generateRecommendationsV2(scan).recommendations.slice(0, maxRecommendations)
}

export type { SelfEvaluation }
