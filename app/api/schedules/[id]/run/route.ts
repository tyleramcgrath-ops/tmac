// Run Now — enqueues a specific scheduled job and executes it immediately
// through the shared engine (real claim → run → history), returning the job and
// execution ids so the client can poll execution state. Viewer roles are
// rejected; cross-tenant jobs are not found.

import { getCurrentSession } from '@/lib/session'
import { idempotencyKey, type JobType } from '@/lib/scheduling/schedule'
import { claimAndStart, runClaimed } from '@/lib/scheduling/engine'
import { makeWorkerId } from '@/lib/scheduling/worker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'viewer') return Response.json({ error: 'Viewers cannot run jobs.' }, { status: 403 })

  const job = await prisma.scheduledJob.findUnique({ where: { id } })
  if (!job || job.organizationId !== session.organizationId) return Response.json({ error: 'Schedule not found.' }, { status: 404 })
  if (job.status === 'running') return Response.json({ error: 'This job is already running.', jobId: job.id, status: 'running' }, { status: 409 })

  const now = new Date()
  const window = now.toISOString().slice(0, 10)
  const key = idempotencyKey({ projectId: job.projectId, jobType: job.jobType as JobType, window })

  // Move it to queued (manual trigger) so the atomic claim can pick it up.
  await prisma.scheduledJob.update({
    where: { id: job.id },
    data: { status: 'queued', idempotencyKey: key, dataPeriod: window, triggerType: 'manual', failureReason: null, failureClass: null, updatedBy: session.userId },
  })

  // Claim + run this one job inline through the shared engine.
  const workerId = makeWorkerId(now)
  const start = await claimAndStart({ prisma, jobId: job.id, expectedStatus: 'queued', workerId, triggerType: 'manual', now: new Date() })
  if (!start) {
    // Another worker (e.g. the cron) grabbed it first — that's fine; it will run.
    const refreshed = await prisma.scheduledJob.findUnique({ where: { id: job.id }, select: { id: true, status: true } })
    return Response.json({ ok: true, jobId: job.id, executionId: null, status: refreshed?.status ?? 'queued', message: 'Job is being processed by the worker.' })
  }

  const item = await runClaimed({ prisma, job: start.job, execution: start.execution, workerId, now: new Date() })
  return Response.json({ ok: true, jobId: job.id, executionId: item.executionId, status: item.status, durationMs: item.durationMs, recordsProcessed: item.recordsProcessed, resultSummary: item.resultSummary, followUps: item.followUps })
}
