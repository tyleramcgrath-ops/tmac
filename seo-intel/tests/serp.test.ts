import { describe, expect, it } from 'vitest'
import { parseSerpApiResponse, SerpError } from '@/lib/serp'

const QUERY = { keyword: 'best crm', country: 'us', device: 'desktop' as const }

const FIXTURE = {
  organic_results: Array.from({ length: 12 }, (_, i) => ({
    position: i + 1,
    title: `Result ${i + 1} title`,
    link: `https://site${i + 1}.com/page`,
    displayed_link: `site${i + 1}.com › page`,
    snippet: `Snippet for result ${i + 1}`,
  })),
  answer_box: {
    title: 'Result 1 title',
    snippet: 'A CRM is...',
    link: 'https://site1.com/page',
  },
  related_questions: [
    { question: 'What is the best CRM for small business?' },
    { question: 'Is there a free CRM?' },
  ],
  related_searches: [{ query: 'best crm free' }, { query: 'crm comparison' }],
}

describe('parseSerpApiResponse', () => {
  it('extracts at most 10 organic results with positions and domains', () => {
    const serp = parseSerpApiResponse(FIXTURE, QUERY)
    expect(serp.results).toHaveLength(10)
    expect(serp.results[0]).toMatchObject({
      position: 1,
      url: 'https://site1.com/page',
      domain: 'site1.com',
      title: 'Result 1 title',
      snippet: 'Snippet for result 1',
    })
  })

  it('marks the featured-snippet result', () => {
    const serp = parseSerpApiResponse(FIXTURE, QUERY)
    expect(serp.featuredSnippet?.url).toBe('https://site1.com/page')
    expect(serp.results[0].isFeaturedSnippet).toBe(true)
    expect(serp.results[1].isFeaturedSnippet).toBeUndefined()
  })

  it('extracts People Also Ask and related searches', () => {
    const serp = parseSerpApiResponse(FIXTURE, QUERY)
    expect(serp.peopleAlsoAsk).toEqual([
      'What is the best CRM for small business?',
      'Is there a free CRM?',
    ])
    expect(serp.relatedSearches).toEqual(['best crm free', 'crm comparison'])
  })

  it('skips entries without links and tolerates missing optional blocks', () => {
    const serp = parseSerpApiResponse(
      { organic_results: [{ position: 1, title: 'no link' }, { position: 2, title: 'ok', link: 'https://a.com' }] },
      QUERY
    )
    expect(serp.results).toHaveLength(1)
    expect(serp.results[0].url).toBe('https://a.com')
    expect(serp.peopleAlsoAsk).toEqual([])
    expect(serp.featuredSnippet).toBeUndefined()
  })

  it('throws a SerpError when there are no organic results', () => {
    expect(() => parseSerpApiResponse({}, QUERY)).toThrow(SerpError)
  })
})
