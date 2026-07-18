// Scheduler engine + job-queue store contract (file store). Time is injected
// everywhere, so these are deterministic with no real clock or live crawl.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { nextCronTime, makeJob, materializeDueSchedules, runDueJobs, tick } from '../lib/foundation/scheduler/engine'
import type { Job, Schedule } from '../lib/foundation/types'

let store: FileFoundationStore

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-sched-')))
})
afterEach(() => { /* temp dir left for the OS to reap */ })

const D = (iso: string) => new Date(iso)

function schedule(over: Partial<Schedule> = {}): Schedule {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: randomUUID(), orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan',
    cron: '0 6 * * *', enabled: true, nextRunAt: now, lastRunAt: null, createdAt: now, updatedAt: now,
    ...over,
  }
}

describe('nextCronTime', () => {
  it('daily at 06:00 UTC', () => {
    expect(nextCronTime('0 6 * * *', D('2026-01-01T05:00:00Z')).toISOString()).toBe('2026-01-01T06:00:00.000Z')
    expect(nextCronTime('0 6 * * *', D('2026-01-01T07:00:00Z')).toISOString()).toBe('2026-01-02T06:00:00.000Z')
  })
  it('weekly on Monday 06:00', () => {
    // 2026-01-01 is a Thursday; the next Monday is 2026-01-05.
    expect(nextCronTime('0 6 * * 1', D('2026-01-01T00:00:00Z')).toISOString()).toBe('2026-01-05T06:00:00.000Z')
  })
  it('hourly and step minutes', () => {
    expect(nextCronTime('0 * * * *', D('2026-01-01T05:30:00Z')).toISOString()).toBe('2026-01-01T06:00:00.000Z')
    expect(nextCronTime('*/15 * * * *', D('2026-01-01T05:07:00Z')).toISOString()).toBe('2026-01-01T05:15:00.000Z')
  })
  it('rejects malformed cron', () => {
    expect(() => nextCronTime('0 6 * *', D('2026-01-01T00:00:00Z'))).toThrow()
  })
})

describe('materializeDueSchedules', () => {
  it('enqueues one job per due schedule and rolls nextRunAt forward', async () => {
    await store.upsertSchedule(schedule({ nextRunAt: '2026-01-01T00:00:00Z' }))
    const n = await materializeDueSchedules(store, D('2026-01-01T06:05:00Z'))
    expect(n).toBe(1)
    const jobs = await store.listJobs('proj1')
    expect(jobs).toHaveLength(1)
    expect(jobs[0].kind).toBe('scheduled_scan')
    expect(jobs[0].status).toBe('queued')
    const s = await store.getSchedule('proj1', 'scheduled_scan')
    expect(s?.lastRunAt).toBe('2026-01-01T06:05:00.000Z')
    // next daily 06:00 after 06:05 is the following day
    expect(s?.nextRunAt).toBe('2026-01-02T06:00:00.000Z')
  })
  it('skips schedules that are disabled or not yet due', async () => {
    await store.upsertSchedule(schedule({ kind: 'monitor', enabled: false }))
    await store.upsertSchedule(schedule({ kind: 'outcome_capture', nextRunAt: '2026-06-01T00:00:00Z' }))
    expect(await materializeDueSchedules(store, D('2026-01-01T06:05:00Z'))).toBe(0)
    expect(await store.listJobs('proj1')).toHaveLength(0)
  })
})

describe('claimDueJobs (single-flight)', () => {
  it('hands each due job to exactly one caller and marks it running', async () => {
    const now = D('2026-01-01T06:00:00Z')
    for (let i = 0; i < 3; i++) {
      await store.enqueueJob(makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: now, now }))
    }
    const first = await store.claimDueJobs(now.toISOString(), 2, 'runnerA')
    const second = await store.claimDueJobs(now.toISOString(), 5, 'runnerB')
    expect(first).toHaveLength(2)
    expect(second).toHaveLength(1)
    const ids = new Set([...first, ...second].map((j) => j.id))
    expect(ids.size).toBe(3) // no overlap
    expect(first.every((j: Job) => j.status === 'running' && j.attempts === 1)).toBe(true)
  })
  it('does not claim jobs whose runAt is in the future', async () => {
    const now = D('2026-01-01T06:00:00Z')
    await store.enqueueJob(makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: D('2026-01-01T07:00:00Z'), now }))
    expect(await store.claimDueJobs(now.toISOString(), 10, 'r')).toHaveLength(0)
  })
})

describe('runDueJobs', () => {
  const now = D('2026-01-01T06:00:00Z')
  it('runs the handler and records success with its result', async () => {
    await store.enqueueJob(makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: now, now }))
    const out = await runDueJobs(store, now, 'r', { scheduled_scan: async () => ({ pages: 12 }) })
    expect(out).toMatchObject({ ran: 1, succeeded: 1, failed: 0, retried: 0 })
    const [job] = await store.listJobs('proj1')
    expect(job.status).toBe('succeeded')
    expect(job.result).toEqual({ pages: 12 })
  })
  it('retries with backoff before maxAttempts, then fails honestly', async () => {
    // maxAttempts 1: the first failure is terminal.
    await store.enqueueJob({ ...makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: now, now }), maxAttempts: 1 })
    const out = await runDueJobs(store, now, 'r', { scheduled_scan: async () => { throw new Error('crawl blocked') } })
    expect(out).toMatchObject({ failed: 1, retried: 0 })
    const [job] = await store.listJobs('proj1')
    expect(job.status).toBe('failed')
    expect(job.lastError).toBe('crawl blocked')
  })
  it('requeues (not fails) when attempts remain', async () => {
    await store.enqueueJob({ ...makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: now, now }), maxAttempts: 3 })
    const out = await runDueJobs(store, now, 'r', { scheduled_scan: async () => { throw new Error('transient') } })
    expect(out).toMatchObject({ retried: 1, failed: 0 })
    const [job] = await store.listJobs('proj1')
    expect(job.status).toBe('queued')
    expect(job.runAt).toBe('2026-01-01T06:01:00.000Z') // now + 1min backoff
  })
  it('fails a job whose kind has no handler', async () => {
    await store.enqueueJob(makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'monitor', runAt: now, now, maxAttempts: 1 } as never))
    const out = await runDueJobs(store, now, 'r', {})
    expect(out.failed).toBe(1)
  })
})

describe('tick (reaper + materialize + run)', () => {
  it('reaps a stale running job and re-runs it', async () => {
    const stale = makeJob({ orgId: 'org1', projectId: 'proj1', kind: 'scheduled_scan', runAt: D('2026-01-01T00:00:00Z'), now: D('2026-01-01T00:00:00Z') })
    // Simulate a runner that claimed it 20 min ago and died.
    await store.enqueueJob({ ...stale, status: 'running', lockedAt: '2026-01-01T05:40:00Z', lockedBy: 'dead', attempts: 1 })
    let ran = 0
    const out = await tick(store, { now: D('2026-01-01T06:00:00Z'), runnerId: 'r', handlers: { scheduled_scan: async () => { ran++ } } })
    expect(out.reaped).toBe(1)
    expect(ran).toBe(1)
    const [job] = await store.listJobs('proj1')
    expect(job.status).toBe('succeeded')
  })
})
