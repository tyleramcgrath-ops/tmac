import { describe, it, expect } from 'vitest'
import { buildKeywordUpserts } from '../persist'
import type { DiscoveredKeyword } from '../discover'

function kw(overrides: Partial<DiscoveredKeyword>): DiscoveredKeyword {
  return {
    keyword: 'emergency plumbing repair',
    normalizedKeyword: 'emergency plumbing repair',
    type: 'primary',
    intent: 'informational',
    confidence: 0.8,
    evidence: ['appears in title'],
    sources: ['title'],
    estimatedDemand: 0.5,
    ...overrides,
  }
}

describe('buildKeywordUpserts', () => {
  it('merges the same normalized keyword across pages, keeping the higher-priority (primary) source', () => {
    const records = buildKeywordUpserts([
      { url: 'https://example.com/blog/plumbing-tips', keywords: [kw({ type: 'secondary', normalizedKeyword: 'water heater', keyword: 'water heater', confidence: 0.4 })] },
      { url: 'https://example.com/services/water-heater', keywords: [kw({ type: 'primary', normalizedKeyword: 'water heater', keyword: 'Water Heater', confidence: 0.9 })] },
    ])
    const record = records.find((r) => r.normalizedKeyword === 'water heater')
    expect(record).toBeTruthy()
    expect(record!.type).toBe('primary')
    expect(record!.targetPageUrl).toBe('https://example.com/services/water-heater')
  })

  it('flags a keyword as cannibalized when it is the primary keyword on more than one page', () => {
    const records = buildKeywordUpserts([
      { url: 'https://example.com/a', keywords: [kw({ type: 'primary', normalizedKeyword: 'emergency plumbing' })] },
      { url: 'https://example.com/b', keywords: [kw({ type: 'primary', normalizedKeyword: 'emergency plumbing' })] },
    ])
    const record = records.find((r) => r.normalizedKeyword === 'emergency plumbing')
    expect(record!.cannibalized).toBe(true)
  })

  it('does not flag a keyword as cannibalized when it is primary on one page and secondary on another', () => {
    const records = buildKeywordUpserts([
      { url: 'https://example.com/a', keywords: [kw({ type: 'primary', normalizedKeyword: 'emergency plumbing' })] },
      { url: 'https://example.com/b', keywords: [kw({ type: 'secondary', normalizedKeyword: 'emergency plumbing', confidence: 0.3 })] },
    ])
    const record = records.find((r) => r.normalizedKeyword === 'emergency plumbing')
    expect(record!.cannibalized).toBe(false)
    // and the primary-page URL should win as the target
    expect(record!.targetPageUrl).toBe('https://example.com/a')
  })

  it('produces one record per distinct normalized keyword across the whole project', () => {
    const records = buildKeywordUpserts([
      { url: 'https://example.com/a', keywords: [kw({ normalizedKeyword: 'a' }), kw({ normalizedKeyword: 'b', type: 'secondary' })] },
      { url: 'https://example.com/b', keywords: [kw({ normalizedKeyword: 'c' })] },
    ])
    expect(records.map((r) => r.normalizedKeyword).sort()).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty array for pages with no discovered keywords', () => {
    expect(buildKeywordUpserts([{ url: 'https://example.com/a', keywords: [] }])).toEqual([])
  })
})
