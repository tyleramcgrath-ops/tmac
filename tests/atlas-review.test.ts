// Phase G final-review tests: evidence-contract completeness, no-fabrication
// invariants, partial/stale handling, CSV adversarial safety, and the
// provider-neutral architectural boundary.

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { freshnessOf, unavailable, observed, imported, estimated } from '../lib/foundation/external/types'
import { parseBacklinkCsvDetailed } from '../lib/foundation/external/providers/backlinks'
import { assembleAtlas, disconnectedProviderSet } from '../lib/foundation/external/service'
import { MockBacklinkProvider } from '../lib/foundation/external/providers/backlinks'
import { MockSearchConsoleProvider } from '../lib/foundation/external/providers/search-console'
import type { PageSignals } from '../lib/foundation/reco/signals'

const NOW = '2026-07-17T06:00:00Z'
const NOW_MS = Date.parse(NOW)

describe('evidence contract — freshness is separate from grade', () => {
  it('freshnessOf: fresh within TTL, stale beyond, unknown without a timestamp', () => {
    expect(freshnessOf('2026-07-17T05:59:00Z', NOW_MS, 60 * 60 * 1000)).toBe('fresh')
    expect(freshnessOf('2026-07-10T06:00:00Z', NOW_MS, 60 * 60 * 1000)).toBe('stale')
    expect(freshnessOf(null, NOW_MS, 60 * 60 * 1000)).toBe('unknown')
    expect(freshnessOf('not-a-date', NOW_MS, 60 * 60 * 1000)).toBe('unknown')
  })

  it('a connected-but-partial observation is marked partial (observed != complete)', async () => {
    const providers = disconnectedProviderSet()
    providers.backlinks = new MockBacklinkProvider('s', 'semrush', { connected: true, credential: 'k', partial: true }, { totalBacklinks: 9, referringDomains: 5, links: [{ sourceDomain: 'a.com', targetUrl: 'x', anchor: 'y', authority: 1, firstSeen: null, nofollow: false }, { sourceDomain: 'b.com', targetUrl: 'x', anchor: 'z', authority: 2, firstSeen: null, nofollow: false }] }, NOW)
    const snap = await assembleAtlas({ now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers })
    expect(snap.backlinks.evidence.grade).toBe('observed')
    expect(snap.backlinks.evidence.partial).toBe(true) // completeness disclosed
    expect(snap.backlinks.evidence.freshness).toBe('fresh')
  })

  it('carries the applicable data window (dateRange) when the provider supplies one', async () => {
    const providers = disconnectedProviderSet()
    providers.searchConsole = new MockSearchConsoleProvider('gsc', { connected: true, credential: 'k' }, { range: { from: '2026-06-19', to: '2026-07-16' }, rows: [] }, NOW)
    const snap = await assembleAtlas({ now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers })
    expect(snap.gsc.evidence.grade).toBe('observed')
    expect(snap.gsc.evidence.dateRange).toEqual({ from: '2026-06-19', to: '2026-07-16' })
  })
})

describe('no fabrication — grades cannot be laundered', () => {
  it('unavailable is always null-value + grade unavailable', () => {
    const o = unavailable<number>('none', 'x')
    expect(o.value).toBeNull()
    expect(o.evidence.grade).toBe('unavailable')
    expect(o.confidence).toBe('unknown')
  })
  it('estimated stays estimated; imported stays imported; observed stays observed — never confused', () => {
    expect(estimated(0.5, 'inference', 'n').evidence.grade).toBe('estimated')
    expect(imported({ x: 1 }, 'semrush', NOW).evidence.grade).toBe('imported')
    expect(observed(1, 'gsc', NOW).evidence.grade).toBe('observed')
  })
  it('mock provider values cannot leak into the DEFAULT (disconnected) mode', async () => {
    const snap = await assembleAtlas({ now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers: disconnectedProviderSet() })
    for (const obs of [snap.aiVisibility, snap.backlinks, snap.gsc, snap.analytics, snap.trends]) {
      expect(obs.evidence.grade).toBe('unavailable')
      expect(obs.value).toBeNull()
    }
    expect(snap.grades.observed).toBe(0)
    expect(snap.grades.imported).toBe(0)
  })
})

describe('partial & stale states are distinct — never blurred', () => {
  it('one provider available, others unavailable', async () => {
    const providers = disconnectedProviderSet()
    providers.backlinks = new MockBacklinkProvider('s', 'semrush', { connected: true, credential: 'k' }, { totalBacklinks: 3, referringDomains: 3, links: [] }, NOW)
    const snap = await assembleAtlas({ now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers })
    expect(snap.backlinks.evidence.grade).toBe('observed')
    expect(snap.gsc.evidence.grade).toBe('unavailable')
    expect(snap.analytics.evidence.grade).toBe('unavailable')
    expect(snap.trends.evidence.grade).toBe('unavailable')
    expect(snap.aiVisibility.evidence.grade).toBe('unavailable')
  })

  it('an EMPTY successful result is observed-but-empty, NOT unavailable', async () => {
    const providers = disconnectedProviderSet()
    providers.searchConsole = new MockSearchConsoleProvider('gsc', { connected: true, credential: 'k' }, { range: { from: 'a', to: 'b' }, rows: [] }, NOW)
    const snap = await assembleAtlas({ now: NOW, project: { domain: 'us.com', name: 'Us' }, ourPages: [], competitors: [], providers })
    expect(snap.gsc.evidence.grade).toBe('observed') // connected + returned
    expect(snap.gsc.value).not.toBeNull()
    expect((snap.gsc.value as { rows: unknown[] }).rows).toHaveLength(0) // empty, but known
  })
})

describe('CSV import safety — adversarial input', () => {
  const header = 'Source url,Target url,Anchor,Domain authority,Nofollow'
  it('neutralizes spreadsheet formula injection in text fields', () => {
    const r = parseBacklinkCsvDetailed(`${header}\nhttps://a.com/p,https://us.com/x,=HYPERLINK("evil"),40,follow`)
    expect(r.profile.links[0].anchor.startsWith("'=")).toBe(true) // leading '=' neutralized
  })
  it('rejects rows whose source host is internal/private', () => {
    const r = parseBacklinkCsvDetailed(`${header}\nhttp://127.0.0.1/p,https://us.com/x,a,10,follow\nhttp://10.0.0.5/p,https://us.com/y,b,10,follow\nhttp://localhost/p,https://us.com/z,c,10,follow`)
    expect(r.imported).toBe(0)
    expect(r.rejectReasons['internal-host']).toBe(3)
  })
  it('skips invalid domains and empty sources', () => {
    const r = parseBacklinkCsvDetailed(`${header}\nnotadomain,https://us.com/x,a,10,follow\n,https://us.com/y,b,10,follow`)
    expect(r.imported).toBe(0)
    expect(r.rejected).toBeGreaterThanOrEqual(2)
  })
  it('de-duplicates identical rows (idempotent re-import)', () => {
    const row = 'https://blog.a.com/p,https://us.com/x,great,40,follow'
    const r = parseBacklinkCsvDetailed(`${header}\n${row}\n${row}\n${row}`)
    expect(r.imported).toBe(1)
    expect(r.rejectReasons['duplicate']).toBe(2)
  })
  it('strips control characters and truncates over-long fields', () => {
    const long = 'x'.repeat(5000)
    const r = parseBacklinkCsvDetailed(`${header}\nhttps://a.com/p,https://us.com/x,${long},40,follow`)
    expect(r.profile.links[0].anchor.length).toBeLessThanOrEqual(2049)
  })
  it('returns empty when the required source header is missing', () => {
    const r = parseBacklinkCsvDetailed('Foo,Bar\n1,2')
    expect(r.imported).toBe(0)
    expect(r.profile.links).toHaveLength(0)
  })
})

describe('provider-neutral boundary (§10, §6)', () => {
  const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8')
  const listTs = (dir: string) => readdirSync(path.join(process.cwd(), dir)).filter((f) => f.endsWith('.ts')).map((f) => `${dir}/${f}`)

  it('recommendation & strategy engines (reco/**, agents/**) do NOT import the external layer at all', () => {
    for (const f of [...listTs('lib/foundation/reco'), ...listTs('lib/foundation/agents')]) {
      expect(read(f), f).not.toMatch(/from ['"].*external/)
    }
  })

  it('external engine modules do NOT import a provider IMPLEMENTATION (only normalized contracts/types)', () => {
    for (const f of ['lib/foundation/external/briefing.ts', 'lib/foundation/external/change-detection.ts', 'lib/foundation/external/knowledge-graph.ts', 'lib/foundation/external/competitors.ts']) {
      const src = read(f)
      // No concrete Mock/Null provider classes, and no `import` (value) from providers/.
      expect(src, f).not.toMatch(/\b(Mock|Null)\w*Provider\b/)
      expect(src, f).not.toMatch(/^import\s+\{[^}]*\}\s+from\s+['"]\.\/providers/m) // value import from providers
    }
  })
})
