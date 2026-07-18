import { fetchAllJobs } from '@/lib/jobs/sources'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const q = (searchParams.get('q') ?? '').slice(0, 120)
  const location = (searchParams.get('location') ?? '').trim().toLowerCase()
  const minSalaryRaw = searchParams.get('minSalary')
  const minSalary = minSalaryRaw ? Number(minSalaryRaw) : null

  const { jobs, errors } = await fetchAllJobs(q)

  const filtered = jobs.filter((job) => {
    if (location && !job.location.toLowerCase().includes(location)) return false
    if (minSalary && Number.isFinite(minSalary)) {
      const best = job.salaryMax ?? job.salaryMin
      // Jobs with no posted salary are kept (most boards omit it) but sort
      // below anything with a confirmed number meeting the bar.
      if (best !== null && best < minSalary) return false
    }
    return true
  })

  filtered.sort((a, b) => {
    const aSalary = a.salaryMax ?? a.salaryMin ?? -1
    const bSalary = b.salaryMax ?? b.salaryMin ?? -1
    return bSalary - aSalary
  })

  return Response.json({
    ok: true,
    count: filtered.length,
    jobs: filtered.slice(0, 100),
    errors,
  })
}
