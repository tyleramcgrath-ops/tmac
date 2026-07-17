// Bootstraps the 12 default ScheduledJob rows for a project. Called both from
// the schedules UI's explicit "Create default schedules" action AND
// automatically whenever a project is first created — so a brand-new project
// always has its automation initialized without a separate manual step, and
// /app/today + /app/projects/[id] never show a false "not configured" simply
// because nobody visited /app/schedules yet.

import { DEFAULT_FREQUENCY, computeNextRun, type JobType } from './schedule'

export const ALL_JOB_TYPES: JobType[] = [
  'crawl', 'priority_rankings', 'full_rankings', 'gsc_sync', 'ga4_sync',
  'fusion', 'portfolio_priority', 'daily_mission', 'morning_briefing',
  'opportunities', 'deployment_verification', 'weekly_summary',
]

export async function ensureDefaultSchedules(opts: {
  prisma: any
  organizationId: string
  projectId: string
  createdBy?: string
  now?: Date
}): Promise<number> {
  const { prisma, organizationId, projectId, createdBy, now = new Date() } = opts
  let ensured = 0
  for (const jobType of ALL_JOB_TYPES) {
    const frequency = DEFAULT_FREQUENCY[jobType]
    const nextRunAt = computeNextRun({ frequency, from: now, preferredHour: 6 })
    await prisma.scheduledJob.upsert({
      where: { projectId_jobType: { projectId, jobType } },
      create: { organizationId, projectId, jobType, frequency, nextRunAt, status: 'scheduled', createdBy: createdBy ?? 'system' },
      update: {}, // don't clobber an existing schedule
      select: { id: true },
    })
    ensured++
  }
  return ensured
}
