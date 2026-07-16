import { describe, it, expect } from 'vitest'
import {
  validateFixtureName,
  validateFixtureUrl,
  validateFixturePercent,
  validateFixtureEvidence,
  validateNoDuplicates,
  assertFixtureQuality,
} from '../validate'

describe('validateFixtureName', () => {
  it('flags "Example Page" as a placeholder', () => {
    const issues = validateFixtureName('title', 'Example Page')
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].reason).toContain('placeholder')
  })

  it('flags an empty name', () => {
    const issues = validateFixtureName('title', '')
    expect(issues[0].reason).toBe('Empty name')
  })

  it('flags a generic initiative title like "Build example Authority"', () => {
    const issues = validateFixtureName('title', 'Build example Authority')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('flags all-lowercase multi-word titles as unedited', () => {
    const issues = validateFixtureName('title', 'complete guide to roofing services')
    expect(issues.some((i) => i.reason.includes('lowercase'))).toBe(true)
  })

  it('accepts a realistic, properly-cased professional title', () => {
    const issues = validateFixtureName('title', 'Denver Roofing Repair & Installation Services')
    expect(issues).toEqual([])
  })
})

describe('validateFixtureUrl', () => {
  it('flags example.com', () => {
    const issues = validateFixtureUrl('url', 'https://example.com/services')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('flags an invalid URL', () => {
    const issues = validateFixtureUrl('url', 'not a url')
    expect(issues[0].reason).toBe('Not a valid URL')
  })

  it('accepts a real-looking domain', () => {
    const issues = validateFixtureUrl('url', 'https://denver-roofing-pros.test')
    expect(issues).toEqual([])
  })
})

describe('validateFixturePercent', () => {
  it('flags an impossible percentage like 945000', () => {
    const issues = validateFixturePercent('roi', 945000)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].reason).toContain('Impossible percentage')
  })

  it('accepts a realistic percentage', () => {
    expect(validateFixturePercent('roi', 35)).toEqual([])
  })

  it('flags NaN', () => {
    expect(validateFixturePercent('roi', NaN).length).toBeGreaterThan(0)
  })
})

describe('validateFixtureEvidence', () => {
  it('flags missing evidence', () => {
    expect(validateFixtureEvidence('evidence', undefined).length).toBeGreaterThan(0)
    expect(validateFixtureEvidence('evidence', []).length).toBeGreaterThan(0)
    expect(validateFixtureEvidence('evidence', ['']).length).toBeGreaterThan(0)
  })

  it('accepts real evidence', () => {
    expect(validateFixtureEvidence('evidence', ['12 pages missing schema markup'])).toEqual([])
  })
})

describe('validateNoDuplicates', () => {
  it('flags duplicate recommendation titles', () => {
    const issues = validateNoDuplicates('rec', ['Improve title tags', 'Improve title tags', 'Fix broken links'])
    expect(issues.length).toBe(1)
  })

  it('accepts a list with no duplicates', () => {
    expect(validateNoDuplicates('rec', ['A', 'B', 'C'])).toEqual([])
  })
})

describe('assertFixtureQuality', () => {
  it('throws for a page set using "Example Page" / example.com', () => {
    expect(() =>
      assertFixtureQuality([{ url: 'https://example.com', title: 'Example Page' }])
    ).toThrow(/Fixture quality check failed/)
  })

  it('passes for a realistic page set', () => {
    expect(() =>
      assertFixtureQuality([
        { url: 'https://denver-roofing-pros.test', title: 'Denver Roofing Repair & Installation' },
        { url: 'https://denver-roofing-pros.test/services', title: 'Roofing Services & Pricing' },
      ])
    ).not.toThrow()
  })
})
