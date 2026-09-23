// Brand-query detection.
//
// A site ranking many of its own pages for its own name is not a defect — it is
// what a healthy brand presence looks like. Search Console reported 18 pages of
// envuetelematics.com ranking for "envue" and 11 for "envue telematics", and
// the cannibalization detector dutifully called both a problem. They were the
// two loudest findings on the screen and both were wrong.
//
// The hard part is that a domain label is glued together ("envuetelematics")
// while people type it with spaces ("envue telematics") or shortened ("envue").
// So everything here compares SQUASHED forms — letters and digits only — which
// makes "envue telematics" and "envuetelematics" the same string, and makes
// "envue" a clean prefix of it.

export interface BrandTermsInput {
  /** The project's own domain, e.g. "envuetelematics.com". */
  domain: string
  /** The project's display name, when set — often the spaced brand. */
  name?: string
  /** Tracked competitor domains. Ranking several pages for a RIVAL's name is
   *  also expected (comparison pages), so those count as brand terms too. */
  competitorDomains?: string[]
}

// Below this a "prefix match" is noise: two or three letters prefix half the
// dictionary, and calling every short query a brand term would hide real
// cannibalization.
const MIN_PREFIX_LEN = 4

/** Letters and digits only, lowercased — "Envue Telematics!" → "envuetelematics". */
export function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** The registrable label of a host: "www.envuetelematics.co.uk" → "envuetelematics". */
export function domainLabel(domainOrUrl: string): string {
  let host = domainOrUrl.trim().toLowerCase()
  try {
    host = new URL(host.includes('://') ? host : `https://${host}`).hostname
  } catch {
    host = host.replace(/^https?:\/\//, '').split('/')[0]
  }
  host = host.replace(/^www\./, '')
  const parts = host.split('.').filter(Boolean)
  if (parts.length === 0) return ''
  // Drop the TLD, and a second-level public suffix like .co.uk / .com.au.
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
    return parts[parts.length - 3]
  }
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
}

/** Squashed brand strings to test queries against. */
export function brandTermsFor(input: BrandTermsInput): string[] {
  const terms = new Set<string>()
  const add = (s: string) => {
    const v = squash(s)
    if (v.length >= MIN_PREFIX_LEN) terms.add(v)
  }
  add(domainLabel(input.domain))
  if (input.name) add(input.name)
  for (const d of input.competitorDomains ?? []) add(domainLabel(d))
  return [...terms]
}

/**
 * Does this query name a brand (ours or a tracked rival)?
 *
 * Matches when the squashed query and a squashed brand term are equal, or when
 * one is a prefix of the other — which is what catches "envue" against
 * "envuetelematics" without also catching every query containing "en".
 *
 * A query with extra words beyond the brand ("envue telematics pricing") is NOT
 * a brand query: that is a real topic, and several pages competing for it is a
 * real finding.
 */
export function isBrandQuery(query: string, brandTerms: string[]): boolean {
  const q = squash(query)
  if (q.length < MIN_PREFIX_LEN) return false
  return brandTerms.some((t) => {
    if (q === t) return true
    // Prefix either way, but the shorter side must still be substantial.
    if (t.startsWith(q) && q.length >= MIN_PREFIX_LEN) return true
    if (q.startsWith(t) && t.length >= MIN_PREFIX_LEN) {
      // "envuetelematics" + "pricing" squashes to "envuetelematicspricing",
      // which starts with the brand but is a different search. Only treat it as
      // brand when what follows is trivial.
      return q.length - t.length <= 2
    }
    return false
  })
}
