// Safe cancel — cancels a running/queued execution's parent job. "Safe" means we
// only ever transition a job that is genuinely in-flight, we mark the execution
// row cancelled (never delete history), and we release the lock so the job can
// be re-run. Viewer roles rejected.

import { getCurrentSession } from '@/lib/session'
import { computeNextRun, type Frequency } from '@/lib/scheduling/schedule'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = await params

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'viewer') return Response.json({ error: 'Viewers cannot cancel jobs.' }, { status: 403 })

  const e = await prisma.jobExecution.findUnique({ where: { id: executionId } })
  if (!e || e.organizationId !== session.organizationId) return Response.json({ error: 'Execution not found.' }, { status: 404 })

  if (e.status !== 'running') {
    return Response.json({ error: `Execution is ${e.status} — only running executions can be cancelled.`, status: e.status }, { status: 409 })
  }

  const now = new Date()
  // Mark the execution cancelled (history preserved).
  await prisma.jobExecution.update({
    where: { id: e.id },
    data: { status: 'cancelled', finishedAt: now, durationMs: e.startedAt ? now.getTime() - new Date(e.startedAt).getTime() : null, resultSummary: 'Cancelled by user.' },
  })

  // Release the parent job's lock and return it to a scheduled state.
  const job = await prisma.scheduledJob.findUnique({ where: { id: e.scheduledJobId } })
  if (job) {
    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: {
        status: 'scheduled', lockedAt: null, lockExpiresAt: null, lockOwner: null,
        nextRunAt: computeNextRun({ frequency: job.frequency as Frequency, from: now, preferredHour: job.preferredHour ?? 6, tzOffsetMinutes: job.tzOffsetMinutes ?? 0 }),
        updatedBy: session.userId,
      },
    })
  }

  return Response.json({ ok: true, executionId: e.id, status: 'cancelled', jobId: e.scheduledJobId })
}
