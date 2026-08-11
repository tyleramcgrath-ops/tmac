import { describe, it, expect } from 'vitest'
import {
  findLinkEquityGaps,
  inboundLinkCounts,
  pageKey,
  type LinkGraphPage,
  type PagePerformance,
} from '../lib/foundation/reco/link-equity'

const P = 'https://example.com'

function page(path: string, title: string, targets: string[] = []): LinkGraphPage {
  return { url: `${P}${path}`, title, internalTargets: targets.map((t) => `${P}${t}`) }
}
function perf(path: string, impressions: number, over: Partial<PagePerformance> = {}): PagePerformance {
  return {
    page: `${P}${path}`, clicks: 0, impressions, position: 12, queries: 5,
    topQuery: 'a query', ...over,
  }
}

describe('pageKey', () => {
  it('treats the spellings a site links to itself in as one page', () => {
    const k = pageKey('https://example.com/pricing')
    expect(pageKey('https://www.example.com/pricing/')).toBe(k)
    expect(pageKey('https://EXAMPLE.com/pricing#top')).toBe(k)
  })

  it('keeps query strings, because ?id=2 is a different page', () => {
    expect(pageKey('https://example.com/p?id=2')).not.toBe(pageKey('https://example.com/p?id=3'))
  })

  it('does not throw on an unparseable URL', () => {
    expect(() => pageKey('not a url/')).not.toThrow()
    expect(pageKey('not a url/')).toBe('not a url')
  })
})

describe('inboundLinkCounts', () => {
  it('counts distinct linking pages, not total links', () => {
    // /a links to /target twice; that is one relationship.
    const counts = inboundLinkCounts([
      page('/a', 'A', ['/target', '/target']),
      page('/b', 'B', ['/target']),
      page('/target', 'Target'),
    ])
    expect(counts.get(pageKey(`${P}/target`))).toBe(2)
  })

  it('ignores self-links, which breadcrumbs and paginators emit everywhere', () => {
    const counts = inboundLinkCounts([page('/a', 'A', ['/a', '/a/'])])
    expect(counts.get(pageKey(`${P}/a`))).toBe(0)
  })

  it('matches links written in a different spelling of the same URL', () => {
    const counts = inboundLinkCounts([
      { url: `${P}/target`, title: 'T' },
      { url: `${P}/a`, title: 'A', internalTargets: ['https://www.example.com/target/'] },
    ])
    expect(counts.get(pageKey(`${P}/target`))).toBe(1)
  })

  it('reports zero for a page nothing links to', () => {
    const counts = inboundLinkCounts([page('/a', 'A'), page('/orphan', 'Orphan')])
    expect(counts.get(pageKey(`${P}/orphan`))).toBe(0)
  })
})

describe('findLinkEquityGaps', () => {
  // A site where /crm-guide is the top earner and nothing links to it, while
  // /about earns nothing and is linked from everywhere.
  function site(): { pages: LinkGraphPage[]; performance: PagePerformance[] } {
    return {
      pages: [
        page('/', 'Home', ['/about', '/pricing', '/contact']),
        page('/about', 'About Us', ['/about', '/contact']),
        page('/pricing', 'CRM Pricing', ['/about']),
        page('/contact', 'Contact', ['/about']),
        page('/crm-guide', 'The Complete CRM Guide'),
      ],
      performance: [
        perf('/crm-guide', 9000, { clicks: 200, queries: 40, topQuery: 'crm guide' }),
        perf('/pricing', 3000, { clicks: 60 }),
        perf('/', 1200, { clicks: 30 }),
        perf('/about', 90, { clicks: 1 }),
        perf('/contact', 80, { clicks: 0 }),
      ],
    }
  }

  it('surfaces the top earner that nothing links to', () => {
    const rows = findLinkEquityGaps(site())
    expect(rows[0].url).toBe(`${P}/crm-guide`)
    expect(rows[0].inboundLinks).toBe(0)
    expect(rows[0].demandRank).toBe(1)
    expect(rows[0].gap).toBeGreaterThan(0)
  })

  it('leaves a well-linked page alone even when it earns a lot', () => {
    const rows = findLinkEquityGaps(site())
    expect(rows.find((r) => r.url === `${P}/about`)).toBeUndefined()
  })

  it('suggests topically related pages to carry the link', () => {
    const rows = findLinkEquityGaps(site())
    const top = rows[0]
    expect(top.suggestions.length).toBeGreaterThan(0)
    // /pricing is "CRM Pricing" — the closest page to "The Complete CRM Guide".
    expect(top.suggestions[0].from).toBe(`${P}/pricing`)
  })

  it('never suggests a page that already links to the target', () => {
    const rows = findLinkEquityGaps({
      pages: [
        page('/', 'Home', ['/crm-guide', '/about', '/pricing']),
        page('/about', 'About Us', ['/about']),
        page('/pricing', 'CRM Pricing'),
        page('/contact', 'Contact', ['/about', '/pricing']),
        page('/crm-guide', 'The Complete CRM Guide'),
      ],
      performance: [
        perf('/crm-guide', 9000), perf('/pricing', 3000), perf('/', 1200),
        perf('/about', 900), perf('/contact', 800),
      ],
    })
    const guide = rows.find((r) => r.url === `${P}/crm-guide`)
    expect(guide?.suggestions.some((s) => s.from === `${P}/`)).toBe(false)
  })

  it('never suggests the page link to itself', () => {
    const rows = findLinkEquityGaps(site())
    for (const r of rows) expect(r.suggestions.some((s) => s.from === r.url)).toBe(false)
  })

  it('uses the target page title as the anchor, with the brand suffix dropped', () => {
    const rows = findLinkEquityGaps({
      ...site(),
      pages: site().pages.map((p) => (p.url.endsWith('/crm-guide') ? { ...p, title: 'The Complete CRM Guide | Acme' } : p)),
    })
    expect(rows[0].suggestions[0].anchor).toBe('The Complete CRM Guide')
  })

  it('falls back to the top query for an anchor when the page has no title', () => {
    const rows = findLinkEquityGaps({
      ...site(),
      pages: site().pages.map((p) => (p.url.endsWith('/crm-guide') ? { url: p.url, internalTargets: [] } : p)),
    })
    expect(rows[0].suggestions[0].anchor).toBe('crm guide')
  })

  it('ignores pages without enough impressions to judge', () => {
    const rows = findLinkEquityGaps({
      pages: [page('/a', 'A', ['/b']), page('/b', 'B', ['/a']), page('/quiet', 'Quiet'), page('/c', 'C', ['/a'])],
      performance: [perf('/a', 900), perf('/b', 800), perf('/c', 700), perf('/quiet', 10)],
    })
    expect(rows.some((r) => r.url === `${P}/quiet`)).toBe(false)
  })

  it('judges only pages present in BOTH the crawl and Search Console', () => {
    const rows = findLinkEquityGaps({
      pages: [page('/a', 'A', ['/b']), page('/b', 'B'), page('/c', 'C', ['/a'])],
      // /ghost has demand but was never crawled — no link count exists for it.
      performance: [perf('/a', 900), perf('/b', 800), perf('/c', 700), perf('/ghost', 9999)],
    })
    expect(rows.some((r) => r.url.includes('ghost'))).toBe(false)
  })

  it('stays silent on a site too small for ranks to mean anything', () => {
    expect(findLinkEquityGaps({
      pages: [page('/a', 'A'), page('/b', 'B', ['/a'])],
      performance: [perf('/a', 900), perf('/b', 800)],
    })).toEqual([])
  })

  it('returns nothing when either side of the join is missing', () => {
    expect(findLinkEquityGaps({ pages: [], performance: [perf('/a', 900)] })).toEqual([])
    expect(findLinkEquityGaps({ pages: [page('/a', 'A')], performance: [] })).toEqual([])
  })

  it('does not flag a site whose links already track its demand', () => {
    // Most-linked page is also the top earner, straight down the list.
    const rows = findLinkEquityGaps({
      pages: [
        page('/top', 'Top', []),
        page('/mid', 'Mid', ['/top']),
        page('/low', 'Low', ['/top', '/mid']),
        page('/x', 'X', ['/top', '/mid', '/low']),
      ],
      performance: [perf('/top', 9000), perf('/mid', 3000), perf('/low', 1000), perf('/x', 500)],
    })
    expect(rows).toEqual([])
  })

  it('honours the limit', () => {
    // A site whose linking is the exact inverse of its demand: page i links to
    // every page after it, so the lowest earner is the most-linked and the top
    // earner has nothing pointing at it. Every page is a gap.
    const pages = Array.from({ length: 30 }, (_, i) =>
      page(`/p${i}`, `Page ${i}`, Array.from({ length: 29 - i }, (_, j) => `/p${i + j + 1}`))
    )
    const performance = Array.from({ length: 30 }, (_, i) => perf(`/p${i}`, 5000 - i * 10))
    expect(findLinkEquityGaps({ pages, performance, limit: 4 })).toHaveLength(4)
    // Sanity: without the limit there is genuinely more than 4 to find.
    expect(findLinkEquityGaps({ pages, performance, limit: 50 }).length).toBeGreaterThan(4)
  })

  it('orders by real impressions, so the biggest earner is addressed first', () => {
    const rows = findLinkEquityGaps({
      pages: [
        page('/hub', 'Hub', ['/small', '/other']),
        page('/other', 'Other', ['/small']),
        page('/small', 'Small Winner'),
        page('/big', 'Big Winner'),
        page('/mid', 'Mid Winner'),
      ],
      performance: [
        perf('/big', 9000), perf('/mid', 5000), perf('/small', 2000),
        perf('/hub', 200), perf('/other', 150),
      ],
    })
    const impressions = rows.map((r) => r.impressions)
    expect(impressions).toEqual([...impressions].sort((a, b) => b - a))
  })
})
