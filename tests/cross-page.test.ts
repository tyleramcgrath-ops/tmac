// Cross-page rules: duplicate titles/metas, orphan pages, and broken internal
// links. These operate on the whole scan, so the correctness that matters most
// is URL identity — deciding whether two spellings of a URL are the same page.
// Getting that wrong invents orphans that aren't orphaned and hides ones that
// are, so the identity edge cases carry their own tests below.

import { describe, expect, it } from 'vitest'
import { runCrossPageRules } from '../lib/foundation/reco/cross-page'
import type { PageSignals } from '../lib/foundation/reco/signals'

function page(url: string, over: Partial<PageSignals> = {}): PageSignals {
  return { url, internalTargets: [], ...over }
}

function ids(out: { ruleId: string }[]): string[] {
  return out.map((f) => f.ruleId).sort()
}

function find(out: ReturnType<typeof runCrossPageRules>, ruleId: string) {
  return out.find((f) => f.ruleId === ruleId)
}

describe('runCrossPageRules: duplicate titles and meta descriptions', () => {
  it('flags two pages sharing an identical title', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: 'Home | Acme' }),
      page('https://x.com/b', { title: 'Home | Acme' }),
    ])
    const dup = find(out, 'dup-title')
    expect(dup?.affectedUrls).toEqual(['https://x.com/a', 'https://x.com/b'])
    expect(dup?.issueScope).toBe('home | acme')
  })

  it('treats titles differing only in case and whitespace as duplicates', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: 'Home   |  Acme' }),
      page('https://x.com/b', { title: 'HOME | Acme' }),
    ])
    expect(find(out, 'dup-title')?.affectedUrls).toHaveLength(2)
  })

  it('does not flag a title that only one page uses', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: 'Alpha' }),
      page('https://x.com/b', { title: 'Beta' }),
    ])
    expect(find(out, 'dup-title')).toBeUndefined()
  })

  it('ignores missing and blank titles rather than grouping them as one duplicate set', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: '   ' }),
      page('https://x.com/b'),
      page('https://x.com/c', { title: '' }),
    ])
    expect(find(out, 'dup-title')).toBeUndefined()
  })

  it('flags duplicate meta descriptions independently of titles', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: 'Alpha', metaDescription: 'Shared blurb.' }),
      page('https://x.com/b', { title: 'Beta', metaDescription: 'Shared blurb.' }),
    ])
    expect(ids(out)).toContain('dup-meta')
    expect(find(out, 'dup-meta')?.affectedUrls).toHaveLength(2)
  })

  it('excludes canonical-duplicate variants so a variant is not reported as a duplicate of its own canonical', () => {
    const out = runCrossPageRules([
      page('https://x.com/a', { title: 'Shared' }),
      page('https://x.com/a?ref=nav', { title: 'Shared', duplicateOf: 'https://x.com/a' }),
    ])
    expect(find(out, 'dup-title')).toBeUndefined()
  })

  it('caps supporting elements at 10 while keeping every affected URL', () => {
    const pages = Array.from({ length: 14 }, (_, i) => page(`https://x.com/p${i}`, { title: 'Same' }))
    const dup = find(runCrossPageRules(pages), 'dup-title')
    expect(dup?.supportingElements).toHaveLength(10)
    expect(dup?.affectedUrls).toHaveLength(14)
  })
})

describe('runCrossPageRules: orphan pages', () => {
  it('flags a page no other page links to', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://x.com/a'] }),
      page('https://x.com/a'),
      page('https://x.com/lonely'),
    ])
    expect(find(out, 'orphan-pages')?.affectedUrls).toEqual(['https://x.com/lonely'])
  })

  it('never reports the homepage as an orphan', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://x.com/a'] }),
      page('https://x.com/a'),
    ])
    expect(find(out, 'orphan-pages')).toBeUndefined()
  })

  it('stays silent when the crawl captured no internal links at all — absence of link data is not evidence of orphans', () => {
    const out = runCrossPageRules([page('https://x.com/a'), page('https://x.com/b')])
    expect(find(out, 'orphan-pages')).toBeUndefined()
  })

  it('ignores a self-link: a page that only links to itself still has no inbound links', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://x.com/a'] }),
      page('https://x.com/a'),
      // Breadcrumbs, "you are here" nav, and paginators routinely emit a link
      // to the current URL. That is not an inbound link from anywhere else.
      page('https://x.com/lonely', { internalTargets: ['https://x.com/lonely'] }),
    ])
    expect(find(out, 'orphan-pages')?.affectedUrls).toEqual(['https://x.com/lonely'])
  })

  it('treats a self-link written with a trailing slash as the same page', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://x.com/a'] }),
      page('https://x.com/a'),
      page('https://x.com/lonely', { internalTargets: ['https://x.com/lonely/'] }),
    ])
    expect(find(out, 'orphan-pages')?.affectedUrls).toEqual(['https://x.com/lonely'])
  })

  it('counts an inbound link written on the www host as reaching the non-www page', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://www.x.com/a'] }),
      page('https://x.com/a'),
    ])
    expect(find(out, 'orphan-pages')).toBeUndefined()
  })

  it('counts an inbound link written over http as reaching the https page', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['http://x.com/a'] }),
      page('https://x.com/a'),
    ])
    expect(find(out, 'orphan-pages')).toBeUndefined()
  })

  it('counts an inbound link whose host differs only in letter case', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://X.com/a'] }),
      page('https://x.com/a'),
    ])
    expect(find(out, 'orphan-pages')).toBeUndefined()
  })

  it('keeps distinct paths distinct — a link to /ab does not rescue /a', () => {
    const out = runCrossPageRules([
      page('https://x.com/', { internalTargets: ['https://x.com/ab'] }),
      page('https://x.com/a'),
      page('https://x.com/ab'),
    ])
    expect(find(out, 'orphan-pages')?.affectedUrls).toEqual(['https://x.com/a'])
  })
})

describe('runCrossPageRules: broken internal links', () => {
  it('flags a link to a target the crawler read as a 404', () => {
    const out = runCrossPageRules(
      [page('https://x.com/', { internalTargets: ['https://x.com/gone'] })],
      [{ url: 'https://x.com/gone', status: 404 }],
    )
    const broken = find(out, 'broken-internal-links')
    expect(broken?.affectedUrls).toEqual(['https://x.com/'])
    expect(broken?.supportingElements?.[0]).toContain('HTTP 404')
  })

  it('does not count a WAF challenge or connection failure (status 0) as the site’s broken link', () => {
    const out = runCrossPageRules(
      [page('https://x.com/', { internalTargets: ['https://x.com/blocked'] })],
      [{ url: 'https://x.com/blocked', status: 0, reason: 'waf_challenge' }],
    )
    expect(find(out, 'broken-internal-links')).toBeUndefined()
  })

  it('stays silent when an error page exists but nothing links to it', () => {
    const out = runCrossPageRules(
      [page('https://x.com/', { internalTargets: ['https://x.com/a'] }), page('https://x.com/a')],
      [{ url: 'https://x.com/orphan-404', status: 404 }],
    )
    expect(find(out, 'broken-internal-links')).toBeUndefined()
  })

  it('matches a broken target across trailing-slash, scheme, and www spellings', () => {
    const out = runCrossPageRules(
      [page('https://x.com/', { internalTargets: ['http://www.x.com/gone/'] })],
      [{ url: 'https://x.com/gone', status: 500 }],
    )
    expect(find(out, 'broken-internal-links')?.affectedUrls).toEqual(['https://x.com/'])
  })

  it('ignores malformed blocked entries instead of throwing', () => {
    const out = runCrossPageRules(
      [page('https://x.com/', { internalTargets: ['https://x.com/gone'] })],
      [null, 'nope', { status: 404 }, { url: 'https://x.com/gone', status: 404 }],
    )
    expect(find(out, 'broken-internal-links')?.affectedUrls).toEqual(['https://x.com/'])
  })

  it('reports the source pages that link to a broken target, deduplicated and sorted', () => {
    const out = runCrossPageRules(
      [
        page('https://x.com/b', { internalTargets: ['https://x.com/gone', 'https://x.com/gone'] }),
        page('https://x.com/a', { internalTargets: ['https://x.com/gone'] }),
      ],
      [{ url: 'https://x.com/gone', status: 410 }],
    )
    expect(find(out, 'broken-internal-links')?.affectedUrls).toEqual(['https://x.com/a', 'https://x.com/b'])
  })
})
