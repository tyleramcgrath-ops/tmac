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

export function ReportView({ report, onRerun }: { report: Report; onRerun: () => void }) {
  const r = report.results
  if (!r) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">“{report.input.keyword}”</h1>
          <p className="mt-1 text-sm text-slate-500">
            {report.input.url} · {report.input.country.toUpperCase()} · {report.input.device} ·{' '}
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={`/api/reports/${report.id}/export?format=pdf`}>Export PDF</a>
          <a className="btn-secondary" href={`/api/reports/${report.id}/export?format=csv`}>Export CSV</a>
          <a className="btn-secondary" href={`/api/reports/${report.id}/export?format=json`}>Raw JSON</a>
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

      <ScoresSection scores={r.scores} ai={r.ai} userPosition={r.userAnalysis?.position ?? null} />
      <ActionPlanSection recommendations={r.recommendations} />
      <SerpSection serp={r.serp} userUrl={report.input.url} />
      <ComparisonTable user={r.userAnalysis} competitors={r.competitors} />
      <TitleMetaSection user={r.userAnalysis} competitors={r.competitors} ai={r.ai} keyword={report.input.keyword} />
      <ContentGapSection gap={r.contentGap} user={r.userAnalysis} ai={r.ai} />
      <HeadingsSection user={r.userAnalysis} competitors={r.competitors} ai={r.ai} />
      <KeywordSection user={r.userAnalysis} competitors={r.competitors} keyword={report.input.keyword} />
      <SchemaSection gap={r.schemaGap} />
      <BacklinksSection backlinks={r.backlinks} />
      <TechnicalSection issues={r.technicalIssues} />
      <SpeedSection user={r.userAnalysis} competitors={r.competitors} />
      <AiSearchSection ai={r.ai} aiScore={r.scores?.aiReadiness ?? null} />
    </div>
  )
}
