// Relevance-based internal-link target selection (lib/foundation/reco/link-ranking.ts).
// Every automatic internal-linking path — the operator fix generator, the
// Internal Links tab's "Link all"/"Link this page", and the WordPress
// optimizer's per-post/bulk internal-linking — routes through this so
// RankForge always picks the MOST TOPICALLY RELATED real pages instead of an
// arbitrary slice, which is both more useful to readers and a stronger SEO
// signal.

import { describe, expect, it } from 'vitest'
import { linkTokens, rankLinkCandidates } from '../lib/foundation/reco/link-ranking'

describe('linkTokens', () => {
  it('extracts meaningful tokens from title + URL slug, dropping stopwords/short words', () => {
    const t = linkTokens('The Best Fleet Fuel Management Guide', 'https://x.com/fleet-fuel-management')
    expect(t.has('fleet')).toBe(true)
    expect(t.has('fuel')).toBe(true)
    expect(t.has('management')).toBe(true)
    expect(t.has('the')).toBe(false) // stopword
    expect(t.has('best')).toBe(false) // stopword
    expect(t.has('guide')).toBe(false) // stopword
  })

  it('never throws on an unparseable URL', () => {
    expect(() => linkTokens('Title', 'not-a-url')).not.toThrow()
  })
})

describe('rankLinkCandidates', () => {
  const source = { url: 'https://x.com/fleet-fuel-management', title: 'Fleet Fuel Management Guide' }
  const candidates = [
    { url: 'https://x.com/pricing', title: 'Pricing' },
    { url: 'https://x.com/fuel-card-integration', title: 'Fuel Card Integration' },
    { url: 'https://x.com/about', title: 'About Us' },
    { url: 'https://x.com/fleet-tracking', title: 'Fleet Tracking Software' },
    { url: 'https://x.com/careers', title: 'Careers' },
  ]

  it('ranks topically related real pages above unrelated ones', () => {
    const picked = rankLinkCandidates(source, candidates, 2)
    expect(picked).toHaveLength(2)
    const urls = picked.map((p) => p.url)
    expect(urls).toContain('https://x.com/fuel-card-integration') // shares "fuel"
    expect(urls).toContain('https://x.com/fleet-tracking') // shares "fleet"
    expect(urls).not.toContain('https://x.com/pricing')
    expect(urls).not.toContain('https://x.com/careers')
  })

  it('every picked url/anchor is a REAL candidate from the input — never invented', () => {
    const picked = rankLinkCandidates(source, candidates, 3)
    for (const p of picked) {
      expect(candidates.some((c) => c.url === p.url)).toBe(true)
    }
  })

  it('anchor text is the target page\'s own title (descriptive, per Google guidance)', () => {
    const picked = rankLinkCandidates(source, candidates, 1)
    const target = candidates.find((c) => c.url === picked[0].url)!
    expect(picked[0].anchor).toBe(target.title)
  })

  it('strips a trailing brand suffix from the anchor, same as the rest of the app', () => {
    const picked = rankLinkCandidates(
      { url: 'https://x.com/a', title: 'A' },
      [{ url: 'https://x.com/b', title: 'Great Widget · Acme' }],
      1
    )
    expect(picked[0].anchor).toBe('Great Widget')
  })

  it('falls back to original order (still returns real candidates) when nothing overlaps topically', () => {
    const picked = rankLinkCandidates(
      { url: 'https://x.com/xyz123', title: 'Xyz123' },
      candidates,
      2
    )
    expect(picked).toHaveLength(2)
    expect(picked[0].url).toBe(candidates[0].url)
    expect(picked[1].url).toBe(candidates[1].url)
  })

  it('caps at n and returns fewer when fewer candidates exist', () => {
    expect(rankLinkCandidates(source, candidates.slice(0, 2), 5)).toHaveLength(2)
  })

  it('returns nothing for an empty candidate pool', () => {
    expect(rankLinkCandidates(source, [], 3)).toEqual([])
  })
})
