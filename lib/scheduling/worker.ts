// Pure worker-core logic — everything the cron/worker needs to *decide* that
// doesn't touch the database: worker identity, lock lease math, follow-up job
// chaining (with loop prevention), and execution-report shaping. Kept free of
// Prisma so it's fully unit-testable. The DB claim + handler dispatch live in
// the API route; this module never performs I/O.

import type { JobType, JobStatus } from './schedule'
import { idempotencyKey } from './schedule'

// Bump when the worker's behavior changes in a way worth recording per run.
export const WORKER_VERSION = '1.0.0'

// How long a claimed job's lease is valid before another worker may recover it.
// Generous enough to cover a slow handler, short enough that a crashed worker's
// jobs come back within one or two cron ticks.
export const LOCK_LEASE_MS = 10 * 60 * 1000 // 10 minutes

// Conservative default batch size so a single cron tick can't stampede the DB
// or exhaust the function's wall-clock budget. Overridable via JOB_BATCH_SIZE.
export const DEFAULT_BATCH_SIZE = 5
export const MAX_BATCH_SIZE = 25

export function resolveBatchSize(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : NaN
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_BATCH_SIZE
  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(n)))
}

export type TriggerType = 'scheduled' | 'manual' | 'chained' | 'retry' | 'system'

/**
 * A per-worker identity used as the lock owner. Only this owner may release or
 * complete a lock it holds. Includes a random suffix so two invocations of the
 * same deployment don't collide.
 */
export function makeWorkerId(now: Date = new Date()): string {
  const region = process.env.VERCEL_REGION || process.env.AWS_REGION || 'local'
  const rand = Math.random().toString(36).slice(2, 10)
  return `w_${region}_${now.getTime().toString(36)}_${rand}`
}

export function leaseExpiry(now: Date, leaseMs: number = LOCK_LEASE_MS): Date {
  return new Date(now.getTime() + leaseMs)
}

/** A lock is recoverable when it is unset, or its lease has expired. */
export function lockRecoverable(lockExpiresAt: Date | null | undefined, now: Date): boolean {
  return !lockExpiresAt || lockExpiresAt.getTime() <= now.getTime()
}

// ── Follow-up chaining ──────────────────────────────────────────────────────
// After a job completes successfully, it can enqueue downstream jobs. The chain
// is a DAG converging on measurement so it always terminates; FOLLOW_UP_CHAIN
// encodes the edges. Loop prevention is enforced two ways: (1) the graph itself
// has no cycles, and (2) a follow-up carries the originating job's chain depth,
// and we refuse to chain past MAX_CHAIN_DEPTH.

export const MAX_CHAIN_DEPTH = 6

export const FOLLOW_UP_CHAIN: Partial<Record<JobType, JobType[]>> = {
  crawl: ['fusion'],
  priority_rankings: ['fusion'],
  full_rankings: ['fusion'],
  gsc_sync: ['fusion'],
  ga4_sync: ['fusion'],
  fusion: ['opportunities'],
  opportunities: ['portfolio_priority'],
  portfolio_priority: ['daily_mission'],
  deployment_verification: ['fusion'],
  // daily_mission, morning_briefing, weekly_summary are terminal (no chain).
}

export interface FollowUp {
  jobType: JobType
  idempotencyKey: string
  triggerType: TriggerType
  depth: number
}

/**
 * Given a job that just completed, returns the follow-up jobs to enqueue.
 * `window` scopes the idempotency key so re-running the same source within the
 * same window won't spawn duplicate downstream work. Returns [] at max depth.
 */
export function followUpsFor(opts: {
  jobType: JobType
  projectId: string
  window: string
  depth: number
}): FollowUp[] {
  const { jobType, projectId, window, depth } = opts
  if (depth >= MAX_CHAIN_DEPTH) return []
  const next = FOLLOW_UP_CHAIN[jobType] ?? []
  return next.map((t) => ({
    jobType: t,
    idempotencyKey: idempotencyKey({ projectId, jobType: t, window }),
    triggerType: 'chained' as TriggerType,
    depth: depth + 1,
  }))
}

// ── Handler result contract ─────────────────────────────────────────────────
// Every job handler returns this shape. The worker translates it into a
// ScheduledJob state transition + a JobExecution history row.

export type HandlerStatus = 'completed' | 'completed_with_warnings' | 'blocked'

export interface HandlerResult {
  status: HandlerStatus
  recordsProcessed: number
  dataPeriod: string | null
  resultSummary: string
  warnings: string[]
  // Set when status is 'blocked' — explains why (never a raw secret).
  failureClass?: 'waiting_for_configuration' | 'waiting_for_user_action'
  failureReason?: string
  // Optional diagnostics (sanitized) captured for the history row.
  diagnostics?: Record<string, unknown>
  // If the handler wants to override the default chain (rare), it can suppress
  // follow-ups by returning chain: 'none'.
  chain?: 'default' | 'none'
}

/** A handler either returns a HandlerResult, or throws — a throw is a failure. */
export type JobHandler = (ctx: HandlerContext) => Promise<HandlerResult>

export interface HandlerContext {
  prisma: any
  organizationId: string
  projectId: string
  project: { id: string; name: string; domain: string; wpSiteUrl?: string | null; status: string }
  jobType: JobType
  window: string
  now: Date
}

// ── Execution report shaping ────────────────────────────────────────────────
// The cron endpoint returns a structured report of everything it did in a tick.

export interface ExecutionReportItem {
  executionId: string
  scheduledJobId: string
  projectId: string
  jobType: JobType
  triggerType: TriggerType
  attempt: number
  status: JobStatus
  durationMs: number
  recordsProcessed: number | null
  resultSummary: string | null
  followUps: string[]
}

export interface ExecutionReport {
  ok: boolean
  workerId: string
  workerVersion: string
  startedAt: string
  finishedAt: string
  claimed: number
  processed: number
  succeeded: number
  warned: number
  blocked: number
  failed: number
  retried: number
  items: ExecutionReportItem[]
}

/**
 * Sanitizes a failure message for storage/return — strips anything that looks
 * like a token, key, password, or bearer credential so secrets never reach the
 * execution history or the API response.
 */
export function sanitizeFailure(message: string): string {
  let s = message.length > 500 ? message.slice(0, 500) + '…' : message
  s = s
    .replace(/(authorization:\s*bearer\s+)[^\s'"]+/gi, '$1[redacted]')
    .replace(/\bbearer\s+[A-Za-z0-9._~+/-]{8,}=*/gi, 'bearer [redacted]')
    .replace(/\b(ya29|1\/\/|gho_|ghp_|sk-|AIza)[A-Za-z0-9._~+/-]{6,}/g, '[redacted-token]')
    .replace(/("?(?:access_?token|refresh_?token|client_?secret|password|api[_-]?key)"?\s*[:=]\s*)"?[^\s"',}]+"?/gi, '$1[redacted]')
  return s
}
