import type { BacklinkData, BacklinkProfile } from './types'

// Backlink / authority data via DataForSEO Backlinks API.
// DATAFORSEO_API_KEY is "login:password" (Basic auth). When no key is
// configured the UI shows a setup message — no numbers are ever invented.

const ENDPOINT = 'https://api.dataforseo.com/v3/backlinks/summary/live'

export const BACKLINKS_SETUP_MESSAGE =
  'Backlink and authority data requires a DataForSEO API key. Add DATAFORSEO_API_KEY (format login:password) on the Settings page or in your environment to enable referring domains, backlink counts, domain rank and anchor text comparison.'

export async function fetchBacklinks(targets: string[], apiKey: string | null): Promise<BacklinkData> {
  if (!apiKey) {
    return { available: false, provider: null, message: BACKLINKS_SETUP_MESSAGE, profiles: [] }
  }

  const auth = 'Basic ' + Buffer.from(apiKey).toString('base64')
  const profiles: BacklinkProfile[] = []

  for (const target of targets) {
    profiles.push(await fetchSummary(target, auth))
  }

  const allFailed = profiles.every((p) => p.error !== null)
  return {
    available: !allFailed,
    provider: 'dataforseo',
    message: allFailed ? `Backlink lookups failed: ${profiles[0]?.error ?? 'unknown error'}` : null,
    profiles,
  }
}

async function fetchSummary(target: string, auth: string): Promise<BacklinkProfile> {
  const empty: Omit<BacklinkProfile, 'error'> = {
    target,
    backlinks: null,
    referringDomains: null,
    domainRank: null,
    urlRank: null,
    spamScore: null,
    topAnchors: [],
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ target, include_subdomains: true }]),
      signal: AbortSignal.timeout(30_000),
    })
    if (res.status === 401) return { ...empty, error: 'DataForSEO credentials rejected (401). Check DATAFORSEO_API_KEY.' }
    if (!res.ok) return { ...empty, error: `DataForSEO HTTP ${res.status}` }

    const payload = (await res.json()) as Record<string, any>
    const task = payload.tasks?.[0]
    if (!task || task.status_code >= 40000) {
      return { ...empty, error: `DataForSEO error: ${task?.status_message ?? 'no task result'}` }
    }
    const result = task.result?.[0]
    if (!result) return { ...empty, error: 'No backlink data returned for this target.' }

    return {
      target,
      backlinks: numOrNull(result.backlinks),
      referringDomains: numOrNull(result.referring_domains),
      domainRank: numOrNull(result.rank),
      urlRank: numOrNull(result.main_domain_rank ?? result.rank),
      spamScore: numOrNull(result.backlinks_spam_score),
      topAnchors: [],
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error && err.name === 'TimeoutError' ? 'DataForSEO request timed out.' : `DataForSEO request failed: ${err instanceof Error ? err.message : String(err)}`
    return { ...empty, error: message }
  }
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
