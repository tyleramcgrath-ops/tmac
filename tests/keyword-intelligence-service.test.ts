// The honesty contract for the Rankings keyword view: when Google is not
// connected, the endpoint must say WHY and return nothing — never an empty
// summary that reads like "this site ranks for zero keywords", and never a
// fabricated row. Each of Search Console and Analytics must fail on its own.

import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { assembleKeywordIntelligence } from '../lib/foundation/external/service'

function freshStore(): FileFoundationStore {
  return new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-kwintel-')))
}

const NOW = Date.parse('2026-08-09T00:00:00Z')

describe('assembleKeywordIntelligence — disconnected', () => {
  let store: FileFoundationStore
  beforeEach(() => { store = freshStore() })

  it('explains why the keyword corpus is missing instead of returning an empty one', async () => {
    const out = await assembleKeywordIntelligence(store, 'proj-1', { domain: 'example.com' }, NOW)
    expect(out.unavailable).toBeTruthy()
    expect(out.unavailable).toMatch(/search console/i)
    expect(out.keywords).toEqual([])
    // A null summary is the point: "0 keywords" would be a claim we can't make.
    expect(out.summary).toBeNull()
    expect(out.range).toBeNull()
  })

  it('never emits an analysis it has no rows to derive', async () => {
    const out = await assembleKeywordIntelligence(store, 'proj-1', { domain: 'example.com' }, NOW)
    expect(out.opportunities).toEqual([])
    expect(out.cannibalization).toEqual([])
    expect(out.lowCtr).toEqual([])
    expect(out.devices).toEqual([])
    expect(out.countries).toEqual([])
    expect(out.mobileGap).toBeNull()
  })

  it('reports the Analytics failure separately from the Search Console one', async () => {
    const out = await assembleKeywordIntelligence(store, 'proj-1', { domain: 'example.com' }, NOW)
    expect(out.analyticsUnavailable).toBeTruthy()
    expect(out.analyticsUnavailable).toMatch(/analytics/i)
    // Two distinct reasons, so the UI can prompt for the right one.
    expect(out.analyticsUnavailable).not.toBe(out.unavailable)
  })

  it('still reports how many keywords the project tracks, which needs no provider', async () => {
    await store.addTrackedKeyword({ id: 'k1', projectId: 'proj-1', keyword: 'crm software', createdAt: new Date(NOW).toISOString(), addedBy: 'u1' })
    await store.addTrackedKeyword({ id: 'k2', projectId: 'proj-1', keyword: 'best crm', createdAt: new Date(NOW).toISOString(), addedBy: 'u1' })
    const out = await assembleKeywordIntelligence(store, 'proj-1', { domain: 'example.com' }, NOW)
    expect(out.trackedKeywords).toBe(2)
  })

  it('scopes tracked keywords to the project asked for', async () => {
    await store.addTrackedKeyword({ id: 'k1', projectId: 'proj-1', keyword: 'ours', createdAt: new Date(NOW).toISOString(), addedBy: 'u1' })
    await store.addTrackedKeyword({ id: 'k2', projectId: 'proj-2', keyword: 'theirs', createdAt: new Date(NOW).toISOString(), addedBy: 'u1' })
    const out = await assembleKeywordIntelligence(store, 'proj-1', { domain: 'example.com' }, NOW)
    expect(out.trackedKeywords).toBe(1)
  })
})
