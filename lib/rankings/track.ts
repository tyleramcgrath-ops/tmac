// Provider-agnostic rank-check logic.
//
// Core honesty rule (spec §7, §8, §27): a ranking is either OBSERVED from a
// real check or it is UNAVAILABLE. We never invent a position, and we never
// silently substitute one source's number for another. Every result carries
// its source label and, when unavailable, the reason — so the UI can preserve
// the last verified rank rather than overwriting it with a guess.

export type RankSource =
  | 'rankforge_live_check'
  | 'gsc'
  | 'manual'
  | 'imported'
  | 'estimated'
  | 'unavailable'

export interface RankCheckResult {
  keyword: string
  position: number | null
  rankingUrl: string | null
  source: RankSource
  available: boolean
  unavailableReason: string | null
  serpFeatures: string[]
}

export interface SerpOrganicResult {
  link?: string
  position?: number
}

export interface SerpResponse {
  organic_results?: SerpOrganicResult[]
  local_results?: unknown
  answer_box?: unknown
  related_questions?: unknown[]
  inline_videos?: unknown
  ai_overview?: unknown
}

function hostOf(url: string): string | null {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Extracts the SERP features present in a SERPAPI response, for the feature-presence tracking the spec asks for. */
export function extractSerpFeatures(data: SerpResponse): string[] {
  const features: string[] = []
  if (data.local_results) features.push('local_pack')
  if (data.answer_box) features.push('featured_snippet')
  if (Array.isArray(data.related_questions) && data.related_questions.length > 0) features.push('paa')
  if (data.inline_videos) features.push('video')
  if (data.ai_overview) features.push('ai_overview')
  return features
}

/**
 * Interprets a SERP API response for one keyword into an OBSERVED result. A
 * missing match means "not found in the results we pulled" — position null,
 * but still `available` and observed (the check succeeded, the site just
 * doesn't rank in range). A failed request is a different thing: unavailable.
 */
export function interpretSerpResponse(keyword: string, targetDomain: string, data: SerpResponse): RankCheckResult {
  const host = hostOf(targetDomain)
  const organic = Array.isArray(data.organic_results) ? data.organic_results : []
  const match = organic.find((r) => r.link && hostOf(r.link) === host)
  return {
    keyword,
    position: match?.position ?? null,
    rankingUrl: match?.link ?? null,
    source: 'rankforge_live_check',
    available: true,
    unavailableReason: null,
    serpFeatures: extractSerpFeatures(data),
  }
}

export function unavailableResult(keyword: string, reason: string): RankCheckResult {
  return {
    keyword,
    position: null,
    rankingUrl: null,
    source: 'unavailable',
    available: false,
    unavailableReason: reason,
    serpFeatures: [],
  }
}

export interface RankSummary {
  checked: number
  observed: number // checks that completed (whether or not the site ranked)
  unavailable: number
  ranking: number // checks where the site was actually found
  top3: number
  top10: number
  top20: number
  avgPosition: number | null
}

/** Summary counts, computed ONLY from observed results — unavailable checks never affect averages. */
export function summarizeRankChecks(results: RankCheckResult[]): RankSummary {
  const observed = results.filter((r) => r.available)
  const ranking = observed.filter((r) => r.position !== null)
  const positions = ranking.map((r) => r.position as number)
  return {
    checked: results.length,
    observed: observed.length,
    unavailable: results.length - observed.length,
    ranking: ranking.length,
    top3: positions.filter((p) => p <= 3).length,
    top10: positions.filter((p) => p <= 10).length,
    top20: positions.filter((p) => p <= 20).length,
    avgPosition: positions.length > 0
      ? Math.round((positions.reduce((a, p) => a + p, 0) / positions.length) * 10) / 10
      : null,
  }
}

/**
 * Given the previous stored positions and a fresh set of observed checks,
 * computes the position delta per keyword. Only meaningful for keywords that
 * were observed this run AND have a prior position; everything else is null
 * (no fabricated "improvement from nothing").
 */
export function computeRankDeltas(
  results: RankCheckResult[],
  previous: Record<string, number | null>
): { keyword: string; previous: number | null; current: number | null; delta: number | null; direction: 'up' | 'down' | 'flat' | 'unknown' }[] {
  return results.map((r) => {
    const prev = previous[r.keyword] ?? null
    const cur = r.available ? r.position : null
    let delta: number | null = null
    let direction: 'up' | 'down' | 'flat' | 'unknown' = 'unknown'
    if (prev !== null && cur !== null) {
      delta = prev - cur // positive = improved (moved to a lower/better position number)
      direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
    }
    return { keyword: r.keyword, previous: prev, current: cur, delta, direction }
  })
}
