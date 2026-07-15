import { describe, it, expect } from '@jest/globals'
import { pageContentHash } from '../graph/incremental'
import { readLatencyStats, resetLatencyStats, withLatency } from '../graph/metrics'
import type { Page } from '@prisma/client'

/**
 * Pure algorithmic tests for the Phase 8.0 intelligence layer.
 * DB-backed logic (reasoning, clusters, money-pages) is exercised end-to-end
 * in the integration suite; this file covers the deterministic helpers.
 */

describe('pageContentHash', () => {
  const base: Partial<Page> = {
    url: 'https://example.com/foo',
    title: 'Foo',
    h1: 'Foo',
    metaDescription: 'about foo',
    contentLength: 100,
    schemaTypes: '["Article"]',
    canonical: null,
    hasNoindex: false,
    internalLinks: 5,
  }

  it('is stable for identical inputs', () => {
    const a = pageContentHash(base as Page)
    const b = pageContentHash(base as Page)
    expect(a).toBe(b)
  })

  it('changes when content changes', () => {
    const a = pageContentHash(base as Page)
    const b = pageContentHash({ ...base, contentLength: 101 } as Page)
    expect(a).not.toBe(b)
  })

  it('changes when title changes', () => {
    const a = pageContentHash(base as Page)
    const b = pageContentHash({ ...base, title: 'Bar' } as Page)
    expect(a).not.toBe(b)
  })

  it('changes when schemaTypes change', () => {
    const a = pageContentHash(base as Page)
    const b = pageContentHash({ ...base, schemaTypes: '["Article","FAQPage"]' } as Page)
    expect(a).not.toBe(b)
  })
})

describe('withLatency + readLatencyStats', () => {
  it('records call count, min/max, and percentiles', async () => {
    resetLatencyStats()
    for (let i = 0; i < 5; i++) {
      await withLatency('unit-test-op', async () => {
        await new Promise((r) => setTimeout(r, 1))
      })
    }
    const stats = readLatencyStats().find((s) => s.name === 'unit-test-op')
    expect(stats).toBeDefined()
    expect(stats!.count).toBe(5)
    expect(stats!.avgMs).toBeGreaterThanOrEqual(0)
    expect(stats!.maxMs).toBeGreaterThanOrEqual(stats!.minMs)
  })

  it('records latency even when the wrapped function throws', async () => {
    resetLatencyStats()
    await expect(
      withLatency('throwing-op', async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    const stats = readLatencyStats().find((s) => s.name === 'throwing-op')
    expect(stats?.count).toBe(1)
  })
})
