// Scheduler engine: turns recurring Schedules into Jobs and drains the job queue
// safely. Pure and time-injectable (every entry point takes `now`) so it is
// fully unit-testable without a real clock or a live crawl. See
// SCHEDULER_DESIGN.md for the model. The cron-triggered HTTP route (next
// increment) is a thin wrapper that calls `tick()`.

import { randomUUID } from 'crypto'
import type { FoundationStore } from '../store'
import type { Job, JobKind, Schedule } from '../types'

// ── Cron ─────────────────────────────────────────────────────────────────────

function parseField(field: string, min: number, max: number): (v: number) => boolean {
  if (field === '*') return () => true
  const allowed = new Set<number>()
  for (const part of field.split(',')) {
    let range = part
    let step = 1
    const slash = part.split('/')
    if (slash.length === 2) {
      range = slash[0]
      step = parseInt(slash[1], 10)
    }
    let lo: number
    let hi: number
    if (range === '*') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-').map(Number)
      lo = a
      hi = b
    } else {
      lo = hi = parseInt(range, 10)
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(step) || step < 1) {
      throw new Error(`Invalid cron field: "${field}"`)
    }
    for (let v = lo; v <= hi; v += step) if (v >= min && v <= max) allowed.add(v)
  }
  return (v) => allowed.has(v)
}

// Next time (UTC) strictly after `from` that matches the 5-field cron. Supports
// *, n, a-b, a,b, and */n. When both day-of-month and day-of-week are restricted
// the match is OR (standard cron semantics). Bounded search (8 days) — ample for
// hourly/daily/weekly schedules, which is all the product offers.
export function nextCronTime(cron: string, from: Date): Date {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) throw new Error(`Invalid cron (need 5 fields): "${cron}"`)
  const [mF, hF, domF, monF, dowF] = parts
  const mMatch = parseField(mF, 0, 59)
  const hMatch = parseField(hF, 0, 23)
  const domMatch = parseField(domF, 1, 31)
  const monMatch = parseField(monF, 1, 12)
  const dowMatch = parseField(dowF, 0, 6)
  const domR = domF !== '*'
  const dowR = dowF !== '*'

  let t = new Date(Math.floor(from.getTime() / 60000) * 60000 + 60000)
  for (let i = 0; i <= 8 * 1440; i++) {
    const mo = t.getUTCMonth() + 1
    const d = t.getUTCDate()
    const dow = t.getUTCDay()
    const h = t.getUTCHours()
    const mi = t.getUTCMinutes()
    const dayOk = domR && dowR ? domMatch(d) || dowMatch(dow) : domMatch(d) && dowMatch(dow)
    if (mMatch(mi) && hMatch(h) && dayOk && monMatch(mo)) return t
    t = new Date(t.getTime() + 60000)
  }
  throw new Error(`No cron match within 8 days for "${cron}"`)
}

// ── Job construction ─────────────────────────────────────────────────────────

export function makeJob(input: {
  orgId: string
  projectId: string
  kind: JobKind
  runAt: Date
  payload?: Record<string, unknown>
  maxAttempts?: number
  now: Date
}): Job {
  const iso = input.now.toISOString()
  return {
    id: randomUUID(),
    orgId: input.orgId,
    projectId: input.projectId,
    kind: input.kind,
    status: 'queued',
    runAt: input.runAt.toISOString(),
    payload: input.payload ?? {},
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    lockedAt: null,
    lockedBy: null,
    lastError: null,
    result: null,
    createdAt: iso,
    updatedAt: iso,
  }
}

// ── Engine ───────────────────────────────────────────────────────────────────

// Retry backoff (minutes) indexed by attempt number already made.
const BACKOFF_MIN = [1, 2, 5, 15, 30]
const LEASE_MS = 10 * 60 * 1000

export type JobHandler = (job: Job) => Promise<Record<string, unknown> | void>
export type Handlers = Partial<Record<JobKind, JobHandler>>

// Enqueue a Job for every schedule that is due, and roll its nextRunAt forward.
export async function materializeDueSchedules(store: FoundationStore, now: Date): Promise<number> {
  const due = await store.listDueSchedules(now.toISOString())
  for (const s of due) {
    await store.enqueueJob(makeJob({ orgId: s.orgId, projectId: s.projectId, kind: s.kind, runAt: now, now }))
    const next: Schedule = {
      ...s,
      lastRunAt: now.toISOString(),
      nextRunAt: nextCronTime(s.cron, now).toISOString(),
      updatedAt: now.toISOString(),
    }
    await store.upsertSchedule(next)
  }
  return due.length
}

// Claim due jobs and run each handler. Success → succeeded (+result). Failure →
// retry with backoff until maxAttempts, then failed (honest lastError).
export async function runDueJobs(
  store: FoundationStore,
  now: Date,
  runnerId: string,
  handlers: Handlers,
  limit = 10
): Promise<{ ran: number; succeeded: number; failed: number; retried: number }> {
  const claimed = await store.claimDueJobs(now.toISOString(), limit, runnerId)
  let succeeded = 0
  let failed = 0
  let retried = 0
  for (const job of claimed) {
    const handler = handlers[job.kind]
    try {
      if (!handler) throw new Error(`No handler registered for job kind "${job.kind}"`)
      const result = (await handler(job)) ?? null
      await store.updateJob({ ...job, status: 'succeeded', result, lockedAt: null, lockedBy: null, updatedAt: now.toISOString() })
      succeeded++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (job.attempts >= job.maxAttempts) {
        await store.updateJob({ ...job, status: 'failed', lastError: message, lockedAt: null, lockedBy: null, updatedAt: now.toISOString() })
        failed++
      } else {
        const backoff = BACKOFF_MIN[Math.min(job.attempts - 1, BACKOFF_MIN.length - 1)] ?? 30
        const runAt = new Date(now.getTime() + backoff * 60_000)
        await store.updateJob({ ...job, status: 'queued', lastError: message, runAt: runAt.toISOString(), lockedAt: null, lockedBy: null, updatedAt: now.toISOString() })
        retried++
      }
    }
  }
  return { ran: claimed.length, succeeded, failed, retried }
}

// One full scheduler pass: reap stale locks → materialize schedules → run jobs.
// The cron route calls exactly this.
export async function tick(
  store: FoundationStore,
  opts: { now: Date; runnerId: string; handlers: Handlers; limit?: number }
): Promise<{ reaped: number; materialized: number; ran: number; succeeded: number; failed: number; retried: number }> {
  const reaped = await store.requeueStaleJobs(new Date(opts.now.getTime() - LEASE_MS).toISOString())
  const materialized = await materializeDueSchedules(store, opts.now)
  const run = await runDueJobs(store, opts.now, opts.runnerId, opts.handlers, opts.limit)
  return { reaped, materialized, ...run }
}
