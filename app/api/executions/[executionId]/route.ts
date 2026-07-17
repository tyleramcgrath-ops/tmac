// Single execution detail — the full record of one job run, org-scoped.

import { getCurrentSession } from '@/lib/session'
import { shapeExecution } from '@/app/api/schedules/[id]/executions/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = await params

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const e = await prisma.jobExecution.findUnique({
    where: { id: executionId },
    include: { project: { select: { id: true, name: true, domain: true } } },
  })
  if (!e || e.organizationId !== session.organizationId) return Response.json({ error: 'Execution not found.' }, { status: 404 })

  // Fetch the parent job's current live state so the client can poll.
  const job = await prisma.scheduledJob.findUnique({ where: { id: e.scheduledJobId }, select: { id: true, status: true, retryCount: true, maxRetries: true, nextRunAt: true, failureReason: true, failureClass: true } })

  return Response.json({
    ok: true,
    execution: { ...shapeExecution(e), scheduledJobId: e.scheduledJobId, diagnostics: safeJson(e.diagnostics), project: e.project },
    job,
  })
}

function safeJson(s: string | null): unknown {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}
