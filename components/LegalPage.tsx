import { PageHero } from '@/components/ui'
import { SITE, fmtDate } from '@/lib/site'

export const LEGAL_UPDATED = '2026-10-20'

export function LegalPage({ title, path, sections }: { title: string; path: string; sections: [string, string[]][] }) {
  return (
    <>
      <PageHero crumbs={[{ name: title, path }]} title={title} lede={`Last updated ${fmtDate(LEGAL_UPDATED)}.`} />
      <section className="section">
        <div className="wrap prose">
          {sections.map(([h, ps]) => (
            <section key={h}><h2>{h}</h2>{ps.map((p) => <p key={p}>{p}</p>)}</section>
          ))}
          <p className="muted">Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        </div>
      </section>
    </>
  )
}
