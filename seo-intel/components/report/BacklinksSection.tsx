import Link from 'next/link'
import type { BacklinkData } from '@/lib/types'

export function BacklinksSection({ backlinks }: { backlinks: BacklinkData | null }) {
  return (
    <section className="card">
      <h2 className="section-title">Backlink & authority comparison</h2>

      {!backlinks || !backlinks.available ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="mx-auto max-w-md text-sm text-slate-600">
            {backlinks?.message ??
              'Backlink data requires a backlink provider API key. Connect DataForSEO to compare referring domains, backlinks and domain authority against competitors.'}
          </p>
          <Link href="/settings" className="btn-primary mt-4">Add API key in Settings</Link>
        </div>
      ) : (
        <>
          <p className="section-subtitle">Domain-level authority data via {backlinks.provider}.</p>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Referring domains</th>
                  <th>Backlinks</th>
                  <th>Domain rank</th>
                  <th>Spam score</th>
                </tr>
              </thead>
              <tbody>
                {backlinks.profiles.map((p, i) => (
                  <tr key={p.target} className={i === 0 ? 'bg-blue-50/60 font-medium' : undefined}>
                    <td>
                      {i === 0 && <span className="mr-1.5 text-blue-700">Your domain:</span>}
                      {p.target}
                      {p.error && <span className="ml-2 text-xs text-red-500">{p.error}</span>}
                    </td>
                    <td>{p.referringDomains?.toLocaleString() ?? '—'}</td>
                    <td>{p.backlinks?.toLocaleString() ?? '—'}</td>
                    <td>{p.domainRank ?? '—'}</td>
                    <td>{p.spamScore ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
