// AI answer-engine citation checking. Perplexity is the only LIVE engine —
// its API returns the exact sources behind an answer, so we can honestly
// determine whether a domain was cited. No other engine (ChatGPT, Gemini,
// Google AI Overviews) exposes a public API that returns its grounding
// sources, so we don't fabricate a check for them.

export interface CitationCheck {
  available: boolean
  cited: boolean
  position: number | null
  citedUrl: string | null
  sourceCount: number
  message?: string
}

export function perplexityApiKey(): string | null {
  return process.env.PERPLEXITY_API_KEY || null
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function domainMatches(brand: string, url: string): boolean {
  const b = brand.replace(/^www\./, '').toLowerCase()
  const h = hostOf(url).toLowerCase()
  return h === b || h.endsWith('.' + b)
}

// Asks Perplexity's "sonar" model the tracked query and checks whether any
// of the real sources it cites belong to `brandDomain`. Never invents a
// citation — an unreachable API or missing key returns available:false.
export async function checkCitation(query: string, brandDomain: string, apiKey: string): Promise<CitationCheck> {
  let res: Response
  try {
    res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: query }] }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    return { available: false, cited: false, position: null, citedUrl: null, sourceCount: 0, message: `Could not reach Perplexity: ${err instanceof Error ? err.message : 'network error'}` }
  }
  if (!res.ok) {
    return { available: false, cited: false, position: null, citedUrl: null, sourceCount: 0, message: `Perplexity returned HTTP ${res.status}.` }
  }
  let data: { citations?: string[]; search_results?: { url?: string }[] }
  try {
    data = (await res.json()) as typeof data
  } catch {
    // A 200 carrying an HTML error page would otherwise throw out of here and
    // abort the whole scheduled citation run, not just this one query.
    return { available: false, cited: false, position: null, citedUrl: null, sourceCount: 0, message: 'Perplexity returned a response that was not JSON.' }
  }
  // Newer responses carry BOTH keys, sometimes with an empty citations array
  // beside a populated search_results. Preferring whichever list actually has
  // entries keeps an empty array from reading as "no sources" — which would
  // report a lost citation that was never lost.
  const fromCitations = (data.citations ?? []).filter(Boolean)
  const fromResults = (data.search_results ?? []).map((s) => s.url ?? '').filter(Boolean)
  const sources = fromCitations.length > 0 ? fromCitations : fromResults
  let position: number | null = null
  let citedUrl: string | null = null
  sources.forEach((url, i) => {
    if (position === null && domainMatches(brandDomain, url)) {
      position = i + 1
      citedUrl = url
    }
  })
  return { available: true, cited: position !== null, position, citedUrl, sourceCount: sources.length }
}
