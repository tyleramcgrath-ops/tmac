// Backlink profile checking via Majestic's Index Item Info API
// (https://api.majestic.com) — a real third-party backlink index, not a
// live crawl of the open web (impractical to do in-app) and not an
// estimate. Optional: unset MAJESTIC_API_KEY means this deployment simply
// doesn't have backlink data, same honest-fallback pattern as every other
// external integration (SERP, Stripe, Resend).
//
// NOTE: this integration is built from Majestic's documented API contract
// but has not been exercised against a live key from this environment —
// verify field names against a real response and adjust `parseRow` if
// Majestic's schema has since changed.

export interface BacklinkCheck {
  available: boolean
  totalBacklinks: number | null
  referringDomains: number | null
  trustFlow: number | null
  citationFlow: number | null
  message?: string
}

export function majesticApiKey(): string | null {
  return process.env.MAJESTIC_API_KEY || null
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

// Majestic returns a generic tabular shape: DataTables.Results.{Headers,Data}.
// Data rows are objects keyed by the header names — pull known fields by
// name so a header reorder can't break parsing, and tolerate missing fields.
function parseRow(row: Record<string, unknown>): BacklinkCheck {
  return {
    available: true,
    totalBacklinks: num(row.ExtBackLinks ?? row.BackLinks),
    referringDomains: num(row.RefDomains),
    trustFlow: num(row.TrustFlow),
    citationFlow: num(row.CitationFlow),
  }
}

export async function checkBacklinks(domain: string, apiKey: string): Promise<BacklinkCheck> {
  const url = new URL('https://api.majestic.com/api/json')
  url.searchParams.set('app_api_key', apiKey)
  url.searchParams.set('cmd', 'GetIndexItemInfo')
  url.searchParams.set('items', '1')
  url.searchParams.set('item0', domain)
  url.searchParams.set('datasource', 'fresh')

  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  } catch (err) {
    return { available: false, totalBacklinks: null, referringDomains: null, trustFlow: null, citationFlow: null, message: `Could not reach Majestic: ${err instanceof Error ? err.message : 'network error'}` }
  }
  if (!res.ok) {
    return { available: false, totalBacklinks: null, referringDomains: null, trustFlow: null, citationFlow: null, message: `Majestic returned HTTP ${res.status}.` }
  }
  const data = (await res.json()) as {
    Code?: string
    ErrorMessage?: string
    DataTables?: { Results?: { Data?: Record<string, unknown>[] } }
  }
  if (data.Code && data.Code !== 'OK') {
    return { available: false, totalBacklinks: null, referringDomains: null, trustFlow: null, citationFlow: null, message: data.ErrorMessage || `Majestic error: ${data.Code}` }
  }
  const row = data.DataTables?.Results?.Data?.[0]
  if (!row) {
    return { available: false, totalBacklinks: null, referringDomains: null, trustFlow: null, citationFlow: null, message: 'Majestic returned no data for this domain.' }
  }
  return parseRow(row)
}
