// Per-project automation schedule (RankForge scheduler).
//
// GET   — current schedules + recent job runs (member).
// PUT   — enable/update the recurring re-audit (admin). Frequency maps to a
//         cron; nextRunAt is materialized so the cron runner can query cheaply.
// DELETE— remove the schedule (admin).

import { randomUUID } from 'crypto'
import { assertSameOrigin, audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { nextCronTime } from '@/lib/foundation/scheduler/engine'
import type { JobKind, Schedule } from '@/lib/foundation/types'

// Schedule kinds a project can turn on from the UI. 'outcome_capture' is
// scheduler-internal (enqueued per-deployment, never user-configured) so it's
// deliberately excluded here.
const SUPPORTED_KINDS: JobKind[] = ['scheduled_scan', 'monitor']

export const runtime = 'nodejs'

// Product-supported cadences → cron (UTC). Kept small and honest: sub-daily
// cadence requires a Vercel plan whose cron fires more than once a day.
const FREQUENCY_CRON: Record<string, string> = {
  daily: '0 6 * * *',
  weekly: '0 6 * * 1',
}

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const [schedules, jobs] = await Promise.all([store.listSchedules(projectId), store.listJobs(projectId, 10)])
  return Response.json({ schedules, jobs })
})

export const PUT = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'schedule', 30)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const frequency = String(body.frequency ?? '')
  const cron = FREQUENCY_CRON[frequency]
  if (!cron) throw new HttpError(400, 'frequency must be "daily" or "weekly".')
  const enabled = body.enabled !== false
  const kindRaw = body.kind ? String(body.kind) : 'scheduled_scan'
  if (!SUPPORTED_KINDS.includes(kindRaw as JobKind)) throw new HttpError(400, `kind must be one of: ${SUPPORTED_KINDS.join(', ')}.`)
  const kind = kindRaw as JobKind

  const store = await getStore()
  const existing = await store.getSchedule(projectId, kind)
  const now = new Date()
  const schedule: Schedule = {
    id: existing?.id ?? randomUUID(),
    orgId: project.orgId,
    projectId,
    kind,
    cron,
    enabled,
    nextRunAt: nextCronTime(cron, now).toISOString(),
    lastRunAt: existing?.lastRunAt ?? null,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  }
  await store.upsertSchedule(schedule)
  await audit(project.orgId, user.id, 'schedule.set', projectId, `${kind}:${frequency}:${enabled ? 'on' : 'off'}`)
  return Response.json({ schedule })
})

export const DELETE = handled(async (request, { params }) => {
  assertSameOrigin(request)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const kindRaw = new URL(request.url).searchParams.get('kind') ?? 'scheduled_scan'
  if (!SUPPORTED_KINDS.includes(kindRaw as JobKind)) throw new HttpError(400, `kind must be one of: ${SUPPORTED_KINDS.join(', ')}.`)
  const kind = kindRaw as JobKind
  const store = await getStore()
  await store.deleteSchedule(projectId, kind)
  await audit(project.orgId, user.id, 'schedule.delete', projectId, kind)
  return Response.json({ ok: true })
})
