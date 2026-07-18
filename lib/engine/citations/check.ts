// Runs a citation check across engines × queries and records a dated snapshot.
// Aggregates are computed over *available* results only, so an unconfigured
// engine lowers coverage honestly instead of inflating or faking a score.

import { probe } from './providers'
import { latestCitationSnapshot, previousCitationSnapshot, saveCitationSnapshot } from './store'
import type { AiEngine, CitationDelta, CitationResult, CitationSnapshot } from './types'
import { AI_ENGINE_LABELS } from './types'

function id(): string {
  return `cite_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const DEFAULT_ENGINES: AiEngine[] = ['perplexity']

function aggregate(siteId: string, brandDomain: string, results: CitationResult[]): CitationSnapshot {
  const avail = results.filter((r) => r.available)
  const cited = avail.filter((r) => r.cited)
  const engines = Array.from(new Set(results.map((r) => r.engine)))
  const byEngine = engines.map((engine) => {
    const e = results.filter((r) => r.engine === engine && r.available)
    const c = e.filter((r) => r.cited)
    return { engine, checked: e.length, cited: c.length, share: e.length ? c.length / e.length : 0 }
  })
  return {
    id: id(),
    siteId,
    brandDomain,
    takenAt: new Date().toISOString(),
    results,
    queriesChecked: avail.length,
    queriesCited: cited.length,
    citationShare: avail.length ? cited.length / avail.length : 0,
    byEngine,
  }
}

export async function runCitationCheck(
  siteId: string,
  brandDomain: string,
  queries: string[],
  engines: AiEngine[] = DEFAULT_ENGINES
): Promise<{ snapshot: CitationSnapshot; deltas: CitationDelta[] }> {
  const results: CitationResult[] = []
  for (const query of queries) {
    for (const engine of engines) {
      results.push(await probe(engine, query, brandDomain))
    }
  }
  const previous = await latestCitationSnapshot(siteId)
  const snapshot = aggregate(siteId, brandDomain, results)
  await saveCitationSnapshot(snapshot)
  return { snapshot, deltas: computeCitationDeltas(previous, snapshot) }
}

export function computeCitationDeltas(prev: CitationSnapshot | null, next: CitationSnapshot): CitationDelta[] {
  if (!prev) return []
  const out: CitationDelta[] = []
  const overall = round(next.citationShare - prev.citationShare)
  if (overall !== 0) {
    out.push({
      metric: 'citationShare',
      label: 'AI citation share',
      before: prev.citationShare,
      after: next.citationShare,
      change: overall,
      good: overall > 0,
      takenAt: next.takenAt,
    })
  }
  for (const cur of next.byEngine) {
    const before = prev.byEngine.find((e) => e.engine === cur.engine)
    if (!before) continue
    const change = round(cur.share - before.share)
    if (change === 0) continue
    out.push({
      metric: 'engineShare',
      engine: cur.engine,
      label: `${AI_ENGINE_LABELS[cur.engine]} citation share`,
      before: before.share,
      after: cur.share,
      change,
      good: change > 0,
      takenAt: next.takenAt,
    })
  }
  return out
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
