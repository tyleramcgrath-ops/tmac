import { describe, expect, it } from 'vitest'
import { parseInsights } from '@/lib/ai'
import { parsePsiResponse } from '@/lib/pagespeed'

describe('parseInsights', () => {
  const valid = JSON.stringify({
    executiveSummary: 'Summary here.',
    suggestedTitles: ['Title A', 'Title B'],
    suggestedMetaDescriptions: ['Meta A'],
    recommendedHeadingOutline: ['H1: Main', 'H2: Sub'],
    suggestedContentSections: ['Section one'],
    faqSuggestions: ['Question?'],
    aiSearchRecommendations: ['Do X'],
    shortAnswerBlock: 'Short answer.',
  })

  it('parses a clean JSON response', () => {
    const insights = parseInsights(valid, 'test-model')
    expect(insights.generatedBy).toBe('test-model')
    expect(insights.suggestedTitles).toEqual(['Title A', 'Title B'])
    expect(insights.shortAnswerBlock).toBe('Short answer.')
  })

  it('tolerates markdown fences and surrounding prose', () => {
    const wrapped = 'Here is the analysis:\n```json\n' + valid + '\n```\nHope that helps!'
    const insights = parseInsights(wrapped, 'test-model')
    expect(insights.executiveSummary).toBe('Summary here.')
  })

  it('drops non-string array entries instead of crashing', () => {
    const messy = JSON.stringify({ executiveSummary: 's', suggestedTitles: ['ok', 42, null] })
    const insights = parseInsights(messy, 'm')
    expect(insights.suggestedTitles).toEqual(['ok'])
    expect(insights.faqSuggestions).toEqual([])
  })

  it('throws when there is no JSON at all', () => {
    expect(() => parseInsights('sorry, I cannot do that', 'm')).toThrow()
  })
})

describe('parsePsiResponse', () => {
  it('extracts category scores and core web vitals', () => {
    const metrics = parsePsiResponse('https://x.com', 'mobile', {
      lighthouseResult: {
        categories: {
          performance: { score: 0.83 },
          accessibility: { score: 0.9 },
          'best-practices': { score: 1 },
          seo: { score: 0.77 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 2345.6 },
          'cumulative-layout-shift': { numericValue: 0.123456 },
          'first-contentful-paint': { numericValue: 1200 },
          'speed-index': { numericValue: 3400 },
        },
      },
      loadingExperience: { metrics: { INTERACTION_TO_NEXT_PAINT: { percentile: 180 } } },
    })
    expect(metrics.performance).toBe(83)
    expect(metrics.seo).toBe(77)
    expect(metrics.lcpMs).toBe(2346)
    expect(metrics.cls).toBe(0.123)
    expect(metrics.inpMs).toBe(180)
    expect(metrics.error).toBeNull()
  })

  it('returns nulls for missing data instead of fake values', () => {
    const metrics = parsePsiResponse('https://x.com', 'desktop', {})
    expect(metrics.performance).toBeNull()
    expect(metrics.lcpMs).toBeNull()
  })
})
