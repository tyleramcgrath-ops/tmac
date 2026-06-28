import type { Recommendation, Report } from '@/lib/types'

// The simplest, clearest view of "what do I actually do?" — the top actions in
// plain language, in order, with impact and whether the WordPress box can apply
// the fix automatically.

const WP_AUTO_CATEGORIES = new Set(['content'])
function isWordPressAuto(rec: Recommendation): boolean {
  if (WP_AUTO_CATEGORIES.has(rec.category)) return true
  return /\b(title|meta description|faq|short[- ]answer)\b/i.test(`${rec.issue} ${rec.fix}`)
}

const IMPACT_PILL: Record<Recommendation['impact'], string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
}

export function PriorityChecklist({ report }: { report: Report }) {
  const recs = report.results?.recommendations ?? []
  if (recs.length === 0) return null
  const top = recs.slice(0, 6)
  const score = report.results?.scores?.overall.score ?? null

  return (
    <section className="card border-t-4 border-t-blue-600">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title !mb-0">Your SEO action checklist</h2>
        {score !== null && (
          <span className="text-sm text-slate-500">
            Current score <strong className="text-slate-800">{score}/100</strong> — these are the fastest ways to raise it.
          </span>
        )}
      </div>
      <p className="section-subtitle">
        Do these in order, top to bottom. The first ones give you the biggest gain for the least effort. Items marked{' '}
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">Auto-fix</span> can be
        applied to your site automatically in the WordPress box below.
      </p>

      <ol className="space-y-2.5">
        {top.map((rec, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{rec.issue}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${IMPACT_PILL[rec.impact]}`}>
                  {rec.impact} impact
                </span>
                {isWordPressAuto(rec) && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Auto-fix</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-600"><span className="font-medium text-emerald-700">Do this:</span> {rec.fix}</p>
            </div>
          </li>
        ))}
      </ol>

      {recs.length > top.length && (
        <p className="mt-3 text-xs text-slate-400">
          + {recs.length - top.length} more in the full action plan below.
        </p>
      )}
    </section>
  )
}
