import { describe, it, expect } from 'vitest'
import { squash, domainLabel, brandTermsFor, isBrandQuery } from '../lib/foundation/reco/brand'

describe('domainLabel', () => {
  it('takes the registrable label', () => {
    expect(domainLabel('envuetelematics.com')).toBe('envuetelematics')
    expect(domainLabel('https://www.envuetelematics.com/pricing')).toBe('envuetelematics')
  })
  it('handles a two-part public suffix', () => {
    expect(domainLabel('acme.co.uk')).toBe('acme')
    expect(domainLabel('shop.acme.com.au')).toBe('acme')
  })
  it('does not throw on junk', () => {
    expect(() => domainLabel('not a domain')).not.toThrow()
    expect(domainLabel('')).toBe('')
  })
})

describe('squash', () => {
  it('makes the spaced and glued forms identical', () => {
    expect(squash('Envue Telematics')).toBe(squash('envuetelematics'))
  })
})

describe('isBrandQuery — the real envuetelematics.com case', () => {
  // The two loudest cannibalization findings on the live site were "envue"
  // (18 pages) and "envue telematics" (11 pages). Both are the company's own
  // name, and both were false positives.
  const terms = brandTermsFor({ domain: 'envuetelematics.com', competitorDomains: ['geotab.com', 'azuga.com'] })

  it('matches the brand typed with a space', () => {
    expect(isBrandQuery('envue telematics', terms)).toBe(true)
  })
  it('matches the shortened brand', () => {
    expect(isBrandQuery('envue', terms)).toBe(true)
  })
  it('matches a tracked rival by name, since comparison pages legitimately compete', () => {
    expect(isBrandQuery('geotab', terms)).toBe(true)
    expect(isBrandQuery('azuga', terms)).toBe(true)
  })
  it('does NOT match a real topic that merely mentions the brand', () => {
    // "envue telematics pricing" is a genuine query; several pages competing
    // for it is a genuine finding, not brand noise.
    expect(isBrandQuery('envue telematics pricing', terms)).toBe(false)
  })
  it('does NOT match unrelated topics', () => {
    expect(isBrandQuery('fleet fuel management', terms)).toBe(false)
    expect(isBrandQuery('california funding events for fleet telematics', terms)).toBe(false)
  })
  it('ignores a too-short query rather than prefix-matching everything', () => {
    expect(isBrandQuery('env', terms)).toBe(false)
    expect(isBrandQuery('ev', terms)).toBe(false)
  })
  it('is empty-safe', () => {
    expect(isBrandQuery('anything', [])).toBe(false)
    expect(isBrandQuery('', terms)).toBe(false)
  })
})

describe('brandTermsFor', () => {
  it('includes the project name when it differs from the domain', () => {
    const terms = brandTermsFor({ domain: 'acme.com', name: 'Acme Industrial' })
    expect(isBrandQuery('acme industrial', terms)).toBe(true)
  })
  it('drops terms too short to match safely', () => {
    expect(brandTermsFor({ domain: 'ab.com' })).toEqual([])
  })
})
