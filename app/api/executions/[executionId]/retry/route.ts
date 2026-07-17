// Retry — re-queue the parent scheduled job of a failed/blocked execution and
// run it immediately through the shared engine. Viewer roles rejected.

import { getCurrentSession } from '@/lib/session'
import { idempotencyKey, type JobType } from '@/lib/scheduling/schedule'
import { claimAndStart, runClaimed } from '@/lib/scheduling/engine'
import { makeWorkerId } from '@/lib/scheduling/worker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_request: Request, { params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = await params

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'viewer') return Response.json({ error: 'Viewers cannot retry jobs.' }, { status: 403 })

  const e = await prisma.jobExecution.findUnique({ where: { id: executionId }, select: { id: true, organizationId: true, scheduledJobId: true } })
  if (!e || e.organizationId !== session.organizationId) return Response.json({ error: 'Execution not found.' }, { status: 404 })

  const job = await prisma.scheduledJob.findUnique({ where: { id: e.scheduledJobId } })
  if (!job) return Response.json({ error: 'Schedule not found.' }, { status: 404 })
  if (job.status === 'running') return Response.json({ error: 'Job is already running.', jobId: job.id, status: 'running' }, { status: 409 })

  const now = new Date()
  const window = now.toISOString().slice(0, 10)
  const key = idempotencyKey({ projectId: job.projectId, jobType: job.jobType as JobType, window })

  await prisma.scheduledJob.update({
    where: { id: job.id },
    data: { status: 'queued', idempotencyKey: key, dataPeriod: window, retryCount: 0, triggerType: 'retry', failureReason: null, failureClass: null, updatedBy: session.userId },
  })

  const workerId = makeWorkerId(now)
  const start = await claimAndStart({ prisma, jobId: job.id, expectedStatus: 'queued', workerId, triggerType: 'retry', now: new Date() })
  if (!start) {
    const refreshed = await prisma.scheduledJob.findUnique({ where: { id: job.id }, select: { status: true } })
    return Response.json({ ok: true, jobId: job.id, executionId: null, status: refreshed?.status ?? 'queued', message: 'Job is being processed.' })
  }
  const item = await runClaimed({ prisma, job: start.job, execution: start.execution, workerId, now: new Date() })
  return Response.json({ ok: true, jobId: job.id, executionId: item.executionId, status: item.status, resultSummary: item.resultSummary })
}
