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
  const data = (await res.json()) as { citations?: string[]; search_results?: { url?: string }[] }
  const sources = (data.citations ?? data.search_results?.map((s) => s.url ?? '') ?? []).filter(Boolean) as string[]
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
