import type { SerpData } from '@/lib/types'

export function SerpSection({ serp, userUrl }: { serp: SerpData | null; userUrl: string }) {
  if (!serp) return null
  return (
    <section className="card">
      <h2 className="section-title">Top 10 competitors</h2>
      <p className="section-subtitle">
        Live Google organic results for “{serp.query}” ({serp.country.toUpperCase()}, {serp.device}) — fetched{' '}
        {new Date(serp.fetchedAt).toLocaleString()}.
      </p>

      <ol className="space-y-3">
        {serp.results.map((r) => (
          <li key={r.position} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {r.position}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {r.title}
                {r.isFeaturedSnippet && (
                  <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">FEATURED SNIPPET</span>
                )}
              </p>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-emerald-700 hover:underline">
                {r.displayedUrl}
              </a>
              {r.snippet && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.snippet}</p>}
            </div>
          </li>
        ))}
      </ol>

      {(serp.peopleAlsoAsk.length > 0 || serp.relatedSearches.length > 0) && (
        <div className="mt-6 grid gap-6 border-t border-slate-100 pt-5 md:grid-cols-2">
          {serp.peopleAlsoAsk.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">People Also Ask</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                {serp.peopleAlsoAsk.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </div>
          )}
          {serp.relatedSearches.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Related searches</h3>
              <div className="flex flex-wrap gap-1.5">
                {serp.relatedSearches.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
