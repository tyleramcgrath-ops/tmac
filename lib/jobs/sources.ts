import { parseSalary } from './salary'
import type { NormalizedJob } from './types'

// All three sources below are free, public, and require no API key — a good
// fit for a self-serve aggregator with zero setup. Each fetch is isolated so
// one dead API doesn't take down the others (see fetchAllJobs).

async function fetchRemotive(query: string): Promise<NormalizedJob[]> {
  const url = new URL('https://remotive.com/api/remote-jobs')
  if (query) url.searchParams.set('search', query)

  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`remotive: ${res.status}`)
  const data = await res.json()

  const jobs: Array<Record<string, unknown>> = data.jobs ?? []
  return jobs.map((job) => {
    const { min, max } = parseSalary(job.salary as string)
    return {
      id: `remotive-${job.id}`,
      source: 'remotive',
      title: String(job.title ?? ''),
      company: String(job.company_name ?? ''),
      location: String(job.candidate_required_location ?? 'Remote'),
      url: String(job.url ?? ''),
      tags: Array.isArray(job.tags) ? job.tags.map(String) : [],
      publishedAt: (job.publication_date as string) ?? null,
      salaryMin: min,
      salaryMax: max,
      salaryText: (job.salary as string) || null,
    }
  })
}

async function fetchArbeitnow(query: string): Promise<NormalizedJob[]> {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`arbeitnow: ${res.status}`)
  const data = await res.json()

  const jobs: Array<Record<string, unknown>> = data.data ?? []
  const needle = query.trim().toLowerCase()

  return jobs
    .filter((job) => {
      if (!needle) return true
      const haystack = `${job.title ?? ''} ${job.company_name ?? ''} ${(job.tags as string[] | undefined)?.join(' ') ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
    .map((job) => {
      const salaryText = job.salary_min || job.salary_max
        ? `${job.salary_min ?? ''}-${job.salary_max ?? ''}`
        : null
      return {
        id: `arbeitnow-${job.slug}`,
        source: 'arbeitnow',
        title: String(job.title ?? ''),
        company: String(job.company_name ?? ''),
        location: String(job.location ?? (job.remote ? 'Remote' : '')),
        url: String(job.url ?? ''),
        tags: Array.isArray(job.tags) ? job.tags.map(String) : [],
        publishedAt: job.created_at
          ? new Date(Number(job.created_at) * 1000).toISOString()
          : null,
        salaryMin: typeof job.salary_min === 'number' ? job.salary_min : null,
        salaryMax: typeof job.salary_max === 'number' ? job.salary_max : null,
        salaryText,
      }
    })
}

async function fetchRemoteOk(query: string): Promise<NormalizedJob[]> {
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': 'job-search-aggregator' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`remoteok: ${res.status}`)
  const data: Array<Record<string, unknown>> = await res.json()

  const needle = query.trim().toLowerCase()

  return data
    .filter((job) => job.id && job.position)
    .filter((job) => {
      if (!needle) return true
      const haystack = `${job.position ?? ''} ${job.company ?? ''} ${(job.tags as string[] | undefined)?.join(' ') ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
    .map((job) => {
      const min = typeof job.salary_min === 'number' ? job.salary_min : null
      const max = typeof job.salary_max === 'number' ? job.salary_max : null
      return {
        id: `remoteok-${job.id}`,
        source: 'remoteok',
        title: String(job.position ?? ''),
        company: String(job.company ?? ''),
        location: String(job.location ?? 'Remote'),
        url: String(job.url ?? job.apply_url ?? ''),
        tags: Array.isArray(job.tags) ? job.tags.map(String) : [],
        publishedAt: (job.date as string) ?? null,
        salaryMin: min,
        salaryMax: max,
        salaryText: min || max ? `${min ?? ''}-${max ?? ''}` : null,
      }
    })
}

export interface FetchAllResult {
  jobs: NormalizedJob[]
  errors: Array<{ source: string; message: string }>
}

export async function fetchAllJobs(query: string): Promise<FetchAllResult> {
  const sources = [
    { name: 'remotive', fn: fetchRemotive },
    { name: 'arbeitnow', fn: fetchArbeitnow },
    { name: 'remoteok', fn: fetchRemoteOk },
  ]

  const results = await Promise.allSettled(sources.map((s) => s.fn(query)))

  const jobs: NormalizedJob[] = []
  const errors: Array<{ source: string; message: string }> = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value)
    } else {
      errors.push({
        source: sources[i].name,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  })

  return { jobs, errors }
}
