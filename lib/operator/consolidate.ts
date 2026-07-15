import type { Candidate } from './types'

/**
 * Consolidation layer.
 *
 * Multiple RankForge systems (graph, decision engine, gap analysis, GSC,
 * competitor engine…) can each surface the same underlying problem. This
 * module collapses them into a single consolidated candidate per canonical
 * (project, category, actionType, primaryPage) key while preserving every
 * contributing source record as evidence.
 *
 * The output is safe to persist as an `OperatorCandidate` row.
 */

export interface ConsolidatedCandidate extends Candidate {
  dedupeKey: string
  consolidatedFrom: string[]
  supersedesId: string | null
  conflictsWith: string[]
}

export interface ConflictNote {
  candidateA: string
  candidateB: string
  reason: string
}

export interface ConsolidationResult {
  consolidated: ConsolidatedCandidate[]
  conflicts: ConflictNote[]
  /// Duplicate ids that were merged into a survivor.
  duplicates: Array<{ mergedInto: string; ids: string[] }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Action type canonicalisation. Two different source systems can emit
// synonymous action types (e.g. "add_faq_schema" vs "faq_schema_missing").
// We map them all to a single canonical verb so dedupe can see them as the
// same underlying problem.
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_ACTION: Record<string, string> = {
  faq_schema_missing: 'add_faq_schema',
  add_faq_schema: 'add_faq_schema',
  faqpage_missing: 'add_faq_schema',
  expand_content: 'refresh_content',
  refresh_content: 'refresh_content',
  content_refresh: 'refresh_content',
  add_missing_entities: 'add_missing_entities',
  entity_gap: 'add_missing_entities',
  add_internal_links: 'add_internal_links',
  fix_orphan: 'add_internal_links',
  money_page_reinforcement: 'money_page_reinforcement',
  strengthen_money_page: 'money_page_reinforcement',
  repair_topic_cluster: 'repair_topic_cluster',
  cluster_broken: 'repair_topic_cluster',
  fix_homepage_typo: 'fix_homepage_typo',
  page_migration: 'page_migration',
  redirect_and_merge: 'redirect_and_merge',
  full_content_rewrite: 'full_content_rewrite',
}

export function canonicalizeActionType(actionType: string): string {
  const norm = actionType.replace(/^close_gap::/, '').toLowerCase()
  return CANONICAL_ACTION[norm] ?? norm
}

export function computeDedupeKey(
  projectId: string,
  category: string,
  actionType: string,
  pageUrl: string,
): string {
  const url = (() => {
    try {
      const u = new URL(pageUrl)
      // Ignore trailing slash + query for grouping so `/foo` and `/foo/?utm=x`
      // consolidate.
      return `${u.origin}${u.pathname.replace(/\/$/, '')}`
    } catch {
      return pageUrl.trim().toLowerCase().replace(/\/$/, '')
    }
  })()
  return `${projectId}::${category}::${canonicalizeActionType(actionType)}::${url}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Conflicting action pairs — same page, incompatible outcomes.
// ─────────────────────────────────────────────────────────────────────────────

const CONFLICT_PAIRS: Array<[string, string, string]> = [
  ['refresh_content', 'redirect_and_merge', 'Expand vs. redirect/merge'],
  ['refresh_content', 'page_migration', 'Expand vs. migrate URL'],
  ['add_internal_links', 'noindex', 'Building links to a page recommended for noindex'],
  ['index_page', 'noindex', 'Index vs. noindex the same page'],
  ['full_content_rewrite', 'redirect_and_merge', 'Rewrite vs. redirect'],
]

function conflictReason(a: string, b: string): string | null {
  for (const [x, y, reason] of CONFLICT_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) return reason
  }
  return null
}

/**
 * Consolidates raw candidates by dedupe key. Keeps the strongest candidate
 * as survivor, appends evidence from the others, and detects conflicts.
 */
export function consolidate(
  projectId: string,
  raw: Candidate[],
): ConsolidationResult {
  const buckets = new Map<string, Candidate[]>()
  for (const c of raw) {
    const key = computeDedupeKey(projectId, categoryOf(c), c.recommendationType, c.pageUrl)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(c)
  }

  const consolidated: ConsolidatedCandidate[] = []
  const duplicates: ConsolidationResult['duplicates'] = []

  for (const [key, group] of buckets.entries()) {
    group.sort((a, b) => b.rawScore - a.rawScore)
    const survivor = group[0]
    const others = group.slice(1)

    // Merge evidence + metadata + boost score based on multi-source support.
    const mergedEvidence = [
      ...survivor.evidence,
      ...others.flatMap((c) => c.evidence),
    ]
    const mergedMetadata: Record<string, unknown> = { ...survivor.metadata }
    for (const c of others) {
      for (const [k, v] of Object.entries(c.metadata as Record<string, unknown>)) {
        if (mergedMetadata[k] === undefined) mergedMetadata[k] = v
      }
    }
    const multiSourceBoost = Math.min(others.length * 4, 15)

    consolidated.push({
      ...survivor,
      rawScore: survivor.rawScore + multiSourceBoost,
      evidence: mergedEvidence,
      metadata: {
        ...mergedMetadata,
        sourcesConsolidated: [survivor.source, ...others.map((c) => c.source)],
        consolidationCount: group.length,
      },
      dedupeKey: key,
      consolidatedFrom: others.map((c) => c.id),
      supersedesId: null,
      conflictsWith: [],
    })
    if (others.length > 0) {
      duplicates.push({ mergedInto: survivor.id, ids: others.map((c) => c.id) })
    }
  }

  // Detect conflicts between different consolidated candidates on the same page.
  const conflicts: ConflictNote[] = []
  const byPage = new Map<string, ConsolidatedCandidate[]>()
  for (const c of consolidated) {
    if (!byPage.has(c.pageUrl)) byPage.set(c.pageUrl, [])
    byPage.get(c.pageUrl)!.push(c)
  }
  for (const [, list] of byPage.entries()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = canonicalizeActionType(list[i].recommendationType)
        const b = canonicalizeActionType(list[j].recommendationType)
        const reason = conflictReason(a, b)
        if (reason) {
          conflicts.push({ candidateA: list[i].id, candidateB: list[j].id, reason })
          list[i].conflictsWith.push(list[j].id)
          list[j].conflictsWith.push(list[i].id)
        }
      }
    }
  }

  return { consolidated, conflicts, duplicates }
}

function categoryOf(c: Candidate): string {
  const rt = c.recommendationType
  if (rt === 'money_page_reinforcement') return 'money_page'
  if (rt.includes('faq_schema') || rt.includes('schema')) return 'schema'
  if (rt.includes('entity')) return 'authority'
  if (rt.includes('cluster')) return 'authority'
  if (rt.startsWith('link_to') || rt.includes('internal_links')) return 'internal_link'
  if (rt.startsWith('decay::')) return 'decay'
  if (rt.startsWith('close_gap::')) return 'content_gap'
  return 'technical'
}
