import type { AiInsights, ContentGap, PageAnalysis } from '@/lib/types'
import { ScoreBadge } from '@/components/ScoreBadge'

export function ContentGapSection({
  gap,
  user,
  ai,
}: {
  gap: ContentGap | null
  user: PageAnalysis | null
  ai: AiInsights | null
}) {
  if (!gap) return null
  // The gap score measures the size of the gap — invert for "coverage".
  const coverage = 100 - gap.contentGapScore

  return (
    <section className="card">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="section-title !mb-0">Content gap analysis</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          Content coverage <ScoreBadge score={coverage} />
        </div>
      </div>
      <p className="section-subtitle">
        Your page: <strong>{user?.page?.wordCount.toLocaleString() ?? '—'}</strong> words · Competitor median:{' '}
        <strong>{gap.competitorMedianWordCount.toLocaleString()}</strong> words · Recommended:{' '}
        <strong>{gap.recommendedWordCountMin.toLocaleString()}–{gap.recommendedWordCountMax.toLocaleString()}</strong> words
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {gap.missingHeadingTopics.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Sections competitors cover that you don’t</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {gap.missingHeadingTopics.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}
        {gap.missingQuestions.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Questions your page doesn’t answer</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {gap.missingQuestions.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>
        )}
        {gap.missingTerms.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Missing terms <span className="font-normal text-slate-400">(used by N competitors)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {gap.missingTerms.map((t) => (
                <span key={t.term} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800 ring-1 ring-amber-100">
                  {t.term} <span className="text-amber-500">×{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {gap.missingPhrases.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Missing phrases</h3>
            <div className="flex flex-wrap gap-1.5">
              {gap.missingPhrases.map((t) => (
                <span key={t.term} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{t.term}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {ai?.suggestedContentSections && ai.suggestedContentSections.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggested new content sections</h3>
          <ul className="space-y-2">
            {ai.suggestedContentSections.map((s, i) => (
              <li key={i} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
