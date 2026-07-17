// Execution engine — the DB-facing worker that claims jobs atomically, runs the
// registered handler, writes an immutable JobExecution history row per run,
// updates the ScheduledJob's current state, enqueues follow-up jobs, and applies
// retry/backoff. Shared by the cron endpoint (batch) and Run Now (single job).
//
// Atomic claim: we compare-and-set on (id, status, lock guard) via updateMany.
// Only the worker whose updateMany returns count === 1 owns the job, so two
// concurrent workers can never execute the same job.

import type { JobType } from './schedule'
import { classifyFailure, retryDecision, computeNextRun, DEFAULT_FREQUENCY, type Frequency } from './schedule'
import {
  WORKER_VERSION, makeWorkerId, leaseExpiry, followUpsFor, sanitizeFailure,
  type TriggerType, type ExecutionReport, type ExecutionReportItem, type HandlerContext,
} from './worker'
import { getHandler } from './handlers'

const DAY = 24 * 3600 * 1000

/** Try to atomically claim a specific job for this worker. Returns the claimed
 * row (with a fresh JobExecution created) or null if another worker won it. */
export async function claimAndStart(opts: {
  prisma: any
  jobId: string
  expectedStatus: string
  workerId: string
  triggerType: TriggerType
  now: Date
}): Promise<{ job: any; execution: any } | null> {
  const { prisma, jobId, expectedStatus, workerId, triggerType, now } = opts
  const lease = leaseExpiry(now)

  // Compare-and-set: only matches if status is still what we read AND the lock
  // is free or expired. This is the atomic gate.
  const claim = await prisma.scheduledJob.updateMany({
    where: {
      id: jobId,
      status: expectedStatus,
      OR: [{ lockedAt: null }, { lockExpiresAt: { lte: now } }],
    },
    data: {
      status: 'running',
      lockedAt: now,
      lockExpiresAt: lease,
      lockOwner: workerId,
      lastAttemptAt: now,
      workerVersion: WORKER_VERSION,
      triggerType,
    },
  })
  if (claim.count !== 1) return null

  const job = await prisma.scheduledJob.findUnique({ where: { id: jobId } })
  if (!job || job.lockOwner !== workerId) return null

  const execution = await prisma.jobExecution.create({
    data: {
      organizationId: job.organizationId,
      projectId: job.projectId,
      scheduledJobId: job.id,
      jobType: job.jobType,
      triggerType,
      attempt: (job.retryCount ?? 0) + 1,
      idempotencyKey: job.idempotencyKey ?? null,
      workerVersion: WORKER_VERSION,
      lockOwner: workerId,
      queuedAt: job.updatedAt ?? null,
      startedAt: now,
      status: 'running',
      dataPeriod: job.dataPeriod ?? null,
    },
  })
  return { job, execution }
}

/** Enqueue a follow-up job (idempotent). Skips if an identical in-flight job
 * already exists with the same idempotency key. Returns the jobType if enqueued. */
async function enqueueFollowUp(opts: {
  prisma: any
  organizationId: string
  projectId: string
  jobType: JobType
  idempotencyKey: string
  now: Date
}): Promise<string | null> {
  const { prisma, organizationId, projectId, jobType, idempotencyKey, now } = opts
  // Don't chain into a job that is disabled/paused.
  const existing = await prisma.scheduledJob.findUnique({ where: { projectId_jobType: { projectId, jobType } } })
  if (existing && existing.enabled === false) return null
  // Loop/dup prevention: if it's already queued/running with the same key, skip.
  if (existing && (existing.status === 'queued' || existing.status === 'running') && existing.idempotencyKey === idempotencyKey) return null

  await prisma.scheduledJob.upsert({
    where: { projectId_jobType: { projectId, jobType } },
    create: {
      organizationId, projectId, jobType, frequency: DEFAULT_FREQUENCY[jobType],
      status: 'queued', idempotencyKey, triggerType: 'chained', createdBy: 'system', updatedBy: 'system',
      dataPeriod: idempotencyKey.split(':').pop() ?? null,
    },
    update: { status: 'queued', idempotencyKey, triggerType: 'chained', failureReason: null, updatedBy: 'system' },
  })
  return jobType
}

/** Run a job we've already claimed: execute the handler, write results to the
 * execution history + the ScheduledJob, and enqueue follow-ups. Never throws —
 * failures are captured and classified. Returns the report item. */
export async function runClaimed(opts: {
  prisma: any
  job: any
  execution: any
  workerId: string
  now: Date
}): Promise<ExecutionReportItem> {
  const { prisma, job, execution, workerId } = opts
  const now = new Date()
  const window = job.dataPeriod ?? now.toISOString().slice(0, 10)
  const jobType = job.jobType as JobType
  const started = execution.startedAt ? new Date(execution.startedAt).getTime() : now.getTime()

  const project = await prisma.project.findUnique({ where: { id: job.projectId }, select: { id: true, name: true, domain: true, wpSiteUrl: true, status: true } })

  const followUpsEnqueued: string[] = []
  let finalStatus = 'failed'
  let recordsProcessed: number | null = null
  let resultSummary: string | null = null

  // Guard: project must still be active.
  if (!project || project.status !== 'active') {
    const finishedAt = new Date()
    finalStatus = 'blocked'
    resultSummary = 'Project is not active (paused/archived/deleted).'
    await prisma.jobExecution.update({ where: { id: execution.id }, data: { status: 'blocked', finishedAt, durationMs: finishedAt.getTime() - started, resultSummary, failureClass: 'waiting_for_configuration', failureReason: resultSummary } })
    await releaseJob(prisma, job.id, workerId, { status: 'blocked', failureReason: resultSummary, failureClass: 'waiting_for_configuration', now: finishedAt })
    return reportItem(execution, job, finishedAt.getTime() - started, finalStatus, recordsProcessed, resultSummary, followUpsEnqueued)
  }

  const handler = getHandler(jobType)
  if (!handler) {
    const finishedAt = new Date()
    resultSummary = `No handler registered for job type ${jobType}.`
    await prisma.jobExecution.update({ where: { id: execution.id }, data: { status: 'failed', finishedAt, durationMs: finishedAt.getTime() - started, resultSummary, failureClass: 'permanent', failureReason: resultSummary } })
    await releaseJob(prisma, job.id, workerId, { status: 'failed', failureReason: resultSummary, failureClass: 'permanent', now: finishedAt })
    return reportItem(execution, job, finishedAt.getTime() - started, 'failed', null, resultSummary, followUpsEnqueued)
  }

  const ctx: HandlerContext = {
    prisma, organizationId: job.organizationId, projectId: job.projectId,
    project: { id: project.id, name: project.name, domain: project.domain, wpSiteUrl: project.wpSiteUrl, status: project.status },
    jobType, window, now,
  }

  try {
    const result = await handler(ctx)
    const finishedAt = new Date()
    recordsProcessed = result.recordsProcessed
    resultSummary = result.resultSummary
    finalStatus = result.status

    // Persist execution history (immutable record of this run).
    await prisma.jobExecution.update({
      where: { id: execution.id },
      data: {
        status: result.status, finishedAt, durationMs: finishedAt.getTime() - started,
        recordsProcessed: result.recordsProcessed, dataPeriod: result.dataPeriod ?? window,
        resultSummary: result.resultSummary, warnings: result.warnings.length ? JSON.stringify(result.warnings) : null,
        failureClass: result.failureClass ?? null, failureReason: result.failureReason ? sanitizeFailure(result.failureReason) : null,
        diagnostics: result.diagnostics ? JSON.stringify(result.diagnostics) : null,
      },
    })

    if (result.status === 'blocked') {
      await releaseJob(prisma, job.id, workerId, { status: 'blocked', failureReason: result.failureReason ?? 'Blocked.', failureClass: result.failureClass ?? 'waiting_for_configuration', now: finishedAt, durationMs: finishedAt.getTime() - started })
    } else {
      // Success (or success-with-warnings): update job to completed state and reset retries.
      await releaseJob(prisma, job.id, workerId, {
        status: result.status, now: finishedAt, durationMs: finishedAt.getTime() - started,
        recordsProcessed: result.recordsProcessed, dataPeriod: result.dataPeriod ?? window, success: true,
        nextRunAt: computeNextRun({ frequency: job.frequency as Frequency, from: finishedAt, preferredHour: job.preferredHour ?? 6, tzOffsetMinutes: job.tzOffsetMinutes ?? 0 }),
      })

      // Follow-up chaining (only on success), unless the handler suppressed it.
      if (result.chain !== 'none') {
        const ups = followUpsFor({ jobType, projectId: job.projectId, window, depth: 0 })
        const followUpRecords: Array<{ jobType: string; idempotencyKey: string }> = []
        for (const u of ups) {
          const enq = await enqueueFollowUp({ prisma, organizationId: job.organizationId, projectId: job.projectId, jobType: u.jobType, idempotencyKey: u.idempotencyKey, now: finishedAt })
          if (enq) { followUpsEnqueued.push(enq); followUpRecords.push({ jobType: u.jobType, idempotencyKey: u.idempotencyKey }) }
        }
        if (followUpRecords.length) await prisma.jobExecution.update({ where: { id: execution.id }, data: { followUpJobs: JSON.stringify(followUpRecords) } })
      }
    }

    return reportItem(execution, job, finishedAt.getTime() - started, finalStatus, recordsProcessed, resultSummary, followUpsEnqueued)
  } catch (err: any) {
    const finishedAt = new Date()
    const raw = err?.message ? String(err.message) : 'Unknown error'
    const safe = sanitizeFailure(raw)
    const failureClass = classifyFailure(raw)
    const decision = retryDecision({ failureClass, retryCount: job.retryCount ?? 0, maxRetries: job.maxRetries ?? 3 })

    await prisma.jobExecution.update({
      where: { id: execution.id },
      data: { status: decision.retry ? 'retrying' : 'failed', finishedAt, durationMs: finishedAt.getTime() - started, resultSummary: safe, failureClass, failureReason: safe },
    })

    if (decision.retry && decision.delayMs != null) {
      await releaseJob(prisma, job.id, workerId, {
        status: 'retrying', failureReason: safe, failureClass, now: finishedAt, durationMs: finishedAt.getTime() - started,
        incrementRetry: true, nextRunAt: new Date(finishedAt.getTime() + decision.delayMs),
      })
    } else {
      await releaseJob(prisma, job.id, workerId, { status: decision.status, failureReason: safe, failureClass, now: finishedAt, durationMs: finishedAt.getTime() - started })
    }
    return reportItem(execution, job, finishedAt.getTime() - started, decision.retry ? 'retrying' : decision.status, null, safe, followUpsEnqueued)
  }
}

/** Release the lock and set the job's terminal state. Only the lock owner may
 * release — enforced by the lockOwner guard in the WHERE. */
async function releaseJob(prisma: any, jobId: string, workerId: string, opts: {
  status: string
  now: Date
  failureReason?: string | null
  failureClass?: string | null
  durationMs?: number
  recordsProcessed?: number | null
  dataPeriod?: string | null
  nextRunAt?: Date | null
  success?: boolean
  incrementRetry?: boolean
}): Promise<void> {
  const data: any = {
    status: opts.status,
    lockedAt: null, lockExpiresAt: null, lockOwner: null,
    failureReason: opts.failureReason ?? null, failureClass: opts.failureClass ?? null,
    updatedBy: 'system',
  }
  if (opts.durationMs != null) data.durationMs = opts.durationMs
  if (opts.recordsProcessed !== undefined) data.recordsProcessed = opts.recordsProcessed
  if (opts.dataPeriod !== undefined) data.dataPeriod = opts.dataPeriod
  if (opts.nextRunAt !== undefined) data.nextRunAt = opts.nextRunAt
  if (opts.success) { data.lastSuccessAt = opts.now; data.retryCount = 0; data.failureReason = null; data.failureClass = null }
  else { data.lastFailureAt = opts.now }
  if (opts.incrementRetry) data.retryCount = { increment: 1 }

  await prisma.scheduledJob.updateMany({ where: { id: jobId, lockOwner: workerId }, data })
}

function reportItem(execution: any, job: any, durationMs: number, status: string, records: number | null, summary: string | null, followUps: string[]): ExecutionReportItem {
  return {
    executionId: execution.id, scheduledJobId: job.id, projectId: job.projectId, jobType: job.jobType,
    triggerType: execution.triggerType, attempt: execution.attempt, status: status as any,
    durationMs, recordsProcessed: records, resultSummary: summary, followUps,
  }
}

/** Recover jobs whose lease expired while marked running (crashed worker). */
export async function recoverExpiredLocks(prisma: any, now: Date): Promise<number> {
  const res = await prisma.scheduledJob.updateMany({
    where: { status: 'running', lockExpiresAt: { lte: now } },
    data: { status: 'retrying', lockedAt: null, lockExpiresAt: null, lockOwner: null, nextRunAt: now },
  })
  return res.count
}

/** Claim and run up to `batchSize` due jobs. Returns a structured report. */
export async function processBatch(opts: { prisma: any; batchSize: number; now?: Date; workerId?: string }): Promise<ExecutionReport> {
  const prisma = opts.prisma
  const now = opts.now ?? new Date()
  const workerId = opts.workerId ?? makeWorkerId(now)
  const startedAt = now.toISOString()

  // First, recover any crashed-worker locks so their jobs come back.
  await recoverExpiredLocks(prisma, now)

  // Candidate jobs: enabled, on an active project, and either queued, a due
  // retry, or a due scheduled run — with a free/expired lock.
  const candidates = await prisma.scheduledJob.findMany({
    where: {
      enabled: true,
      project: { status: 'active' },
      AND: [
        { OR: [
          { status: 'queued' },
          { status: 'retrying', nextRunAt: { lte: now } },
          { status: 'scheduled', nextRunAt: { lte: now } },
        ] },
        { OR: [{ lockedAt: null }, { lockExpiresAt: { lte: now } }] },
      ],
    },
    orderBy: [{ status: 'asc' }, { nextRunAt: 'asc' }],
    take: batchGuard(opts.batchSize) * 3, // over-fetch: some claims may lose the race
    select: { id: true, status: true },
  })

  const items: ExecutionReportItem[] = []
  let claimed = 0
  for (const c of candidates) {
    if (claimed >= opts.batchSize) break
    const triggerType: TriggerType = c.status === 'retrying' ? 'retry' : c.status === 'queued' ? 'manual' : 'scheduled'
    const start = await claimAndStart({ prisma, jobId: c.id, expectedStatus: c.status, workerId, triggerType, now: new Date() })
    if (!start) continue // lost the race — another worker claimed it
    claimed++
    const item = await runClaimed({ prisma, job: start.job, execution: start.execution, workerId, now: new Date() })
    items.push(item)
  }

  const finishedAt = new Date().toISOString()
  return {
    ok: true, workerId, workerVersion: WORKER_VERSION, startedAt, finishedAt,
    claimed, processed: items.length,
    succeeded: items.filter((i) => i.status === 'completed').length,
    warned: items.filter((i) => i.status === 'completed_with_warnings').length,
    blocked: items.filter((i) => i.status === 'blocked').length,
    failed: items.filter((i) => i.status === 'failed').length,
    retried: items.filter((i) => i.status === 'retrying').length,
    items,
  }
}

function batchGuard(n: number): number { return Math.max(1, Math.min(25, n)) }
