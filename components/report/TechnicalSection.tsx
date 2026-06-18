import type { TechnicalIssue } from '@/lib/types'

const SEVERITY_STYLES: Record<TechnicalIssue['severity'], { badge: string; label: string }> = {
  critical: { badge: 'bg-red-100 text-red-700', label: 'Critical' },
  warning: { badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
  info: { badge: 'bg-slate-100 text-slate-600', label: 'Minor' },
}

export function TechnicalSection({ issues }: { issues: TechnicalIssue[] }) {
  return (
    <section className="card">
      <h2 className="section-title">Technical SEO audit</h2>
      <p className="section-subtitle">HTTP status, indexability, canonicals, content health and markup checks for your page.</p>

      {issues.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ No technical issues detected — your page passes all checks.
        </p>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const style = SEVERITY_STYLES[issue.severity]
            return (
              <li key={issue.id} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <span className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                  {style.label}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{issue.issue}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{issue.detail}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
