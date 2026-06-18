import type { AiInsights, Scores } from '@/lib/types'
import { ScoreRing, scoreTone } from '@/components/ScoreBadge'

export function ScoresSection({
  scores,
  ai,
  userPosition,
}: {
  scores: Scores | null
  ai: AiInsights | null
  userPosition: number | null
}) {
  if (!scores) return null
  const subScores = [scores.content, scores.technical, scores.schema, scores.authority, scores.speed, scores.intent, scores.aiReadiness]
  const overallTone = scoreTone(scores.overall.score)

  return (
    <section className="card">
      <h2 className="section-title">Executive summary</h2>
      <p className="section-subtitle">
        {userPosition !== null
          ? `Your page currently ranks #${userPosition} for this keyword.`
          : 'Your page is not in the top organic results for this keyword.'}
      </p>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className={`flex shrink-0 flex-col items-center justify-center rounded-xl px-8 py-6 ring-1 ${overallTone.bg} ${overallTone.ring}`}>
          <span className={`text-5xl font-bold ${overallTone.text}`}>{scores.overall.score}</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Overall score</span>
        </div>
        <div className="flex-1">
          {ai?.executiveSummary && <p className="mb-4 text-sm leading-relaxed text-slate-700">{ai.executiveSummary}</p>}
          <p className="text-sm text-slate-500">{scores.overall.explanation}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4 lg:grid-cols-7">
        {subScores.map((s) => (
          <ScoreRing key={s.key} score={s.score} label={s.label} />
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-700">What do these scores mean?</summary>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {subScores.map((s) => (
            <li key={s.key}>
              <span className="font-medium text-slate-800">{s.label} ({s.score}):</span> {s.explanation}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
