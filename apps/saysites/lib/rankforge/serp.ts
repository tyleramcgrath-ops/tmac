// Shared Google-position lookup via SERP API. Used by both the standalone
// /api/rankings point-in-time tool and the rank_tracking scheduled job — one
// implementation so both paths honor the same SERPAPI_KEY-unset fallback and
// never diverge on how a position is parsed out of the response.

export interface KeywordPosition {
  keyword: string
  position: number | null
  url: string | null
  topResult: string | null
}

export function serpApiKey(): string | null {
  return process.env.SERPAPI_KEY || null
}

// Looks up one keyword's live Google position for `host` (bare domain, no
// scheme/www). Never throws — a fetch/parse failure resolves to a "not
// found" row, same as a genuine not-ranking result, since the caller cannot
// distinguish "SERP API had an error" from "we truly aren't in the results"
// without an extra field, and both mean "no position to report."
export async function fetchKeywordPosition(keyword: string, host: string, apiKey: string): Promise<KeywordPosition> {
  try {
    const endpoint = new URL('https://serpapi.com/search.json')
    endpoint.searchParams.set('engine', 'google')
    endpoint.searchParams.set('q', keyword)
    endpoint.searchParams.set('num', '100')
    endpoint.searchParams.set('api_key', apiKey)
    const res = await fetch(endpoint)
    if (!res.ok) return { keyword, position: null, url: null, topResult: null }
    const data = await res.json()
    const organic: { link?: string; position?: number }[] = Array.isArray(data?.organic_results) ? data.organic_results : []
    const index = organic.findIndex((r) => {
      try {
        return !!r.link && new URL(r.link).hostname.replace(/^www\./, '') === host
      } catch {
        return false
      }
    })
    const match = index >= 0 ? organic[index] : undefined
    return {
      keyword,
      // When the API omits an explicit position, fall back to the result's
      // rank in the organic list. Reporting null while also reporting the URL
      // says "found it but it isn't ranking", which is self-contradictory and
      // registers downstream as a rank drop.
      position: match ? match.position ?? index + 1 : null,
      url: match?.link ?? null,
      topResult: organic[0]?.link ?? null,
    }
  } catch {
    return { keyword, position: null, url: null, topResult: null }
  }
}

export function hostOf(domainOrUrl: string): string {
  // The scheme test is case-insensitive: an uppercase "HTTP://" that failed to
  // match used to get a second scheme prefixed onto it, and the parse then
  // reported the host as "http".
  const u = /^https?:\/\//i.test(domainOrUrl) ? domainOrUrl : `https://${domainOrUrl}`
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    // A malformed stored domain must not throw out of a scheduled run.
    return ''
  }
}
