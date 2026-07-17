// Scheduling API — list schedules with freshness, ensure defaults exist, and
// act (run-now / pause / resume). Run-now creates a REAL queued job row (no
// fake spinner) and returns its id; a processor (see /api/cron/process) claims
// due/queued jobs with locking. No scheduled work runs inside this request.

import { getCurrentSession } from '@/lib/session'
import { DEFAULT_FREQUENCY, computeNextRun, idempotencyKey, type JobType, type Frequency } from '@/lib/scheduling/schedule'
import { ensureDefaultSchedules, ALL_JOB_TYPES } from '@/lib/scheduling/bootstrap'
import { classifyFreshness, type FreshnessSource } from '@/lib/freshness/policy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Map a job type to the freshness source it feeds (most share the name).
const JOB_TO_SOURCE: Partial<Record<JobType, FreshnessSource>> = {
  crawl: 'crawl', priority_rankings: 'priority_rankings', full_rankings: 'full_rankings',
  gsc_sync: 'gsc', ga4_sync: 'ga4', fusion: 'fusion', portfolio_priority: 'portfolio_priority',
  daily_mission: 'daily_mission', morning_briefing: 'morning_briefing', opportunities: 'opportunities',
  deployment_verification: 'deployment_verification',
}

async function requireProject(prisma: any, projectId: string, organizationId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, domain: true, organizationId: true } })
  if (!project || project.organizationId !== organizationId) return null
  return project
}

export async function GET(request: Request) {
  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const now = new Date()

  const where: any = { organizationId: session.organizationId }
  if (projectId) {
    const project = await requireProject(prisma, projectId, session.organizationId)
    if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 })
    where.projectId = projectId
  }

  const jobs = await prisma.scheduledJob.findMany({ where, orderBy: [{ status: 'asc' }, { nextRunAt: 'asc' }] })

  const withFreshness = jobs.map((j: any) => {
    const source = JOB_TO_SOURCE[j.jobType as JobType]
    const freshness = source
      ? classifyFreshness({ source, lastSuccessAt: j.lastSuccessAt, lastFailureAt: j.lastFailureAt, now, configured: j.status !== 'not_configured' })
      : null
    return {
      id: j.id, projectId: j.projectId, jobType: j.jobType, enabled: j.enabled, frequency: j.frequency,
      timezone: j.timezone, status: j.status, lastAttemptAt: j.lastAttemptAt, lastSuccessAt: j.lastSuccessAt,
      lastFailureAt: j.lastFailureAt, nextRunAt: j.nextRunAt, durationMs: j.durationMs, retryCount: j.retryCount,
      maxRetries: j.maxRetries, failureReason: j.failureReason, failureClass: j.failureClass,
      recordsProcessed: j.recordsProcessed, freshness,
    }
  })

  // Portfolio freshness summary.
  const summary = {
    total: withFreshness.length,
    running: withFreshness.filter((j: any) => j.status === 'running').length,
    failed: withFreshness.filter((j: any) => j.status === 'failed').length,
    retrying: withFreshness.filter((j: any) => j.status === 'retrying').length,
    paused: withFreshness.filter((j: any) => !j.enabled || j.status === 'paused').length,
    blocked: withFreshness.filter((j: any) => j.status === 'blocked' || j.status === 'not_configured').length,
    dueToday: withFreshness.filter((j: any) => j.nextRunAt && new Date(j.nextRunAt) <= new Date(now.getTime() + 24 * 3600 * 1000)).length,
    stale: withFreshness.filter((j: any) => j.freshness?.status === 'stale' || j.freshness?.status === 'failed').length,
  }

  return Response.json({ ok: true, generatedAt: now.toISOString(), summary, jobs: withFreshness })
}

export async function POST(request: Request) {
  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'viewer') return Response.json({ error: 'Viewers cannot modify schedules.' }, { status: 403 })

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { action, projectId } = body
  if (!projectId) return Response.json({ error: 'Missing projectId.' }, { status: 400 })

  const project = await requireProject(prisma, projectId, session.organizationId)
  if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 })

  const now = new Date()

  // ── ensure default schedules exist for the project ──
  if (action === 'ensure_defaults') {
    const ensured = await ensureDefaultSchedules({ prisma, organizationId: session.organizationId, projectId, createdBy: session.userId, now })
    return Response.json({ ok: true, ensured })
  }

  const jobType = body.jobType as JobType
  if (!jobType || !ALL_JOB_TYPES.includes(jobType)) return Response.json({ error: 'Invalid jobType.' }, { status: 400 })

  // ── run now — creates a REAL queued job (duplicate-prevented) ──
  if (action === 'run_now') {
    const existing = await prisma.scheduledJob.findUnique({ where: { projectId_jobType: { projectId, jobType } } })
    if (existing && (existing.status === 'running' || existing.status === 'queued')) {
      return Response.json({ error: 'This job is already queued or running (duplicate prevented).', jobId: existing.id, status: existing.status }, { status: 409 })
    }
    const window = now.toISOString().slice(0, 10)
    const job = await prisma.scheduledJob.upsert({
      where: { projectId_jobType: { projectId, jobType } },
      create: {
        organizationId: session.organizationId, projectId, jobType, frequency: DEFAULT_FREQUENCY[jobType],
        status: 'queued', idempotencyKey: idempotencyKey({ projectId, jobType, window }), dataPeriod: window,
        retryCount: 0, createdBy: session.userId, updatedBy: session.userId,
      },
      update: { status: 'queued', idempotencyKey: idempotencyKey({ projectId, jobType, window }), dataPeriod: window, retryCount: 0, failureReason: null, updatedBy: session.userId },
      select: { id: true, status: true },
    })
    return Response.json({ ok: true, jobId: job.id, status: 'queued', message: 'Job queued.' })
  }

  // ── pause / resume ──
  if (action === 'pause' || action === 'resume') {
    const job = await prisma.scheduledJob.update({
      where: { projectId_jobType: { projectId, jobType } },
      data: action === 'pause'
        ? { enabled: false, status: 'paused', updatedBy: session.userId }
        : { enabled: true, status: 'scheduled', nextRunAt: computeNextRun({ frequency: DEFAULT_FREQUENCY[jobType], from: now, preferredHour: 6 }), updatedBy: session.userId },
      select: { id: true, status: true, enabled: true },
    }).catch(() => null)
    if (!job) return Response.json({ error: 'Schedule not found — ensure defaults first.' }, { status: 404 })
    return Response.json({ ok: true, jobId: job.id, status: job.status, enabled: job.enabled })
  }

  // ── set frequency ──
  if (action === 'set_frequency') {
    const frequency = body.frequency as Frequency
    const job = await prisma.scheduledJob.update({
      where: { projectId_jobType: { projectId, jobType } },
      data: { frequency, nextRunAt: computeNextRun({ frequency, from: now, preferredHour: 6 }), updatedBy: session.userId },
      select: { id: true, frequency: true, nextRunAt: true },
    }).catch(() => null)
    if (!job) return Response.json({ error: 'Schedule not found — ensure defaults first.' }, { status: 404 })
    return Response.json({ ok: true, jobId: job.id, frequency: job.frequency, nextRunAt: job.nextRunAt })
  }

  return Response.json({ error: 'Unknown action.' }, { status: 400 })
}
