'use client'

import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NormalizedJob } from '@/lib/jobs/types'

interface SearchResponse {
  ok: boolean
  count: number
  jobs: NormalizedJob[]
  errors: Array<{ source: string; message: string }>
}

function formatSalary(job: NormalizedJob) {
  if (job.salaryMin === null && job.salaryMax === null) return null
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`
  if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMin !== job.salaryMax) {
    return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
  }
  return fmt(job.salaryMax ?? job.salaryMin ?? 0)
}

export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [currentSalary, setCurrentSalary] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const minSalary = currentSalary.trim() ? Number(currentSalary) : null

  const runSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (location.trim()) params.set('location', location.trim())
      if (minSalary && Number.isFinite(minSalary)) {
        params.set('minSalary', String(minSalary))
      }

      const res = await fetch(`/api/jobs/search?${params.toString()}`)
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data: SearchResponse = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [query, location, minSalary])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Job Search Aggregator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Searches Remotive, Arbeitnow, and RemoteOK at once, and sorts results by pay so
            the highest-paying matches show up first. Set your current salary below to only
            see jobs that would be a raise.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            runSearch()
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q">Role / keywords</Label>
            <Input
              id="q"
              placeholder="e.g. product manager"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. remote, New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentSalary">Only show jobs paying more than</Label>
            <Input
              id="currentSalary"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 90000"
              value={currentSalary}
              onChange={(e) => setCurrentSalary(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search jobs'}
            </Button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {result.count} job{result.count === 1 ? '' : 's'} found
                {minSalary ? ` paying more than $${minSalary.toLocaleString()}` : ''}
              </p>
              {result.errors.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Couldn&apos;t reach: {result.errors.map((e) => e.source).join(', ')}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {result.jobs.map((job) => {
                const salary = formatSalary(job)
                return (
                  <li
                    key={job.id}
                    className="rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium hover:underline"
                        >
                          {job.title}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          {job.company} · {job.location || 'Location not listed'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {salary && (
                          <Badge variant="secondary" className="font-mono">
                            {salary}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {job.source}
                        </Badge>
                      </div>
                    </div>
                    {job.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.tags.slice(0, 8).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {result.jobs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No jobs matched. Try widening your salary bar or clearing the location filter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
