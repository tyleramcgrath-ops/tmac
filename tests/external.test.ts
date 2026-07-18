// Mission Atlas (Phase G) — external intelligence. Proves the connector
// architecture and, above all, the evidence-grading discipline: observed /
// imported / estimated / unavailable are NEVER blurred, and a disconnected or
// failing provider degrades gracefully instead of fabricating data. Covers the
// required matrix: mock, null (disconnected), errors, partial responses, rate
// limiting, and credential rotation.

import { describe, expect, it } from 'vitest'
import { NullAiSearchProvider, MockAiSearchProvider, type AiVisibility } from '../lib/foundation/external/providers/ai-search'
import { MockBacklinkProvider, NullBacklinkProvider, parseBacklinkCsv } from '../lib/foundation/external/providers/backlinks'
import { MockSearchConsoleProvider } from '../lib/foundation/external/providers/search-console'
import { computeOverlap } from '../lib/foundation/external/competitors'
import { detectRankingChanges, detectAiCitationChanges, significantChanges } from '../lib/foundation/external/change-detection'
import { generateBriefing } from '../lib/foundation/external/briefing'
import { assembleAtlas, disconnectedProviderSet } from '../lib/foundation/external/service'
import { buildExternalGraph } from '../lib/foundation/external/knowledge-graph'
import type { Competitor } from '../lib/foundation/types'
import type { PageSignals } from '../lib/foundation/reco/signals'

const NOW = '2026-07-17T06:00:00Z'

describe('connector architecture — graceful degradation', () => {
  it('a Null (disconnected) provider is unavailable, never fabricated', async () => {
    const p = new NullAiSearchProvider('chatgpt', 'chatgpt')
    expect(p.status().state).toBe('disconnected')
    const o = await p.probe()
    expect(o.ok).toBe(false)
    if (!o.ok) expect(o.reason).toBe('disconnected')
  })

  it('a connected mock returns observed data', async () => {
    const fixture: AiVisibility = { engine: 'perplexity', query: 'best crm', brandMentioned: true, entityMentions: ['CRM'], citationCount: 2, cited: true, competitorCitations: [] }
    const p = new MockAiSearchProvider('px', 'perplexity', { connected: true, credential: 'k' }, { 'best crm': fixture })
    const o = await p.probe('best crm')
    expect(o.ok).toBe(true)
    if (o.ok) { expect(o.grade).toBe('observed'); expect(o.data.cited).toBe(true) }
  })

  it('models error, rate-limit, and unauthorized failure modes', async () => {
    const err = new MockBacklinkProvider('s', 'semrush', { connected: true, credential: 'k', failMode: 'error' })
    expect((await err.fetchProfile('x.com')).ok).toBe(false)
    expect(err.status().state).toBe('error')

    const rl = new MockSearchConsoleProvider('gsc', { connected: true, credential: 'k', failMode: 'rate-limited' })
    const rlo = await rl.fetchReport('x.com')
    expect(rlo.ok).toBe(false)
    if (!rlo.ok) expect(rlo.reason).toBe('rate-limited')

    const unauth = new MockBacklinkProvider('a', 'ahrefs', { connected: true, credential: null })
    const uo = await unauth.fetchProfile('x.com')
    expect(uo.ok).toBe(false)
    if (!uo.ok) expect(uo.reason).toBe('unauthorized')
  })

  it('marks a partial response as partial', async () => {
    const profile = { totalBacklinks: 10, referringDomains: 8, links: [{ sourceDomain: 'a.com', targetUrl: 'x', anchor: 'y', authority: 30, firstSeen: null, nofollow: false }, { sourceDomain: 'b.com', targetUrl: 'x', anchor: 'z', authority: 20, firstSeen: null, nofollow: false }] }
    const p = new MockBacklinkProvider('s', 'semrush', { connected: true, credential: 'k', partial: true }, profile)
    const o = await p.fetchProfile('x.com')
    expect(o.ok).toBe(true)
    if (o.ok) { expect(o.partial).toBe(true); expect(o.data.links.length).toBe(1) }
  })

  it('credential rotation: unauthorized until the key is rotated in', async () => {
    const p = new MockBacklinkProvider('s', 'semrush', { connected: true, credential: null })
    expect((await p.fetchProfile('x.com')).ok).toBe(false) // stale/missing key
    p.rotate({ connected: true, credential: 'fresh-key' })
    expect(p.status().state).toBe('connected')
    expect((await p.fetchProfile('x.com')).ok).toBe(true) // now authorized
  })
})

describe('backlink manual import (imported, not observed)', () => {
  it('parses a vendor CSV into a profile', () => {
    const csv = [
      'Source url,Target url,Anchor,Domain authority,Nofollow',
      'https://blog.a.com/post,https://us.com/x,great tool,45,follow',
      'https://news.b.com/article,https://us.com/y,us,60,nofollow',
      ',,,,', // malformed row skipped
    ].join('\n')
    const profile = parseBacklinkCsv(csv)
    expect(profile.totalBacklinks).toBe(2)
    expect(profile.referringDomains).toBe(2)
    expect(profile.links[0].authority).toBe(45)
    expect(profile.links[1].nofollow).toBe(true)
  })
})

describe('competitor overlap grading', () => {
  const ours: PageSignals[] = [
    { url: 'https://us.com/pricing', title: 'CRM Pricing', schemaTypes: ['Product'] },
    { url: 'https://us.com/features', title: 'CRM Features', schemaTypes: [] },
  ] as unknown as PageSignals[]

  it('degrades EVERY dimension to unavailable when the competitor is not crawled', () => {
    const o = computeOverlap(ours, null, NOW)
    for (const dim of Object.values(o)) expect(dim.evidence.grade).toBe('unavailable')
    expect(o.topicOverlap.value).toBeNull()
    expect(o.authorityOverlap.evidence.note).toMatch(/backlink/i)
  })

  it('grades observed vs estimated vs unavailable correctly when both are crawled', () => {
    const theirs: PageSignals[] = [
      { url: 'https://rival.com/pricing', title: 'CRM Pricing Plans', schemaTypes: ['Product'] },
      { url: 'https://rival.com/features', title: 'CRM Features Tour', schemaTypes: ['Product'] },
    ] as unknown as PageSignals[]
    const o = computeOverlap(ours, theirs, NOW)
    expect(o.topicOverlap.evidence.grade).toBe('observed') // from crawls
    expect(o.entityOverlap.evidence.grade).toBe('observed')
    expect(o.businessOverlap.evidence.grade).toBe('estimated') // inferred
    expect(o.authorityOverlap.evidence.grade).toBe('unavailable') // needs backlinks
    expect(o.topicOverlap.value).toBeGreaterThan(0)
  })
})

describe('change detection — significant only', () => {
  it('detects a ranking drop past the threshold, ignores small moves', () => {
    const prev = { range: { from: '', to: 'd1' }, rows: [{ query: 'crm', page: '/', clicks: 1, impressions: 1, ctr: 0.1, position: 4 }, { query: 'saas', page: '/', clicks: 1, impressions: 1, ctr: 0.1, position: 10 }] }
    const next = { range: { from: '', to: 'd2' }, rows: [{ query: 'crm', page: '/', clicks: 1, impressions: 1, ctr: 0.1, position: 9 }, { query: 'saas', page: '/', clicks: 1, impressions: 1, ctr: 0.1, position: 11 }] }
    const changes = detectRankingChanges(prev, next, 3)
    expect(changes.map((c) => c.subject)).toContain('crm') // moved 5 places
    expect(changes.map((c) => c.subject)).not.toContain('saas') // moved 1 place
  })

  it('returns nothing when a prior snapshot is unavailable (cannot detect what you cannot observe)', () => {
    expect(detectRankingChanges(null, { range: { from: '', to: '' }, rows: [] })).toHaveLength(0)
  })

  it('detects gained/lost AI citations', () => {
    const prev: AiVisibility[] = [{ engine: 'chatgpt', query: 'best crm', brandMentioned: false, entityMentions: [], citationCount: 0, cited: false, competitorCitations: [] }]
    const next: AiVisibility[] = [{ engine: 'chatgpt', query: 'best crm', brandMentioned: true, entityMentions: [], citationCount: 1, cited: true, competitorCitations: [] }]
    const changes = significantChanges(detectAiCitationChanges(prev, next))
    expect(changes).toHaveLength(1)
    expect(changes[0].after).toBe('cited')
  })
})

describe('morning briefing — honest degradation', () => {
  it('says "no external data connected" and recommends connecting sources when disconnected', () => {
    const b = generateBriefing({ date: '2026-07-17', providers: [{ id: 'gsc', kind: 'search-console', state: 'disconnected', detail: '', lastCheckedAt: null }], changes: [], aiVisibility: null, competitorCount: 0 })
    expect(b.headline).toMatch(/no external data sources connected/i)
    expect(b.recommendedMission).toMatch(/connect/i)
    expect(b.confidence).toBe('unknown')
  })

  it('surfaces a competitor-cited-not-us threat from observed AI data', () => {
    const ai: AiVisibility[] = [{ engine: 'perplexity', query: 'best crm', brandMentioned: false, entityMentions: [], citationCount: 0, cited: false, competitorCitations: ['rival.com'] }]
    const b = generateBriefing({ date: '2026-07-17', providers: [{ id: 'px', kind: 'ai-search', state: 'connected', detail: '', lastCheckedAt: NOW }], changes: [], aiVisibility: ai, competitorCount: 1 })
    expect(b.newThreats.some((t) => /competitor cited/i.test(t.title))).toBe(true)
    expect(b.newThreats[0].evidence.grade).toBe('observed')
  })
})

describe('atlas assembly — disconnected by default in this environment', () => {
  const competitor: Competitor = { id: 'c1', projectId: 'p1', domain: 'rival.com', label: 'Rival', addedBy: 'u', createdAt: NOW }

  it('assembles a full snapshot with everything gracefully unavailable', async () => {
    const snap = await assembleAtlas({
      now: NOW,
      project: { domain: 'us.com', name: 'Us' },
      ourPages: [{ url: 'https://us.com/', title: 'Home' } as unknown as PageSignals],
      competitors: [competitor],
      providers: disconnectedProviderSet(),
    })
    expect(snap.aiVisibility.evidence.grade).toBe('unavailable')
    expect(snap.backlinks.evidence.grade).toBe('unavailable')
    expect(snap.gsc.evidence.grade).toBe('unavailable')
    expect(snap.analytics.evidence.grade).toBe('unavailable')
    // Provider statuses all disconnected.
    expect(snap.providers.every((p) => p.state === 'disconnected')).toBe(true)
    // Competitor present but overlap unavailable (no competitor crawl).
    expect(snap.competitors[0].overlap.topicOverlap.evidence.grade).toBe('unavailable')
    // Briefing degrades honestly.
    expect(snap.briefing.headline).toMatch(/no external data/i)
    // Grade tally has no observed data.
    expect(snap.grades.observed).toBe(0)
    expect(snap.grades.unavailable).toBeGreaterThan(0)
  })

  it('produces observed AI visibility when an engine is connected', async () => {
    const fixture: AiVisibility = { engine: 'chatgpt', query: 'best Us', brandMentioned: true, entityMentions: ['Us'], citationCount: 1, cited: true, competitorCitations: [] }
    const providers = disconnectedProviderSet()
    providers.aiSearch = [new MockAiSearchProvider('cg', 'chatgpt', { connected: true, credential: 'k' }, { 'best Us': fixture }, NOW)]
    const snap = await assembleAtlas({
      now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers,
    })
    expect(snap.aiVisibility.evidence.grade).toBe('observed')
    expect(snap.grades.observed).toBeGreaterThan(0)
  })
})

describe('external knowledge graph references evidence', () => {
  it('every node and edge carries an evidence grade', () => {
    const competitor: Competitor = { id: 'c1', projectId: 'p1', domain: 'rival.com', label: 'Rival', addedBy: 'u', createdAt: NOW }
    const overlap = computeOverlap([], null, NOW)
    const ai: AiVisibility[] = [{ engine: 'chatgpt', query: 'q', brandMentioned: true, entityMentions: ['CRM'], citationCount: 1, cited: true, competitorCitations: [] }]
    const g = buildExternalGraph('us.com', [{ competitor, overlap }], ai)
    expect(g.nodes.length).toBeGreaterThan(0)
    for (const n of g.nodes) expect(n.evidence.grade).toBeTruthy()
    for (const e of g.edges) expect(e.evidence.grade).toBeTruthy()
    // The competitor node is imported (a human added it).
    expect(g.nodes.find((n) => n.kind === 'competitor')?.evidence.grade).toBe('imported')
  })
})
