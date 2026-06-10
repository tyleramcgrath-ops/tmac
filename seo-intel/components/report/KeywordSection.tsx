import type { PageAnalysis } from '@/lib/types'
import { CheckMark } from '@/components/ScoreBadge'

const CHECKS: { key: keyof NonNullable<PageAnalysis['keywords']>['usage']; label: string }[] = [
  { key: 'inTitle', label: 'Title tag' },
  { key: 'inMetaDescription', label: 'Meta description' },
  { key: 'inH1', label: 'H1' },
  { key: 'inFirst100Words', label: 'First 100 words' },
  { key: 'inH2s', label: 'H2 headings' },
  { key: 'inUrl', label: 'URL' },
  { key: 'inImageAlt', label: 'Image alt text' },
]

export function KeywordSection({
  user,
  competitors,
  keyword,
}: {
  user: PageAnalysis | null
  competitors: PageAnalysis[]
  keyword: string
}) {
  if (!user?.keywords) return null
  const crawled = competitors.filter((c) => c.keywords)

  // % of competitors passing each check, for context.
  const competitorRate = (key: (typeof CHECKS)[number]['key']): string => {
    if (crawled.length === 0) return '—'
    const passing = crawled.filter((c) => Boolean(c.keywords!.usage[key])).length
    return `${Math.round((passing / crawled.length) * 100)}%`
  }

  return (
    <section className="card">
      <h2 className="section-title">Keyword usage — “{keyword}”</h2>
      <p className="section-subtitle">
        Where the target keyword appears on your page, and how many competitors do the same.
        Your density: <strong>{user.keywords.usage.density}%</strong> ({user.keywords.usage.occurrences} occurrence{user.keywords.usage.occurrences === 1 ? '' : 's'}).
      </p>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Placement</th>
              <th>Your page</th>
              <th>Competitors using it</th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map(({ key, label }) => (
              <tr key={key}>
                <td className="font-medium">{label}</td>
                <td><CheckMark ok={Boolean(user.keywords!.usage[key])} /></td>
                <td>{competitorRate(key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.keywords.topTerms.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Your page’s most-used terms</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.keywords.topTerms.slice(0, 20).map((t) => (
              <span key={t.term} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {t.term} <span className="text-slate-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
