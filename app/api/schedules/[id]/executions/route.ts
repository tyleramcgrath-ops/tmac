// Execution history for a scheduled job — a list of immutable JobExecution rows,
// most recent first. Org-scoped; cross-tenant jobs are not found.

import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await prisma.scheduledJob.findUnique({ where: { id }, select: { id: true, organizationId: true, jobType: true, projectId: true } })
  if (!job || job.organizationId !== session.organizationId) return Response.json({ error: 'Schedule not found.' }, { status: 404 })

  const url = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))

  const executions = await prisma.jobExecution.findMany({
    where: { scheduledJobId: id },
    orderBy: { startedAt: 'desc' },
    take: limit,
    select: {
      id: true, jobType: true, triggerType: true, attempt: true, status: true,
      queuedAt: true, startedAt: true, finishedAt: true, durationMs: true,
      recordsProcessed: true, dataPeriod: true, resultSummary: true, warnings: true,
      failureClass: true, failureReason: true, followUpJobs: true, workerVersion: true,
    },
  })

  return Response.json({ ok: true, jobId: id, jobType: job.jobType, executions: executions.map(shapeExecution) })
}

export function shapeExecution(e: any) {
  return {
    id: e.id, jobType: e.jobType, triggerType: e.triggerType, attempt: e.attempt, status: e.status,
    queuedAt: e.queuedAt, startedAt: e.startedAt, finishedAt: e.finishedAt, durationMs: e.durationMs,
    recordsProcessed: e.recordsProcessed, dataPeriod: e.dataPeriod, resultSummary: e.resultSummary,
    warnings: parseJsonArray(e.warnings), failureClass: e.failureClass, failureReason: e.failureReason,
    followUpJobs: parseJsonArray(e.followUpJobs), workerVersion: e.workerVersion,
  }
}
function parseJsonArray(s: string | null): any[] {
  if (!s) return []
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] }
}
