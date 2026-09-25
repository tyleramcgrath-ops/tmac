import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { CHECKED, COMPARISONS, comparison } from '@/lib/compare'
import '../../home.css'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = comparison((await params).slug)
  if (!c) return {}
  return { title: { absolute: c.title }, description: c.description, alternates: { canonical: `/compare/${c.slug}` } }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = comparison((await params).slug)
  if (!c) notFound()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Compare · for law firms</p>
          <h1>{c.h1}</h1>
          <p>{c.lede}</p>
        </div>
      </section>
      <section className="ind-sec" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="cmp-wrap">
            <table className="cmp">
              <thead>
                <tr><th scope="col"><span className="visually-hidden">Compared</span></th><th scope="col">SaySites</th><th scope="col">{c.name}</th></tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.what}>
                    <th scope="row">{r.what}</th>
                    <td>{r.us}</td>
                    <td>{r.them}{r.src?.map((n) => <sup key={n}><a href={`#src-${n + 1}`}>{n + 1}</a></sup>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cmp-checked">Details about {c.name} come from its own website or from the reviews cited below, checked {CHECKED}. Prices and terms change, so confirm with {c.name} directly.</p>
        </div>
      </section>
      <section className="ind-sec ind-alt">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Which fits your firm</p>
            <h2>Different tools for different firms.</h2>
          </div>
          <div className="ind-seo">
            <div><h3>When {c.name} fits</h3><p>{c.theyFit}</p></div>
            <div><h3>When SaySites fits</h3><p>{c.weFit}</p></div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><a className="b b-dark" href="/redesign">See your site rebuilt, free</a><a className="b b-line" href="/websites-for/law-firms">SaySites for law firms</a></div>
          </div>
        </div>
      </section>
      <section className="faq ind-faq">
        <div className="wrap faq-in">
          <div className="head">
            <p className="kicker">Questions</p>
            <h2>Switching, answered.</h2>
          </div>
          <div className="qa">
            {c.faq.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>
      <section className="ind-sec ind-more">
        <div className="wrap">
          <h2>Sources</h2>
          <ol className="cmp-src">
            {c.sources.map((s, n) => <li key={s.url} id={`src-${n + 1}`}><a href={s.url} rel="nofollow noopener">{s.label}</a></li>)}
          </ol>
          <p className="cmp-checked">Also compare: {COMPARISONS.filter((o) => o.slug !== c.slug).map((o) => <a key={o.slug} href={`/compare/${o.slug}`}>SaySites vs {o.name}</a>)}</p>
        </div>
      </section>
    </MarketingShell>
  )
}
