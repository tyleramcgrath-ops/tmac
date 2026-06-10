'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { Report } from '@/lib/types'
import { ProgressTracker } from '@/components/ProgressTracker'
import { ReportView } from '@/components/report/ReportView'

const POLL_MS = 2500

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [notFound, setNotFound] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${id}`, { cache: 'no-store' })
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      if (res.ok) {
        setReport(data.report)
        if (data.report.status === 'queued' || data.report.status === 'running') {
          timer.current = setTimeout(load, POLL_MS)
        }
      } else {
        timer.current = setTimeout(load, POLL_MS * 2)
      }
    } catch {
      timer.current = setTimeout(load, POLL_MS * 2)
    }
  }, [id])

  useEffect(() => {
    load()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [load])

  async function rerun() {
    const res = await fetch(`/api/reports/${id}/rerun`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      router.push(`/reports/${data.id}`)
      setReport(null)
      setTimeout(load, 500)
    }
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="section-title">Report not found</h1>
        <p className="mb-4 text-sm text-slate-500">It may have been deleted.</p>
        <Link href="/" className="btn-primary">Run a new analysis</Link>
      </div>
    )
  }

  if (!report) {
    return <p className="py-16 text-center text-sm text-slate-400">Loading report…</p>
  }

  if (report.status === 'queued' || report.status === 'running') {
    return (
      <div className="card mx-auto max-w-lg">
        <h1 className="section-title">Analyzing “{report.input.keyword}”</h1>
        <p className="section-subtitle">
          Comparing {report.input.url} against the top 10 Google results ({report.input.country.toUpperCase()}, {report.input.device}).
          This usually takes 1–3 minutes.
        </p>
        <ProgressTracker steps={report.steps} />
      </div>
    )
  }

  if (report.status === 'failed') {
    return (
      <div className="card mx-auto max-w-lg">
        <h1 className="section-title text-red-700">Analysis failed</h1>
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {report.error ?? 'An unknown error occurred.'}
        </p>
        <ProgressTracker steps={report.steps} />
        <div className="mt-5 flex gap-2">
          <button className="btn-primary" onClick={rerun}>Try again</button>
          <Link href="/settings" className="btn-secondary">Check API keys</Link>
        </div>
      </div>
    )
  }

  return <ReportView report={report} onRerun={rerun} />
}
