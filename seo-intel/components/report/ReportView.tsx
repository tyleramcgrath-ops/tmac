'use client'

import { useState } from 'react'
import type { Report } from '@/lib/types'
import { ScoresSection } from './ScoresSection'
import { SerpSection } from './SerpSection'
import { ComparisonTable } from './ComparisonTable'
import { TitleMetaSection } from './TitleMetaSection'
import { ContentGapSection } from './ContentGapSection'
import { HeadingsSection } from './HeadingsSection'
import { KeywordSection } from './KeywordSection'
import { SchemaSection } from './SchemaSection'
import { BacklinksSection } from './BacklinksSection'
import { TechnicalSection } from './TechnicalSection'
import { SpeedSection } from './SpeedSection'
import { AiSearchSection } from './AiSearchSection'
import { ActionPlanSection } from './ActionPlanSection'
import { WordPressPanel } from './WordPressPanel'
import { PriorityChecklist } from './PriorityChecklist'
import { ReportNav } from './ReportNav'

export function ReportView({
  report,
  onRerun,
  ephemeral = false,
}: {
  report: Report
  onRerun: () => void
  ephemeral?: boolean
}) {
  const r = report.results
  const [downloading, setDownloading] = useState<string | null>(null)
  if (!r) return null

  // In database mode exports are a simple GET link. In ephemeral (streaming)
  // mode the report only lives in the browser, so POST it to the stateless
  // export endpoint and download the returned blob.
  async function download(format: 'pdf' | 'csv' | 'json') {
    if (!ephemeral) {
      window.location.href = `/api/reports/${report.id}/export?format=${format}`
      return
    }
    setDownloading(format)
    try {
      const res = await fetch(`/api/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `seo-report-${report.input.keyword.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">SEO Competitor Report</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">“{report.input.keyword}”</h1>
          <p className="mt-1 break-all text-sm text-slate-500">
            {report.input.url} · {report.input.country.toUpperCase()} · {report.input.device} ·{' '}
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" disabled={downloading !== null} onClick={() => download('pdf')}>
            {downloading === 'pdf' ? 'Preparing…' : 'Export PDF'}
          </button>
          <button className="btn-secondary" disabled={downloading !== null} onClick={() => download('csv')}>Export CSV</button>
          <button className="btn-secondary" disabled={downloading !== null} onClick={() => download('json')}>Raw JSON</button>
          <button className="btn-primary" onClick={onRerun}>Re-run</button>
        </div>
      </div>

      {/* Data availability notes */}
      {r.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Data availability notes</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-800">
            {r.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <ReportNav />

      <div id="checklist" className="scroll-mt-28"><PriorityChecklist report={report} /></div>
      <div id="summary" className="scroll-mt-28"><ScoresSection scores={r.scores} ai={r.ai} userPosition={r.userAnalysis?.position ?? null} /></div>
      <div id="plan" className="scroll-mt-28"><ActionPlanSection recommendations={r.recommendations} /></div>
      <div id="wordpress" className="scroll-mt-28"><WordPressPanel report={report} /></div>
      <div id="competitors" className="scroll-mt-28"><SerpSection serp={r.serp} userUrl={report.input.url} /></div>
      <div className="scroll-mt-28"><ComparisonTable user={r.userAnalysis} competitors={r.competitors} /></div>
      <div id="titles" className="scroll-mt-28"><TitleMetaSection user={r.userAnalysis} competitors={r.competitors} ai={r.ai} keyword={report.input.keyword} /></div>
      <div id="content" className="scroll-mt-28"><ContentGapSection gap={r.contentGap} user={r.userAnalysis} ai={r.ai} /></div>
      <div id="headings" className="scroll-mt-28"><HeadingsSection user={r.userAnalysis} competitors={r.competitors} ai={r.ai} /></div>
      <div id="keywords" className="scroll-mt-28"><KeywordSection user={r.userAnalysis} competitors={r.competitors} keyword={report.input.keyword} /></div>
      <div id="schema" className="scroll-mt-28"><SchemaSection gap={r.schemaGap} /></div>
      <div id="backlinks" className="scroll-mt-28"><BacklinksSection backlinks={r.backlinks} /></div>
      <div id="technical" className="scroll-mt-28"><TechnicalSection issues={r.technicalIssues} /></div>
      <div id="speed" className="scroll-mt-28"><SpeedSection user={r.userAnalysis} competitors={r.competitors} /></div>
      <div id="ai" className="scroll-mt-28"><AiSearchSection ai={r.ai} aiScore={r.scores?.aiReadiness ?? null} /></div>
    </div>
  )
}
