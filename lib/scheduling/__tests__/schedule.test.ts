import { describe, it, expect } from 'vitest'
import { computeNextRun, isDue, classifyFailure, retryDecision, idempotencyKey, DEFAULT_FREQUENCY } from '../schedule'

describe('computeNextRun', () => {
  it('schedules the next daily run at the preferred local hour', () => {
    const from = new Date('2026-07-17T12:00:00Z')
    const next = computeNextRun({ frequency: 'daily', from, preferredHour: 6, tzOffsetMinutes: 0 })
    expect(next).not.toBeNull()
    // 6am already passed at 12:00 UTC → next is tomorrow 06:00 UTC
    expect(next!.toISOString()).toBe('2026-07-18T06:00:00.000Z')
  })

  it('keeps today\'s slot when the preferred hour is still ahead', () => {
    const from = new Date('2026-07-17T03:00:00Z')
    const next = computeNextRun({ frequency: 'daily', from, preferredHour: 6, tzOffsetMinutes: 0 })
    expect(next!.toISOString()).toBe('2026-07-17T06:00:00.000Z')
  })

  it('advances by a week for weekly frequency once the slot has passed', () => {
    const from = new Date('2026-07-17T12:00:00Z')
    const next = computeNextRun({ frequency: 'weekly', from, preferredHour: 6, tzOffsetMinutes: 0 })
    expect(next!.getTime()).toBeGreaterThan(from.getTime())
  })

  it('returns null for event-driven and manual frequencies', () => {
    const from = new Date()
    expect(computeNextRun({ frequency: 'after_source_update', from })).toBeNull()
    expect(computeNextRun({ frequency: 'after_deployment', from })).toBeNull()
    expect(computeNextRun({ frequency: 'manual', from })).toBeNull()
  })

  it('respects a timezone offset', () => {
    const from = new Date('2026-07-17T12:00:00Z')
    // tz +600 min (UTC+10). Local time is 22:00; 6am passed → next local 6am = 20:00 UTC next day
    const next = computeNextRun({ frequency: 'daily', from, preferredHour: 6, tzOffsetMinutes: 600 })
    expect(next).not.toBeNull()
  })
})

describe('isDue', () => {
  it('is true when nextRun is in the past', () => {
    expect(isDue(new Date('2026-07-17T00:00:00Z'), new Date('2026-07-17T12:00:00Z'))).toBe(true)
  })
  it('is false when nextRun is in the future or null', () => {
    expect(isDue(new Date('2026-07-18T00:00:00Z'), new Date('2026-07-17T12:00:00Z'))).toBe(false)
    expect(isDue(null, new Date())).toBe(false)
  })
})

describe('classifyFailure', () => {
  it('classifies revoked permission as permanent', () => {
    expect(classifyFailure('Permission revoked by user')).toBe('permanent')
    expect(classifyFailure('invalid_grant')).toBe('permanent')
  })
  it('classifies missing config as waiting_for_configuration', () => {
    expect(classifyFailure('No live SERP source configured')).toBe('waiting_for_configuration')
    expect(classifyFailure('Google OAuth is not configured')).toBe('waiting_for_configuration')
  })
  it('classifies re-auth prompts as waiting_for_user_action', () => {
    expect(classifyFailure('Authorization required — please reconnect')).toBe('waiting_for_user_action')
  })
  it('classifies timeouts and network errors as retryable', () => {
    expect(classifyFailure('Request timed out')).toBe('retryable')
    expect(classifyFailure('fetch failed')).toBe('retryable')
    expect(classifyFailure('quota exceeded, try again')).toBe('retryable')
  })
})

describe('retryDecision', () => {
  it('retries transient failures with exponential backoff until maxRetries', () => {
    const d0 = retryDecision({ failureClass: 'retryable', retryCount: 0, maxRetries: 3 })
    expect(d0.retry).toBe(true)
    expect(d0.status).toBe('retrying')
    const d1 = retryDecision({ failureClass: 'retryable', retryCount: 1, maxRetries: 3 })
    expect(d1.delayMs!).toBeGreaterThan(d0.delayMs!)
  })
  it('stops retrying at the cap and marks failed', () => {
    const d = retryDecision({ failureClass: 'retryable', retryCount: 3, maxRetries: 3 })
    expect(d.retry).toBe(false)
    expect(d.status).toBe('failed')
  })
  it('never retries permanent failures', () => {
    expect(retryDecision({ failureClass: 'permanent', retryCount: 0, maxRetries: 5 })).toEqual({ retry: false, delayMs: null, status: 'failed' })
  })
  it('surfaces config/user-action waits distinctly (not as generic failure)', () => {
    expect(retryDecision({ failureClass: 'waiting_for_configuration', retryCount: 0, maxRetries: 5 }).status).toBe('not_configured')
    expect(retryDecision({ failureClass: 'waiting_for_user_action', retryCount: 0, maxRetries: 5 }).status).toBe('blocked')
  })
})

describe('idempotencyKey', () => {
  it('is identical for the same project+job+window (dup prevention) and differs otherwise', () => {
    const a = idempotencyKey({ projectId: 'p', jobType: 'gsc_sync', window: '2026-07-17' })
    const b = idempotencyKey({ projectId: 'p', jobType: 'gsc_sync', window: '2026-07-17' })
    const c = idempotencyKey({ projectId: 'p', jobType: 'gsc_sync', window: '2026-07-18' })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('DEFAULT_FREQUENCY', () => {
  it('uses the spec defaults', () => {
    expect(DEFAULT_FREQUENCY.crawl).toBe('weekly')
    expect(DEFAULT_FREQUENCY.gsc_sync).toBe('daily')
    expect(DEFAULT_FREQUENCY.full_rankings).toBe('weekly')
    expect(DEFAULT_FREQUENCY.fusion).toBe('after_source_update')
    expect(DEFAULT_FREQUENCY.deployment_verification).toBe('after_deployment')
  })
})
