// Pure aggregation of the outcome-measurement flywheel across a project's
// deployment history — the headline "did the fixes work?" number the
// per-deployment UI doesn't surface on its own. No fabrication: pending and
// skipped are counted separately from `measured`, never folded in.

import { describe, expect, it } from 'vitest'
import { summarizeOutcomes } from '../app/lib/outcome-summary'
import type { DeploymentDTO } from '../app/lib/client'

function dep(over: Partial<DeploymentDTO> = {}): DeploymentDTO {
  return {
    id: 'd1',
    postId: 1,
    postType: 'posts',
    postUrl: 'https://example.com/x',
    before: { title: 'A', metaDescription: '' },
    after: { title: 'B' },
    approvedBy: 'u',
    approvedAt: '2026-06-01T00:00:00Z',
    reason: 'test',
    status: 'verified',
    verification: null,
    result: 'Applied and verified.',
    createdAt: '2026-06-01T00:00:00Z',
    ...over,
  }
}

const captured = (clicks: number, position: number) =>
  dep({
    outcome: {
      capturedAt: '2026-06-15T00:00:00Z',
      skipped: false,
      before: { from: '2026-05-18', to: '2026-06-01', clicks: 10, impressions: 100, ctr: 0.1, position: 15 },
      after: { from: '2026-06-01', to: '2026-06-15', clicks: 10 + clicks, impressions: 100, ctr: 0.1, position: 15 + position },
      delta: { clicks, impressions: 0, ctr: 0, position },
    },
  })

describe('summarizeOutcomes', () => {
  it('reports nothing for a project with no eligible deployments', () => {
    expect(summarizeOutcomes([])).toEqual({ measured: 0, improvedClicks: 0, avgClicksDelta: 0, avgPositionDelta: 0, pending: 0, skipped: 0 })
    expect(summarizeOutcomes([dep({ status: 'failed' })]).measured).toBe(0)
  })

  it('counts only real captured deltas as measured, and averages correctly', () => {
    const s = summarizeOutcomes([captured(30, -5), captured(-10, 2), captured(0, 0)])
    expect(s.measured).toBe(3)
    expect(s.improvedClicks).toBe(1) // only the +30 one
    expect(s.avgClicksDelta).toBeCloseTo((30 - 10 + 0) / 3)
    expect(s.avgPositionDelta).toBeCloseTo((-5 + 2 + 0) / 3)
  })

  it('counts pending (verified, no outcome yet) separately from measured', () => {
    const s = summarizeOutcomes([captured(10, -1), dep({ id: 'd2' }) /* verified, no outcome */])
    expect(s.measured).toBe(1)
    expect(s.pending).toBe(1)
  })

  it('counts an honest skip separately — never treated as a negative outcome', () => {
    const s = summarizeOutcomes([
      dep({ outcome: { capturedAt: '2026-06-15T00:00:00Z', skipped: true, reason: 'disconnected: Google Search Console not connected.' } }),
    ])
    expect(s.measured).toBe(0)
    expect(s.skipped).toBe(1)
    expect(s.pending).toBe(0)
  })

  it('a rolled-back deployment that was measured before rollback still counts', () => {
    const s = summarizeOutcomes([{ ...captured(5, -1), status: 'rolled_back' }])
    expect(s.measured).toBe(1)
  })

  it('a failed/verify_failed deployment never counts toward pending — no outcome job was ever enqueued for it', () => {
    const s = summarizeOutcomes([dep({ status: 'failed' }), dep({ status: 'verify_failed' })])
    expect(s.measured).toBe(0)
    expect(s.pending).toBe(0)
    expect(s.skipped).toBe(0)
  })
})
