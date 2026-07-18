// Delta engine — diffs two dated snapshots into the concrete things that moved.
// Every delta is a real before/after with a date; nothing is invented.

import type { Delta, DeltaDirection, Snapshot } from './types'

const SCORE_LABELS: Record<string, string> = {
  overall: 'Overall score',
  content: 'Content score',
  technical: 'Technical score',
  schema: 'Schema score',
  authority: 'Authority score',
  speed: 'Page-speed score',
  intent: 'Intent-match score',
  aiReadiness: 'AI-readiness score',
}

// A move smaller than this is treated as noise and not surfaced.
const SCORE_NOISE = 2

function dir(change: number, invert = false): DeltaDirection {
  if (change === 0) return 'flat'
  const up = invert ? change < 0 : change > 0
  return up ? 'up' : 'down'
}

/**
 * Compare the previous snapshot for a page with the new one. When there is no
 * previous snapshot (first ever run) no deltas are produced — we don't invent a
 * baseline.
 */
export function computeSnapshotDeltas(prev: Snapshot | null, next: Snapshot): Delta[] {
  if (!prev) return []
  const out: Delta[] = []

  for (const key of Object.keys(next.scores)) {
    const after = next.scores[key]
    const before = prev.scores[key]
    if (before === undefined || after === undefined) continue
    const change = round(after - before)
    if (Math.abs(change) < SCORE_NOISE) continue
    out.push({
      kind: 'score',
      metric: key,
      label: SCORE_LABELS[key] ?? `${key} score`,
      url: next.url,
      before,
      after,
      change,
      direction: dir(change),
      good: change > 0,
      takenAt: next.takenAt,
    })
  }

  // SERP position (lower rank number is better).
  if (prev.serpPosition != null && next.serpPosition != null && prev.serpPosition !== next.serpPosition) {
    const change = next.serpPosition - prev.serpPosition
    out.push({
      kind: 'position',
      metric: 'serpPosition',
      label: 'Search position',
      url: next.url,
      before: prev.serpPosition,
      after: next.serpPosition,
      change,
      direction: dir(change, true),
      good: change < 0,
      takenAt: next.takenAt,
    })
  }

  // Outstanding critical issues (fewer is better).
  if (prev.criticalCount !== next.criticalCount) {
    const change = next.criticalCount - prev.criticalCount
    out.push({
      kind: 'critical',
      metric: 'critical',
      label: 'Critical issues',
      url: next.url,
      before: prev.criticalCount,
      after: next.criticalCount,
      change,
      direction: dir(change, true),
      good: change < 0,
      takenAt: next.takenAt,
    })
  }

  // Rank by absolute magnitude so the biggest movements surface first.
  return out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
