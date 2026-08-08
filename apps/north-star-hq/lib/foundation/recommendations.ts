// Recommendation builder — Phase C wires this to Recommendation Engine V2.
//
// V2 replaces the old rule-driven, prevalence-weighted builder with an
// evidence-driven, page-type-aware, business-aware engine (lib/foundation/
// reco/). buildRecommendationsFromScan keeps its signature for existing
// callers; generateRecommendationsFromScan additionally returns the engine's
// self-evaluation.

import type { Recommendation, Scan } from './types'
import { generateRecommendationsV2 } from './reco/engine'
import { mergeForUpsert } from './reco/identity'
import type { ProjectContext } from './reco/business'
import type { SelfEvaluation } from './reco/engine'
import type { FoundationStore } from './store'

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

// Persist a scan's recommendations with STABLE identity (Phase D.6 P1): match
// each freshly-generated recommendation to any existing one by issueId and
// UPSERT — refreshing analysis while preserving the human's triage, status,
// and history. Re-scanning never orphans prior decisions or resets status.
// Implemented over the existing store methods so both store impls behave
// identically (no dual-write drift).
export async function persistScanRecommendations(
  store: Pick<FoundationStore, 'listRecommendations' | 'createRecommendations' | 'updateRecommendation'>,
  projectId: string,
  incoming: Recommendation[]
): Promise<{ created: number; updated: number; regressed: Recommendation[]; createdRecs: Recommendation[] }> {
  const existing = await store.listRecommendations(projectId)
  const byIssue = new Map<string, Recommendation>()
  for (const r of existing) if (r.issueId) byIssue.set(r.issueId, r)

  const seen = new Set<string>()
  const toCreate: Recommendation[] = []
  const regressed: Recommendation[] = []
  let updated = 0
  for (const rec of incoming) {
    if (seen.has(rec.issueId)) continue // guard: unique per scan
    seen.add(rec.issueId)
    const prev = byIssue.get(rec.issueId)
    if (prev) {
      const merged = mergeForUpsert(prev, rec)
      await store.updateRecommendation(merged)
      // A fresh transition into 'regressed' this call — not one already
      // sitting regressed from a prior scan (never re-alert on the same one).
      if (merged.status === 'regressed' && prev.status !== 'regressed') regressed.push(merged)
      updated++
    } else {
      toCreate.push(rec)
    }
  }
  if (toCreate.length) await store.createRecommendations(toCreate)
  return { created: toCreate.length, updated, regressed, createdRecs: toCreate }
}

export type { SelfEvaluation }
