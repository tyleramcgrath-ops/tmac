export interface NormalizedJob {
  id: string
  source: 'remotive' | 'arbeitnow' | 'remoteok'
  title: string
  company: string
  location: string
  url: string
  tags: string[]
  publishedAt: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryText: string | null
}

export interface JobSearchParams {
  q: string
  location: string
  minSalary: number | null
  remoteOnly: boolean
}
