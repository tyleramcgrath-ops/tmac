import type { PageAnalysis } from '@/lib/types'
import { ScoreBadge } from '@/components/ScoreBadge'

function ms(v: number | null): string {
  return v === null ? '—' : `${(v / 1000).toFixed(1)}s`
}

export function SpeedSection({ user, competitors }: { user: PageAnalysis | null; competitors: PageAnalysis[] }) {
  if (!user) return null
  const measured = [user, ...competitors].filter((a) => a.pageSpeed)

  return (
    <section className="card">
      <h2 className="section-title">Page speed & Core Web Vitals</h2>
      <p className="section-subtitle">Lighthouse lab data via Google PageSpeed Insights ({user.pageSpeed?.strategy ?? 'desktop'} strategy).</p>

      <div className="overflow-x-auto">
        <table className="table-base whitespace-nowrap">
          <thead>
            <tr>
              <th>Page</th>
              <th>Perf</th>
              <th>A11y</th>
              <th>Best practices</th>
              <th>SEO</th>
              <th>LCP</th>
              <th>CLS</th>
              <th>INP</th>
              <th>FCP</th>
              <th>Speed Index</th>
            </tr>
          </thead>
          <tbody>
            {measured.map((a, i) => {
              const ps = a.pageSpeed!
              return (
                <tr key={i} className={a.isUser ? 'bg-blue-50/60 font-medium' : undefined}>
                  <td>
                    {a.isUser ? <span className="text-blue-700">Your page</span> : `#${a.position} ${a.serp?.domain ?? ''}`}
                    {ps.error && <div className="text-[10px] font-normal text-red-500">{ps.error}</div>}
                  </td>
                  <td><ScoreBadge score={ps.performance} size="sm" /></td>
                  <td><ScoreBadge score={ps.accessibility} size="sm" /></td>
                  <td><ScoreBadge score={ps.bestPractices} size="sm" /></td>
                  <td><ScoreBadge score={ps.seo} size="sm" /></td>
                  <td>{ms(ps.lcpMs)}</td>
                  <td>{ps.cls ?? '—'}</td>
                  <td>{ps.inpMs !== null ? `${ps.inpMs}ms` : '—'}</td>
                  <td>{ms(ps.fcpMs)}</td>
                  <td>{ms(ps.speedIndexMs)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {user.pageSpeed && user.pageSpeed.opportunities.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Top speed opportunities for your page</h3>
          <ul className="space-y-1 text-sm text-slate-600">
            {user.pageSpeed.opportunities.map((o, i) => (
              <li key={i}>
                • {o.title}
                {o.savingsMs !== null && o.savingsMs > 0 && (
                  <span className="ml-1 text-xs font-medium text-emerald-600">save ~{(o.savingsMs / 1000).toFixed(1)}s</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
