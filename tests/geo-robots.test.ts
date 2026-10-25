// Tests for the GEO audit's robots.txt matching and scoring.
//
// These assert against real robots.txt text and the standard's actual rules,
// not against a mock of the parser. Every case below is one a naive
// implementation gets wrong, and each would fail loudly if the logic regressed:
//   - a User-agent line after a rule starts a NEW group (line-by-line parsers
//     merge them and block everything)
//   - a named group beats the wildcard even when the wildcard is stricter
//     (the entire point of naming a bot)
//   - longest-match wins, and `Disallow:` with an empty value matches nothing
//   - an unreachable robots.txt is unknown, NOT allowed

import { describe, expect, it } from 'vitest'
import { crawlerVerdicts, parseRobots } from '../apps/north-star-hq/lib/foundation/geo/robots'
import { auditGeo, censusSchema, robotsUrlFor } from '../apps/north-star-hq/lib/foundation/geo/engine'

const verdict = (txt: string | null, bot: string) => crawlerVerdicts(txt).find((c) => c.bot === bot)!

describe('parseRobots group boundaries', () => {
  it('starts a new group when a User-agent line follows a rule', () => {
    const groups = parseRobots(['User-agent: *', 'Disallow: /admin', 'User-agent: GPTBot', 'Disallow: /'].join('\n'))
    expect(groups).toHaveLength(2)
    expect(groups[0].agents).toEqual(['*'])
    expect(groups[0].rules).toEqual([{ allow: false, path: '/admin' }])
    expect(groups[1].agents).toEqual(['gptbot'])
    expect(groups[1].rules).toEqual([{ allow: false, path: '/' }])
  })

  it('keeps consecutive User-agent lines in ONE group', () => {
    const groups = parseRobots(['User-agent: GPTBot', 'User-agent: ClaudeBot', 'Disallow: /'].join('\n'))
    expect(groups).toHaveLength(1)
    expect(groups[0].agents).toEqual(['gptbot', 'claudebot'])
  })

  it('ignores comments and blank lines without breaking groups', () => {
    const groups = parseRobots(['# hello', '', 'User-agent: *  # everyone', '', 'Disallow: /tmp # temp'].join('\n'))
    expect(groups).toHaveLength(1)
    expect(groups[0].rules).toEqual([{ allow: false, path: '/tmp' }])
  })

  it('drops rules that appear before any User-agent line', () => {
    expect(parseRobots('Disallow: /\nUser-agent: *\nAllow: /')).toHaveLength(1)
  })
})

describe('crawlerVerdicts', () => {
  it('blocks a bot named in its own group', () => {
    const v = verdict('User-agent: GPTBot\nDisallow: /', 'GPTBot')
    expect(v.access).toBe('blocked')
    expect(v.matchedRule).toBe('Disallow: /')
    expect(v.matchedGroup).toBe('GPTBot')
  })

  it('lets a named group override a stricter wildcard', () => {
    // The wildcard blocks everything; ClaudeBot is named and allowed. A parser
    // that applies the wildcard first reports ClaudeBot as blocked — wrong.
    const txt = ['User-agent: *', 'Disallow: /', '', 'User-agent: ClaudeBot', 'Disallow:'].join('\n')
    expect(verdict(txt, 'ClaudeBot').access).toBe('allowed')
    expect(verdict(txt, 'GPTBot').access).toBe('blocked')
    expect(verdict(txt, 'GPTBot').matchedGroup).toBe('*')
  })

  it('treats an empty Disallow as "nothing is disallowed"', () => {
    expect(verdict('User-agent: *\nDisallow:', 'PerplexityBot').access).toBe('allowed')
  })

  it('does not block the root for a rule on a subpath', () => {
    expect(verdict('User-agent: *\nDisallow: /wp-admin/', 'GPTBot').access).toBe('allowed')
  })

  it('lets Allow: / win over Disallow: / at equal length', () => {
    expect(verdict('User-agent: *\nDisallow: /\nAllow: /', 'GPTBot').access).toBe('allowed')
  })

  it('matches user-agent names case-insensitively', () => {
    expect(verdict('User-agent: gptbot\nDisallow: /', 'GPTBot').access).toBe('blocked')
  })

  it('reports a bot with no applicable group as unlisted, not allowed', () => {
    // Real distinction: "no rule mentions you and there is no wildcard" is a
    // different fact from "a rule permits you", and the UI says so.
    expect(verdict('User-agent: Googlebot\nDisallow: /private', 'GPTBot').access).toBe('unlisted')
  })

  it('treats a missing robots.txt as allowed — that is the standard default', () => {
    expect(crawlerVerdicts(null).every((c) => c.access === 'allowed')).toBe(true)
  })

  it('handles a realistic file that blocks AI crawlers but not search', () => {
    const txt = [
      'User-agent: *',
      'Disallow: /wp-admin/',
      'Allow: /wp-admin/admin-ajax.php',
      '',
      'User-agent: GPTBot',
      'User-agent: CCBot',
      'Disallow: /',
      '',
      'User-agent: Google-Extended',
      'Disallow: /',
      '',
      'Sitemap: https://example.com/sitemap.xml',
    ].join('\n')
    expect(verdict(txt, 'GPTBot').access).toBe('blocked')
    expect(verdict(txt, 'Google-Extended').access).toBe('blocked')
    expect(verdict(txt, 'ClaudeBot').access).toBe('allowed') // falls to wildcard, which only blocks /wp-admin/
    expect(verdict(txt, 'PerplexityBot').access).toBe('allowed')
  })
})

describe('censusSchema', () => {
  it('returns null when no page carries schema signals at all', () => {
    // Absent signal must stay unknown. Returning an empty census would score
    // the site 0% grounded on no evidence.
    expect(censusSchema([])).toBeNull()
    expect(censusSchema([{ url: 'https://a.test/' }])).toBeNull()
  })

  it('counts each type once per page and sorts by page count', () => {
    const census = censusSchema([
      { url: 'https://a.test/', schemaTypes: ['Organization', 'WebSite', 'WebSite'] },
      { url: 'https://a.test/b', schemaTypes: ['WebSite'] },
      { url: 'https://a.test/c', schemaTypes: [] },
    ])!
    expect(census.pagesAnalyzed).toBe(3)
    expect(census.pagesWithAnySchema).toBe(2)
    expect(census.types).toEqual([
      { type: 'WebSite', pages: 2 },
      { type: 'Organization', pages: 1 },
    ])
    expect(census.missingEntityTypes).toEqual(['LocalBusiness', 'Person'])
  })
})

describe('auditGeo', () => {
  const ok = (body: string) => async () => new Response(body, { status: 200 })
  const status = (code: number) => async () => new Response('', { status: code })

  it('scores access from real verdicts and states its formula', async () => {
    const audit = await auditGeo({
      domain: 'example.com',
      pages: [{ url: 'https://example.com/', schemaTypes: ['Organization'] }],
      now: 0,
      fetchImpl: ok('User-agent: GPTBot\nDisallow: /') as unknown as typeof fetch,
    })
    expect(audit.robots.status).toBe('found')
    // 10 crawlers checked, 1 blocked.
    expect(audit.scores.access).toBe(90)
    expect(audit.scores.grounding).toBe(100)
    expect(audit.scores.overall).toBe(95)
    expect(audit.findings.some((f) => f.id === 'crawler-blocked-GPTBot' && f.severity === 'critical')).toBe(true)
  })

  it('treats 404 as "no robots.txt" — a real answer, not a failure', async () => {
    const audit = await auditGeo({ domain: 'example.com', pages: [], now: 0, fetchImpl: status(404) as unknown as typeof fetch })
    expect(audit.robots.status).toBe('absent')
    expect(audit.scores.access).toBe(100)
  })

  it('scores an unreachable robots.txt as unknown, never as allowed', async () => {
    // The dangerous failure mode: a 500 collapsing into "all clear".
    const audit = await auditGeo({ domain: 'example.com', pages: [], now: 0, fetchImpl: status(503) as unknown as typeof fetch })
    expect(audit.robots.status).toBe('unreachable')
    expect(audit.crawlers).toEqual([])
    expect(audit.scores.access).toBeNull()
    expect(audit.findings.some((f) => f.id === 'robots-unreachable')).toBe(true)
  })

  it('leaves overall null when nothing at all could be observed', async () => {
    const audit = await auditGeo({ domain: 'example.com', pages: [], now: 0, fetchImpl: status(500) as unknown as typeof fetch })
    expect(audit.scores.overall).toBeNull()
  })

  it('refuses loopback and private hosts without making a request', async () => {
    let called = false
    const spy = (async () => {
      called = true
      return new Response('', { status: 200 })
    }) as unknown as typeof fetch
    for (const host of ['localhost', '127.0.0.1', '192.168.1.10', '169.254.169.254']) {
      const audit = await auditGeo({ domain: host, pages: [], now: 0, fetchImpl: spy })
      expect(audit.robots.status).toBe('unreachable')
    }
    expect(called).toBe(false)
  })

  it('builds the robots URL from a domain however it was entered', () => {
    expect(robotsUrlFor('example.com')).toBe('https://example.com/robots.txt')
    expect(robotsUrlFor('https://example.com/')).toBe('https://example.com/robots.txt')
    expect(robotsUrlFor(' http://example.com/some/path ')).toBe('https://example.com/robots.txt')
  })
})
