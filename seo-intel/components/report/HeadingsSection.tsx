import type { AiInsights, PageAnalysis } from '@/lib/types'

export function HeadingsSection({
  user,
  competitors,
  ai,
}: {
  user: PageAnalysis | null
  competitors: PageAnalysis[]
  ai: AiInsights | null
}) {
  if (!user?.page) return null
  const crawled = competitors.filter((c) => c.page && !c.page.crawlError)

  return (
    <section className="card">
      <h2 className="section-title">Heading structure</h2>
      <p className="section-subtitle">H1 comparison and heading depth versus competitors.</p>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Page</th>
              <th>H1</th>
              <th>H2s</th>
              <th>H3s</th>
            </tr>
          </thead>
          <tbody>
            {[user, ...crawled].map((a, i) => (
              <tr key={i} className={a.isUser ? 'bg-blue-50/60' : undefined}>
                <td className="whitespace-nowrap font-medium">
                  {a.isUser ? <span className="text-blue-700">Your page</span> : `#${a.position} ${a.serp?.domain ?? ''}`}
                </td>
                <td className="max-w-[28rem]">
                  {a.page!.h1.length === 0 ? (
                    <em className="text-red-500">missing</em>
                  ) : (
                    a.page!.h1.map((h, j) => <div key={j}>{h}{a.page!.h1.length > 1 && j === 0 && <span className="ml-1 text-xs text-amber-600">(multiple H1s)</span>}</div>)
                  )}
                </td>
                <td>{a.page!.h2Count}</td>
                <td>{a.page!.h3Count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-700">Your full heading outline</summary>
        <ol className="mt-2 space-y-0.5 text-sm text-slate-600">
          {user.page.headings.map((h, i) => (
            <li key={i} style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
              <span className="mr-1.5 rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500">H{h.level}</span>
              {h.text}
            </li>
          ))}
        </ol>
      </details>

      {ai?.recommendedHeadingOutline && ai.recommendedHeadingOutline.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Recommended heading outline</h3>
          <ol className="space-y-1 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            {ai.recommendedHeadingOutline.map((h, i) => {
              const indent = h.startsWith('H3') ? 32 : h.startsWith('H2') ? 16 : 0
              return <li key={i} style={{ paddingLeft: indent }}>{h}</li>
            })}
          </ol>
        </div>
      )}
    </section>
  )
}
