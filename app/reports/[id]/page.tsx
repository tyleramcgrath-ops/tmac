'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { Report } from '@/lib/types'
import { ProgressTracker } from '@/components/ProgressTracker'
import { ReportView } from '@/components/report/ReportView'
import { cacheReport, clearInput, readCachedReport, stashInput, takeInput } from '@/lib/client-session'
import { readClientKeys } from '@/lib/client-keys'

const POLL_MS = 2500

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [notFound, setNotFound] = useState(false)
  // "ephemeral" reports come from the streaming (no-database) mode and live only
  // in the browser; re-run and export must not hit the server-side store.
  const [ephemeral, setEphemeral] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const started = useRef(false)

  // ── Database-backed flow: fetch + poll ──
  const loadFromServer = useCallback(async () => {
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
          timer.current = setTimeout(loadFromServer, POLL_MS)
        }
      } else {
        timer.current = setTimeout(loadFromServer, POLL_MS * 2)
      }
    } catch {
      timer.current = setTimeout(loadFromServer, POLL_MS * 2)
    }
  }, [id])

  // ── Streaming (no-database) flow: run the analysis and read live progress ──
  const runStream = useCallback(async (input: unknown) => {
    setEphemeral(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(input as object), keys: readClientKeys() }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setReport({
          id, input: input as Report['input'], status: 'failed', steps: [],
          error: data.error ?? 'Failed to start the analysis.', createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(), overallScore: null, results: null,
        })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let last: Report | null = null
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            last = { ...(JSON.parse(line) as Report), id }
            setReport(last)
          } catch {
            // partial line — ignore
          }
        }
      }
      if (last) {
        cacheReport(last)
        clearInput(id)
      }
    } catch {
      setReport({
        id, input: input as Report['input'], status: 'failed', steps: [],
        error: 'Connection lost while running the analysis. Please try again.', createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(), overallScore: null, results: null,
      })
    }
  }, [id])

  useEffect(() => {
    if (started.current) return
    started.current = true

    const cached = readCachedReport(id)
    if (cached) {
      setReport(cached)
      setEphemeral(true)
      return
    }
    const pendingInput = takeInput(id)
    if (pendingInput) {
      runStream(pendingInput)
      return
    }
    loadFromServer()

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [id, loadFromServer, runStream])

  async function rerun() {
    if (ephemeral && report) {
      // Re-run in browser-only mode: fresh id, same input, stream again.
      const newId = crypto.randomUUID()
      stashInput(newId, report.input)
      router.push(`/reports/${newId}`)
      return
    }
    const res = await fetch(`/api/reports/${id}/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: readClientKeys() }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/reports/${data.id}`)
    }
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="section-title">Report not found</h1>
        <p className="mb-4 text-sm text-slate-500">It may have been deleted, or this link was from a different session.</p>
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
        {report.steps.length > 0 && <ProgressTracker steps={report.steps} />}
        <div className="mt-5 flex gap-2">
          <button className="btn-primary" onClick={rerun}>Try again</button>
          <Link href="/settings" className="btn-secondary">Check API keys</Link>
        </div>
      </div>
    )
  }

  return <ReportView report={report} onRerun={rerun} ephemeral={ephemeral} />
}
