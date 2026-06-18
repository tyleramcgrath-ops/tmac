import type { PageAnalysis } from '@/lib/types'
import { CheckMark } from '@/components/ScoreBadge'

export function ComparisonTable({ user, competitors }: { user: PageAnalysis | null; competitors: PageAnalysis[] }) {
  if (!user) return null
  const rows = [user, ...competitors]

  return (
    <section className="card">
      <h2 className="section-title">Side-by-side SEO comparison</h2>
      <p className="section-subtitle">Every crawled page compared on the core on-page factors. Blocked pages show partial data.</p>
      <div className="overflow-x-auto">
        <table className="table-base whitespace-nowrap">
          <thead>
            <tr>
              <th>Page</th>
              <th>Words</th>
              <th>Title len</th>
              <th>H1</th>
              <th>H2s</th>
              <th>Imgs</th>
              <th>Int. links</th>
              <th>Ext. links</th>
              <th>Schema</th>
              <th>FAQ</th>
              <th>KW in title</th>
              <th>KW in H1</th>
              <th>Perf</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const p = a.page
              const blocked = !p || p.crawlError
              return (
                <tr key={i} className={a.isUser ? 'bg-blue-50/60 font-medium' : undefined}>
                  <td className="max-w-[14rem]">
                    <div className="truncate">
                      {a.isUser ? (
                        <span className="font-semibold text-blue-700">Your page</span>
                      ) : (
                        <span className="text-slate-500">#{a.position}</span>
                      )}{' '}
                      <span className="text-slate-700">{a.serp?.domain ?? hostname(p?.finalUrl)}</span>
                    </div>
                    {blocked && <span className="text-[10px] font-medium text-red-500">crawl blocked/failed</span>}
                  </td>
                  <td>{p && !blocked ? p.wordCount.toLocaleString() : '—'}</td>
                  <td>{p && !blocked ? p.titleLength : '—'}</td>
                  <td>{p && !blocked ? p.h1.length : '—'}</td>
                  <td>{p && !blocked ? p.h2Count : '—'}</td>
                  <td>{p && !blocked ? p.images.count : '—'}</td>
                  <td>{p && !blocked ? p.links.internal : '—'}</td>
                  <td>{p && !blocked ? p.links.external : '—'}</td>
                  <td>{p && !blocked ? p.schemaTypes.length : '—'}</td>
                  <td>{p && !blocked ? <CheckMark ok={p.hasFaqSection} /> : '—'}</td>
                  <td>{a.keywords ? <CheckMark ok={a.keywords.usage.inTitle} /> : '—'}</td>
                  <td>{a.keywords ? <CheckMark ok={a.keywords.usage.inH1} /> : '—'}</td>
                  <td>{a.pageSpeed?.performance ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function hostname(url: string | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
