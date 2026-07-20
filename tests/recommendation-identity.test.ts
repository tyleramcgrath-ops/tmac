// Stable cross-scan recommendation identity (Phase D.6 P1). Proves that a
// re-scan UPSERTS onto the same issue instead of minting new UUIDs: the human's
// triage (status) and history survive, the row id is stable, and only the
// analysed content is refreshed. Uses the real file store.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { generateRecommendationsFromScan, persistScanRecommendations } from '../lib/foundation/recommendations'
import { makeIssueId, mergeForUpsert } from '../lib/foundation/reco/identity'
import type { Recommendation, Scan } from '../lib/foundation/types'

process.env.APP_SECRET = 'reco-identity-secret'

let store: FileFoundationStore
beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-ident-')))
})
afterEach(() => {})

const PAGES = [
  { url: 'https://x.com/product/z', title: '', titleLength: 0, schemaTypes: ['Product'], https: true, indexable: true, metaDescriptionLength: 0, metaDescription: '' },
  { url: 'https://x.com/pricing', title: 'Pricing', titleLength: 7, schemaTypes: [], https: true, indexable: true, metaDescriptionLength: 120, metaDescription: 'p' },
]
function scanOf(id: string, pages: unknown[]): Scan {
  const now = new Date('2026-07-17').toISOString()
  return {
    id, projectId: 'p1', createdBy: 'u', createdAt: now, status: 'completed',
    startedAt: now, completedAt: now, error: null,
    summary: { pagesCrawled: pages.length, urlsDiscovered: pages.length, blockedCount: 0, siteScore: 0, critical: 0, warning: 0, info: 0 },
    pages, blocked: [],
  }
}

describe('makeIssueId (deterministic identity)', () => {
  it('is stable and rule+scope based, not random', () => {
    expect(makeIssueId('missing-title', 'site')).toBe('missing-title::site')
    expect(makeIssueId('missing-title', 'site')).toBe(makeIssueId('missing-title', 'site'))
    expect(makeIssueId('schema-missing', 'Add Product structured data')).toMatch(/^schema-missing::/)
    // whitespace collapse so trivial drift doesn't fork identity
    expect(makeIssueId('dup-title', '  a   b  ')).toBe('dup-title::a b')
  })
})

describe('mergeForUpsert (triage + history preserved, content refreshed)', () => {
  it('keeps id/issueId/status/createdAt/history; refreshes analysis', () => {
    const existing = {
      id: 'row-1', issueId: 'missing-title::site', status: 'rejected', createdAt: 'T0', ruleVersion: 1,
      history: [{ at: 'T0', by: 'u', from: 'open', to: 'rejected' }], confidence: 50,
    } as unknown as Recommendation
    const incoming = {
      id: 'row-NEW', issueId: 'missing-title::site', status: 'open', createdAt: 'T1', ruleVersion: 1,
      history: [], confidence: 92, scanId: 's2',
    } as unknown as Recommendation
    const merged = mergeForUpsert(existing, incoming)
    expect(merged.id).toBe('row-1') // stable row key
    expect(merged.status).toBe('rejected') // triage preserved, not reset
    expect(merged.createdAt).toBe('T0')
    expect(merged.history).toHaveLength(1)
    expect(merged.confidence).toBe(92) // analysis refreshed
    expect(merged.scanId).toBe('s2')
  })
  it('records a history entry when the rule version evolves', () => {
    const existing = { id: 'r', issueId: 'i', status: 'accepted', createdAt: 'T0', ruleVersion: 1, history: [] } as unknown as Recommendation
    const incoming = { id: 'r2', issueId: 'i', status: 'open', createdAt: 'T1', ruleVersion: 2, history: [] } as unknown as Recommendation
    const merged = mergeForUpsert(existing, incoming)
    expect(merged.history).toHaveLength(1)
    expect(merged.status).toBe('accepted')
  })

  it('regression: a verified fix re-detected in a LATER scan is marked regressed, not silently kept verified', () => {
    const existing = {
      id: 'r1', issueId: 'missing-title::site', status: 'verified', createdAt: 'T0', ruleVersion: 1,
      history: [{ at: 'T0', by: 'system', from: 'deployed', to: 'verified' }], scanId: 's1',
    } as unknown as Recommendation
    const incoming = {
      id: 'r-new', issueId: 'missing-title::site', status: 'open', createdAt: 'T2', ruleVersion: 1,
      history: [], scanId: 's2',
    } as unknown as Recommendation
    const merged = mergeForUpsert(existing, incoming)
    expect(merged.status).toBe('regressed')
    expect(merged.history.at(-1)).toEqual({ at: 'T2', by: 'system', from: 'verified', to: 'regressed' })
  })

  it('does NOT regress when the same scan produces the finding (no false regression within one scan)', () => {
    const existing = { id: 'r1', issueId: 'i', status: 'verified', createdAt: 'T0', ruleVersion: 1, history: [], scanId: 's1' } as unknown as Recommendation
    const incoming = { id: 'r-new', issueId: 'i', status: 'open', createdAt: 'T0', ruleVersion: 1, history: [], scanId: 's1' } as unknown as Recommendation
    const merged = mergeForUpsert(existing, incoming)
    expect(merged.status).toBe('verified')
  })

  it('does NOT regress a status other than verified (e.g. dismissed stays dismissed)', () => {
    const existing = { id: 'r1', issueId: 'i', status: 'dismissed', createdAt: 'T0', ruleVersion: 1, history: [], scanId: 's1' } as unknown as Recommendation
    const incoming = { id: 'r-new', issueId: 'i', status: 'open', createdAt: 'T1', ruleVersion: 1, history: [], scanId: 's2' } as unknown as Recommendation
    const merged = mergeForUpsert(existing, incoming)
    expect(merged.status).toBe('dismissed')
  })
})

describe('persistScanRecommendations (rescan upsert over the store)', () => {
  it('re-scanning preserves triage + history and never mints a new UUID for the same issue', async () => {
    // First scan → create.
    const scan1 = scanOf('s1', PAGES)
    await store.createScan(scan1)
    const gen1 = generateRecommendationsFromScan(scan1).recommendations
    const res1 = await persistScanRecommendations(store, 'p1', gen1)
    expect(res1.created).toBe(gen1.length)
    expect(res1.updated).toBe(0)

    // Human triages the missing-title issue as rejected.
    const stored = await store.listRecommendations('p1')
    const missing = stored.find((r) => r.ruleId === 'missing-title')!
    expect(missing).toBeTruthy()
    const originalId = missing.id
    const originalIssueId = missing.issueId
    missing.status = 'rejected'
    missing.history = [{ at: '2026-07-18T00:00:00Z', by: 'u', from: 'open', to: 'rejected' }]
    await store.updateRecommendation(missing)

    // Second scan (same site) → upsert, not re-insert.
    const scan2 = scanOf('s2', PAGES)
    await store.createScan(scan2)
    const gen2 = generateRecommendationsFromScan(scan2).recommendations
    // Identity is deterministic across independent engine runs.
    expect(gen2.find((r) => r.ruleId === 'missing-title')!.issueId).toBe(originalIssueId)
    const res2 = await persistScanRecommendations(store, 'p1', gen2)
    expect(res2.created).toBe(0) // nothing new — all issues already exist
    expect(res2.updated).toBe(gen2.length)

    const after = await store.listRecommendations('p1')
    // No duplicate rows for the same issue.
    const issueIds = after.map((r) => r.issueId)
    expect(new Set(issueIds).size).toBe(issueIds.length)
    // The rejected issue kept its id, status, and history — refreshed to scan 2.
    const missingAfter = after.find((r) => r.issueId === originalIssueId)!
    expect(missingAfter.id).toBe(originalId)
    expect(missingAfter.status).toBe('rejected') // NOT silently reset to 'open'
    expect(missingAfter.history).toHaveLength(1)
    expect(missingAfter.scanId).toBe('s2') // analysis re-pointed at the new scan
  })
})
