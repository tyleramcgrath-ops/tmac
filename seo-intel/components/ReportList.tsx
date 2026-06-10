'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReportSummary } from '@/lib/types'
import { ScoreBadge } from './ScoreBadge'

const STATUS_STYLES: Record<string, string> = {
  complete: 'bg-emerald-50 text-emerald-700',
  running: 'bg-blue-50 text-blue-700',
  queued: 'bg-slate-100 text-slate-600',
  failed: 'bg-red-50 text-red-700',
}

export function ReportList({ limit }: { limit?: number }) {
  const router = useRouter()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReports(limit ? data.reports.slice(0, limit) : data.reports)
    } catch {
      setError('Failed to load reports.')
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  async function onDelete(id: string) {
    if (!confirm('Delete this report? This cannot be undone.')) return
    setBusy(id)
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    setBusy(null)
    load()
  }

  async function onRerun(id: string) {
    setBusy(id)
    const res = await fetch(`/api/reports/${id}/rerun`, { method: 'POST' })
    const data = await res.json()
    setBusy(null)
    if (res.ok) router.push(`/reports/${data.id}`)
  }

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  if (reports === null) return <p className="py-8 text-center text-sm text-slate-400">Loading reports…</p>
  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No reports yet — run your first analysis above.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Page</th>
            <th>Market</th>
            <th>Status</th>
            <th>Score</th>
            <th>Created</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td>
                <Link href={`/reports/${r.id}`} className="font-medium text-blue-700 hover:underline">
                  {r.input.keyword}
                </Link>
              </td>
              <td className="max-w-[16rem] truncate text-slate-500">{r.input.url}</td>
              <td className="uppercase">{r.input.country} · {r.input.device}</td>
              <td>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? ''}`}>
                  {r.status}
                </span>
              </td>
              <td><ScoreBadge score={r.overallScore} size="sm" /></td>
              <td className="whitespace-nowrap text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="whitespace-nowrap text-right">
                <button className="btn-secondary mr-1 !px-2 !py-1 text-xs" disabled={busy === r.id} onClick={() => onRerun(r.id)}>
                  Re-run
                </button>
                <button
                  className="btn-secondary !px-2 !py-1 text-xs !text-red-600 hover:!bg-red-50"
                  disabled={busy === r.id}
                  onClick={() => onDelete(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
