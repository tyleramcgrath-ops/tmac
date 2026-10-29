// Change Detection (Phase G §8). Compares two external snapshots and surfaces
// ONLY significant changes — competitor, content, schema, backlink, AI-citation,
// and ranking movement. When a prior snapshot or the new data is unavailable, no
// change is emitted (you cannot detect a change you cannot observe) — reported
// honestly rather than as a false "no change".

import type { Evidence } from './types'
import type { GscReport } from './providers/search-console'
import type { BacklinkProfile } from './providers/backlinks'
import type { AiVisibility } from './providers/ai-search'

export type ChangeCategory = 'competitor' | 'content' | 'schema' | 'backlink' | 'ai-citation' | 'ranking'

export interface Change {
  category: ChangeCategory
  subject: string
  before: number | string | null
  after: number | string | null
  delta: number
  significant: boolean
  evidence: Evidence
  note: string
}

export function numericChange(
  category: ChangeCategory,
  subject: string,
  before: number,
  after: number,
  threshold: number,
  evidence: Evidence,
): Change {
  const delta = Number((after - before).toFixed(3))
  return {
    category, subject, before, after, delta,
    significant: Math.abs(delta) >= threshold,
    evidence,
    note: `${subject}: ${before} → ${after} (${delta >= 0 ? '+' : ''}${delta})`,
  }
}

// Ranking movement from GSC: a query whose average position moved by >= N places.
export function detectRankingChanges(prev: GscReport | null, next: GscReport | null, minPositions = 3): Change[] {
  if (!prev || !next) return []
  const prevByQuery = new Map(prev.rows.map((r) => [r.query, r.position]))
  const out: Change[] = []
  for (const r of next.rows) {
    const before = prevByQuery.get(r.query)
    if (before === undefined) continue
    const c = numericChange('ranking', r.query, before, r.position, minPositions, { grade: 'observed', source: 'gsc', fetchedAt: next.range.to })
    if (c.significant) out.push(c)
  }
  return out
}

// Referring-domain movement from a backlink provider.
export function detectBacklinkChanges(prev: BacklinkProfile | null, next: BacklinkProfile | null, minDomains = 5, source = 'backlinks'): Change[] {
  if (!prev || !next) return []
  const c = numericChange('backlink', 'referring domains', prev.referringDomains, next.referringDomains, minDomains, { grade: 'observed', source, fetchedAt: null })
  return c.significant ? [c] : []
}

// AI-citation movement: did we gain or lose a citation on a tracked query.
export function detectAiCitationChanges(prev: AiVisibility[], next: AiVisibility[]): Change[] {
  const prevByKey = new Map(prev.map((v) => [`${v.engine}|${v.query}`, v.cited]))
  const out: Change[] = []
  for (const v of next) {
    const before = prevByKey.get(`${v.engine}|${v.query}`)
    if (before === undefined || before === v.cited) continue
    out.push({
      category: 'ai-citation', subject: `${v.engine}: "${v.query}"`,
      before: before ? 'cited' : 'not cited', after: v.cited ? 'cited' : 'not cited', delta: v.cited ? 1 : -1,
      significant: true,
      evidence: { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null },
      note: v.cited ? 'Newly cited by this AI engine.' : 'Lost citation on this AI engine.',
    })
  }
  return out
}

export function significantChanges(changes: Change[]): Change[] {
  return changes.filter((c) => c.significant)
}
