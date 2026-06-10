import type { SchemaGap } from '@/lib/types'

export function SchemaSection({ gap }: { gap: SchemaGap | null }) {
  if (!gap) return null
  return (
    <section className="card">
      <h2 className="section-title">Schema markup analysis</h2>
      <p className="section-subtitle">Structured data on your page versus the competition, plus ready-to-use JSON-LD.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Your schema</h3>
          {gap.userTypes.length === 0 ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">No structured data found on your page.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {gap.userTypes.map((t) => (
                <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Competitor schema <span className="font-normal text-slate-400">(pages using it)</span>
          </h3>
          {gap.competitorTypeCounts.length === 0 ? (
            <p className="text-sm text-slate-400">No competitor schema detected.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {gap.competitorTypeCounts.map(({ type, count }) => (
                <span
                  key={type}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                    gap.missingTypes.includes(type)
                      ? 'bg-amber-50 text-amber-800 ring-amber-100'
                      : 'bg-slate-100 text-slate-600 ring-slate-200'
                  }`}
                >
                  {type} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {gap.invalidSchemas.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Schema validation errors</h3>
          <ul className="space-y-1 text-sm text-slate-600">
            {gap.invalidSchemas.slice(0, 10).map((s, i) => (
              <li key={i}>
                <span className="font-medium text-amber-700">{s.type}</span> on{' '}
                <span className="break-all text-slate-500">{s.url}</span>: {s.errors.join('; ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gap.suggestedJsonLd.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Recommended JSON-LD to add</h3>
          <p className="mb-2 text-xs text-slate-500">
            Replace placeholder values, add to your page <code>&lt;head&gt;</code> in a{' '}
            <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> tag, then validate with Google’s Rich Results Test.
          </p>
          {gap.suggestedJsonLd.map((schema, i) => (
            <pre key={i} className="mb-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(schema, null, 2)}
            </pre>
          ))}
        </div>
      )}
    </section>
  )
}
