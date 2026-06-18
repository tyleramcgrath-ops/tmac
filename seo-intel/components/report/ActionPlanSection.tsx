import type { Recommendation } from '@/lib/types'

const CATEGORY_LABELS: Record<Recommendation['category'], string> = {
  critical: 'Critical fix',
  'high-impact': 'High impact',
  content: 'Content',
  technical: 'Technical SEO',
  schema: 'Schema',
  backlinks: 'Backlinks',
  speed: 'Speed',
  'ai-geo': 'AI / GEO',
}

const CATEGORY_STYLES: Record<Recommendation['category'], string> = {
  critical: 'bg-red-100 text-red-700',
  'high-impact': 'bg-orange-100 text-orange-700',
  content: 'bg-blue-100 text-blue-700',
  technical: 'bg-violet-100 text-violet-700',
  schema: 'bg-cyan-100 text-cyan-700',
  backlinks: 'bg-pink-100 text-pink-700',
  speed: 'bg-amber-100 text-amber-700',
  'ai-geo': 'bg-emerald-100 text-emerald-700',
}

const IMPACT_STYLES: Record<Recommendation['impact'], string> = {
  High: 'text-red-600',
  Medium: 'text-amber-600',
  Low: 'text-slate-500',
}

export function ActionPlanSection({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null
  return (
    <section className="card">
      <h2 className="section-title">Priority action plan</h2>
      <p className="section-subtitle">
        Every recommendation is derived from the comparison data, ordered by expected impact and effort.
      </p>
      <ol className="space-y-3">
        {recommendations.map((rec) => (
          <li key={rec.priority} className="rounded-xl border border-slate-100 p-4">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {rec.priority}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLES[rec.category]}`}>
                {CATEGORY_LABELS[rec.category]}
              </span>
              <span className={`text-xs font-medium ${IMPACT_STYLES[rec.impact]}`}>Impact: {rec.impact}</span>
              <span className="text-xs text-slate-400">Difficulty: {rec.difficulty}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{rec.issue}</p>
            <p className="mt-1 text-sm text-slate-500"><span className="font-medium text-slate-600">Why it matters:</span> {rec.why}</p>
            <p className="mt-1 text-sm text-slate-700"><span className="font-medium text-emerald-700">Fix:</span> {rec.fix}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
