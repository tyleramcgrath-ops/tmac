// Daily command center data — the portfolio briefing + Portfolio Mission +
// time-aware priority buckets for /app/today.

import { getCurrentSession } from '@/lib/session'
import { computePortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'
import { buildTodayPlan, type AvailableTime } from '@/lib/today/mission'
import { scheduleHealth, dataFreshness, jobsRequiringAttention, decisionBlockers, measuringOutcomes, recentWins, type JobLite, type MeasurementLite } from '@/lib/dashboard/sections'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_TIMES: AvailableTime[] = ['15m', '30m', '1h', '2h', 'half_day', 'full_day']

export async function GET(request: Request) {
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const timeParam = url.searchParams.get('time') as AvailableTime | null
  const availableTime: AvailableTime = timeParam && VALID_TIMES.includes(timeParam) ? timeParam : '1h'

  const projects: ProjectWithData[] = await prisma.project.findMany({
    where: { organizationId: session.organizationId, status: 'active' },
    select: PORTFOLIO_PROJECT_SELECT,
  })

  const priorities = projects.map((p) => {
    const pr = computePortfolioPriority(signalsFromProject(p))
    return { ...pr, projectName: p.name, domain: p.domain }
  })

  const plan = buildTodayPlan(priorities, availableTime)

  // ── Portfolio-wide dashboard sections ──
  const now = new Date()
  const projectName = new Map(projects.map((p) => [p.id, p.name]))
  const jobRows: JobLite[] = await prisma.scheduledJob.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, projectId: true, jobType: true, status: true, enabled: true, lastSuccessAt: true, lastFailureAt: true, nextRunAt: true, failureReason: true, failureClass: true, retryCount: true, maxRetries: true },
  })
  const mwRows: MeasurementLite[] = await prisma.measurementWindow.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, projectId: true, page: true, keyword: true, changeType: true, status: true, confidence: true, reviewAt: true, updatedAt: true, notes: true },
    orderBy: { updatedAt: 'desc' }, take: 200,
  })

  // Data problems blocking decisions — deduped incidents across the portfolio.
  const jobsByProject = new Map<string, JobLite[]>()
  for (const j of jobRows) { const a = jobsByProject.get(j.projectId) ?? []; a.push(j); jobsByProject.set(j.projectId, a) }
  const dataProblems: any[] = []
  for (const [pid, jrs] of jobsByProject) {
    const fresh = dataFreshness(jrs, now)
    for (const inc of decisionBlockers(pid, jrs, fresh)) dataProblems.push({ ...inc, projectName: projectName.get(pid) ?? null })
  }
  dataProblems.sort((a, b) => ({ critical: 3, warning: 2, info: 1 } as any)[b.severity] - ({ critical: 3, warning: 2, info: 1 } as any)[a.severity])

  const attention = jobsRequiringAttention(jobRows).map((j) => ({ ...j, projectName: projectName.get(j.projectId) ?? null }))
  const measuring = measuringOutcomes(mwRows).map((m) => ({ ...m, projectName: projectName.get(m.projectId) ?? null }))
  const wins = recentWins(mwRows, 1, now).map((w) => ({ ...w, projectName: projectName.get(w.projectId) ?? null })) // "since yesterday"
  const health = scheduleHealth(jobRows)

  return Response.json({
    ok: true,
    generatedAt: now.toISOString(),
    ...plan,
    scheduleHealth: health,
    dataProblems,
    jobsRequiringAttention: attention,
    measuringResults: measuring,
    winsSinceYesterday: wins,
  })
}
