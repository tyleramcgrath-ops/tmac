import type { AiInsights, PageAnalysis } from '@/lib/types'
import { CheckMark } from '@/components/ScoreBadge'

function lengthTone(len: number, min: number, max: number): string {
  return len >= min && len <= max ? 'text-emerald-600' : 'text-amber-600'
}

export function TitleMetaSection({
  user,
  competitors,
  ai,
  keyword,
}: {
  user: PageAnalysis | null
  competitors: PageAnalysis[]
  ai: AiInsights | null
  keyword: string
}) {
  if (!user?.page) return null
  const crawled = competitors.filter((c) => c.page && !c.page.crawlError)

  return (
    <section className="card">
      <h2 className="section-title">Title & meta description comparison</h2>
      <p className="section-subtitle">Character counts, keyword usage, and AI-suggested rewrites.</p>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Page</th>
              <th>Title tag</th>
              <th>Len</th>
              <th>KW</th>
              <th>Meta description</th>
              <th>Len</th>
              <th>KW</th>
            </tr>
          </thead>
          <tbody>
            {[user, ...crawled].map((a, i) => (
              <tr key={i} className={a.isUser ? 'bg-blue-50/60' : undefined}>
                <td className="whitespace-nowrap font-medium">
                  {a.isUser ? <span className="text-blue-700">Your page</span> : `#${a.position} ${a.serp?.domain ?? ''}`}
                </td>
                <td className="max-w-[20rem]">{a.page?.title ?? <em className="text-red-500">missing</em>}</td>
                <td className={lengthTone(a.page?.titleLength ?? 0, 30, 60)}>{a.page?.titleLength ?? 0}</td>
                <td>{a.keywords ? <CheckMark ok={a.keywords.usage.inTitle} /> : '—'}</td>
                <td className="max-w-[24rem]">{a.page?.metaDescription ?? <em className="text-red-500">missing</em>}</td>
                <td className={lengthTone(a.page?.metaDescriptionLength ?? 0, 70, 160)}>{a.page?.metaDescriptionLength ?? 0}</td>
                <td>{a.keywords ? <CheckMark ok={a.keywords.usage.inMetaDescription} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(ai?.suggestedTitles.length || ai?.suggestedMetaDescriptions.length) ? (
        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
          {ai.suggestedTitles.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggested title tags</h3>
              <ul className="space-y-2">
                {ai.suggestedTitles.map((t, i) => (
                  <li key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    {t} <span className="text-xs text-emerald-600">({t.length} chars)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ai.suggestedMetaDescriptions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggested meta descriptions</h3>
              <ul className="space-y-2">
                {ai.suggestedMetaDescriptions.map((m, i) => (
                  <li key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    {m} <span className="text-xs text-emerald-600">({m.length} chars)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
