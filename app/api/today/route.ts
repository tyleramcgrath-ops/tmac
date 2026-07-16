// Daily command center data — the portfolio briefing + Portfolio Mission +
// time-aware priority buckets for /app/today.

import { getCurrentSession } from '@/lib/session'
import { computePortfolioPriority } from '@/lib/portfolio/priority'
import { signalsFromProject, PORTFOLIO_PROJECT_SELECT, type ProjectWithData } from '@/lib/portfolio/signals'
import { buildTodayPlan, type AvailableTime } from '@/lib/today/mission'

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

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    ...plan,
  })
}
