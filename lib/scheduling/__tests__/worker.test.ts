import { describe, it, expect } from 'vitest'
import {
  resolveBatchSize, DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE,
  makeWorkerId, leaseExpiry, lockRecoverable, LOCK_LEASE_MS,
  followUpsFor, FOLLOW_UP_CHAIN, MAX_CHAIN_DEPTH,
  sanitizeFailure,
} from '../worker'
import type { JobType } from '../schedule'

describe('resolveBatchSize', () => {
  it('defaults on missing/invalid input', () => {
    expect(resolveBatchSize(undefined)).toBe(DEFAULT_BATCH_SIZE)
    expect(resolveBatchSize('')).toBe(DEFAULT_BATCH_SIZE)
    expect(resolveBatchSize('abc')).toBe(DEFAULT_BATCH_SIZE)
    expect(resolveBatchSize('0')).toBe(DEFAULT_BATCH_SIZE)
    expect(resolveBatchSize('-4')).toBe(DEFAULT_BATCH_SIZE)
  })
  it('honors a valid value and caps at MAX', () => {
    expect(resolveBatchSize('3')).toBe(3)
    expect(resolveBatchSize('999')).toBe(MAX_BATCH_SIZE)
    expect(resolveBatchSize('7.9')).toBe(7)
  })
})

describe('worker identity & lease', () => {
  it('produces unique worker ids', () => {
    const a = makeWorkerId()
    const b = makeWorkerId()
    expect(a).not.toBe(b)
    expect(a.startsWith('w_')).toBe(true)
  })
  it('lease expiry is now + lease window', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(leaseExpiry(now).getTime()).toBe(now.getTime() + LOCK_LEASE_MS)
  })
  it('lock is recoverable when unset or expired, not when fresh', () => {
    const now = new Date('2026-01-01T00:10:00Z')
    expect(lockRecoverable(null, now)).toBe(true)
    expect(lockRecoverable(new Date('2026-01-01T00:00:00Z'), now)).toBe(true) // expired
    expect(lockRecoverable(new Date('2026-01-01T00:20:00Z'), now)).toBe(false) // still leased
  })
})

describe('follow-up chaining', () => {
  it('crawl and every source job chain into fusion', () => {
    for (const src of ['crawl', 'priority_rankings', 'full_rankings', 'gsc_sync', 'ga4_sync'] as JobType[]) {
      const ups = followUpsFor({ jobType: src, projectId: 'p1', window: '2026-01-01', depth: 0 })
      expect(ups.map((u) => u.jobType)).toContain('fusion')
    }
  })
  it('full chain converges to daily_mission and terminates', () => {
    // fusion → opportunities → portfolio_priority → daily_mission (terminal)
    expect(FOLLOW_UP_CHAIN.fusion).toEqual(['opportunities'])
    expect(FOLLOW_UP_CHAIN.opportunities).toEqual(['portfolio_priority'])
    expect(FOLLOW_UP_CHAIN.portfolio_priority).toEqual(['daily_mission'])
    expect(FOLLOW_UP_CHAIN.daily_mission).toBeUndefined()
  })
  it('carries an idempotency key scoped to project+jobType+window', () => {
    const ups = followUpsFor({ jobType: 'fusion', projectId: 'p1', window: 'w1', depth: 1 })
    expect(ups[0].idempotencyKey).toBe('p1:opportunities:w1')
    expect(ups[0].triggerType).toBe('chained')
    expect(ups[0].depth).toBe(2)
  })
  it('stops chaining at max depth (loop prevention)', () => {
    expect(followUpsFor({ jobType: 'crawl', projectId: 'p1', window: 'w', depth: MAX_CHAIN_DEPTH })).toEqual([])
    expect(followUpsFor({ jobType: 'crawl', projectId: 'p1', window: 'w', depth: MAX_CHAIN_DEPTH - 1 }).length).toBe(1)
  })
  it('walking the chain from crawl terminates within MAX_CHAIN_DEPTH', () => {
    let frontier: { jobType: JobType; depth: number }[] = [{ jobType: 'crawl', depth: 0 }]
    let guard = 0
    while (frontier.length && guard < 100) {
      guard++
      const nextFrontier: { jobType: JobType; depth: number }[] = []
      for (const f of frontier) {
        for (const u of followUpsFor({ jobType: f.jobType, projectId: 'p', window: 'w', depth: f.depth })) {
          nextFrontier.push({ jobType: u.jobType, depth: u.depth })
        }
      }
      frontier = nextFrontier
    }
    expect(guard).toBeLessThan(100) // did not loop forever
  })
})

describe('sanitizeFailure', () => {
  it('redacts bearer tokens', () => {
    const out = sanitizeFailure('Request failed: Authorization: Bearer ya29.aVeryLongSecretTokenValue123 denied')
    expect(out).not.toContain('ya29.aVeryLongSecretTokenValue123')
    expect(out.toLowerCase()).toContain('[redacted]')
  })
  it('redacts token-shaped secrets and key=value secrets', () => {
    expect(sanitizeFailure('oops ghp_abcdefgh12345678 leaked')).toContain('[redacted-token]')
    expect(sanitizeFailure('client_secret=supersecretvalue here')).toContain('[redacted]')
    expect(sanitizeFailure('client_secret=supersecretvalue here')).not.toContain('supersecretvalue')
  })
  it('truncates very long messages', () => {
    const out = sanitizeFailure('x'.repeat(1000))
    expect(out.length).toBeLessThanOrEqual(501)
  })
  it('leaves clean messages intact', () => {
    expect(sanitizeFailure('Google Search Console is not configured for this project.')).toBe(
      'Google Search Console is not configured for this project.',
    )
  })
})
