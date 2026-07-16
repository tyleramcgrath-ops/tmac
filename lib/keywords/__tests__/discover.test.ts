import { describe, it, expect } from 'vitest'
import { discoverKeywords, detectCannibalization, type DiscoverInput } from '../discover'

function baseInput(overrides: Partial<DiscoverInput> = {}): DiscoverInput {
  return {
    title: 'Emergency Plumbing Repair in Austin | Fast Plumbers',
    metaDescription: 'Same-day emergency plumbing repair in Austin, TX.',
    h1: ['Emergency Plumbing Repair in Austin'],
    h2: ['Why Choose Our Plumbers', 'How Much Does Emergency Plumbing Cost?', 'Service Areas'],
    bodyText:
      'Our emergency plumbing repair team serves Austin homeowners every day. ' +
      'Emergency plumbing repair is available 24 hours a day, 7 days a week. ' +
      'When you need emergency plumbing repair fast, our licensed plumbers respond quickly. ' +
      'How much does emergency plumbing cost? Pricing depends on the issue. ' +
      'We also offer drain cleaning and water heater installation near me.',
    url: 'https://example.com/emergency-plumbing-repair-austin',
    schemaTypes: ['LocalBusiness', 'FAQPage'],
    hasFaq: true,
    brandTerms: ['fast plumbers'],
    ...overrides,
  }
}

describe('discoverKeywords', () => {
  it('picks a primary keyword anchored in the title', () => {
    const results = discoverKeywords(baseInput())
    const primary = results.find((r) => r.type === 'primary')
    expect(primary).toBeTruthy()
    expect(primary!.normalizedKeyword).toContain('emergency plumbing')
    expect(primary!.sources).toContain('title')
    expect(primary!.confidence).toBeGreaterThan(0.5)
    expect(primary!.confidence).toBeLessThanOrEqual(1)
  })

  it('does not duplicate the primary keyword as a secondary keyword', () => {
    const results = discoverKeywords(baseInput())
    const primary = results.find((r) => r.type === 'primary')!
    const secondaries = results.filter((r) => r.type === 'secondary' || r.type === 'long_tail')
    for (const s of secondaries) {
      expect(s.normalizedKeyword).not.toBe(primary.normalizedKeyword)
    }
  })

  it('extracts questions from FAQ-flagged content and H2s', () => {
    const results = discoverKeywords(baseInput())
    const questions = results.filter((r) => r.type === 'question')
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.some((q) => /how much does emergency plumbing cost/i.test(q.keyword))).toBe(true)
    for (const q of questions) expect(q.intent).toBe('informational')
  })

  it('classifies local intent from "near me" phrasing', () => {
    const results = discoverKeywords(baseInput())
    const local = results.find((r) => /near me/i.test(r.keyword))
    expect(local?.intent).toBe('local')
  })

  it('classifies transactional intent for pricing/booking language', () => {
    const results = discoverKeywords(
      baseInput({
        title: 'Book a Plumber Online | Same-Day Booking',
        h1: ['Book a Plumber Online'],
        bodyText: 'Book a plumber online today. Booking a plumber online takes two minutes. Get a free quote now.',
      })
    )
    const primary = results.find((r) => r.type === 'primary')!
    expect(['transactional', 'commercial']).toContain(primary.intent)
  })

  it('never returns a bare generic single word as a keyword', () => {
    const results = discoverKeywords(
      baseInput({
        title: 'Home',
        h1: ['Home'],
        h2: [],
        bodyText: 'Welcome. Click here. Learn more.',
        schemaTypes: [],
        hasFaq: false,
      })
    )
    for (const r of results) {
      expect(['home', 'welcome', 'click', 'here', 'learn', 'more']).not.toContain(r.normalizedKeyword)
    }
  })

  it('caps results at 20 keywords per page (no keyword-stuffing dump)', () => {
    const longBody = Array.from({ length: 50 }, (_, i) => `unique topic phrase number ${i} for testing purposes today`).join('. ')
    const results = discoverKeywords(baseInput({ bodyText: longBody }))
    expect(results.length).toBeLessThanOrEqual(20)
  })

  it('marks estimatedDemand as a bounded relative signal, not a raw count', () => {
    const results = discoverKeywords(baseInput())
    for (const r of results) {
      expect(r.estimatedDemand).toBeGreaterThanOrEqual(0)
      expect(r.estimatedDemand).toBeLessThanOrEqual(1)
    }
  })

  it('every keyword carries evidence explaining why it was chosen', () => {
    const results = discoverKeywords(baseInput())
    for (const r of results) {
      expect(r.evidence.length).toBeGreaterThan(0)
      expect(r.sources.length).toBeGreaterThan(0)
    }
  })
})

describe('detectCannibalization', () => {
  it('flags two pages sharing the same normalized primary keyword', () => {
    const warnings = detectCannibalization([
      { url: 'https://example.com/a', primaryKeyword: 'emergency plumbing repair' },
      { url: 'https://example.com/b', primaryKeyword: 'Emergency Plumbing Repair' },
      { url: 'https://example.com/c', primaryKeyword: 'water heater installation' },
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].normalizedKeyword).toBe('emergency plumbing repair')
    expect(warnings[0].urls.sort()).toEqual(['https://example.com/a', 'https://example.com/b'])
  })

  it('does not flag pages with distinct primary keywords', () => {
    const warnings = detectCannibalization([
      { url: 'https://example.com/a', primaryKeyword: 'emergency plumbing repair' },
      { url: 'https://example.com/b', primaryKeyword: 'water heater installation' },
    ])
    expect(warnings).toHaveLength(0)
  })

  it('ignores pages with no primary keyword', () => {
    const warnings = detectCannibalization([
      { url: 'https://example.com/a', primaryKeyword: null },
      { url: 'https://example.com/b', primaryKeyword: null },
    ])
    expect(warnings).toHaveLength(0)
  })
})
