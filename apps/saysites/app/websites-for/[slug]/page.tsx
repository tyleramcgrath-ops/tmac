import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PricingPlans } from '@/components/PricingPlans'
import { PRICES } from '@/lib/billing'
import { LAW_RESEARCH } from '@/lib/law-research'
import { MarketingShell } from '@/components/MarketingShell'
import { INDUSTRIES, industry } from '@/lib/industries'
import { GUIDES } from '@/lib/industries/guides'
import { photosFor } from '@/lib/photos'
import { SHOWCASE_INFO } from '@/lib/showcase'
import '../../home.css'

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const i = industry((await params).slug)
  if (!i) return {}
  return { title: { absolute: i.title }, description: i.description, alternates: { canonical: `/websites-for/${i.slug}` }, openGraph: { title: i.title, description: i.description, images: [{ url: '/og-home.jpg', width: 1200, height: 630 }] } }
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const i = industry((await params).slug)
  if (!i) notFound()
  const photo = photosFor(i.type).hero
  const info = SHOWCASE_INFO[i.example]
  const others = INDUSTRIES.filter((o) => o.slug !== i.slug)
  const guide = GUIDES[i.slug]
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: i.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SaySites', item: 'https://saysites.com/' },
        { '@type': 'ListItem', position: 2, name: 'Websites for your business', item: 'https://saysites.com/websites-for' },
        { '@type': 'ListItem', position: 3, name: i.h1, item: `https://saysites.com/websites-for/${i.slug}` },
      ],
    },
  ]

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="page-hero ind-hero">
        <div className="wrap ind-hero-in">
          <div>
            <p className="kicker">{i.kicker}</p>
            <h1>{i.h1}</h1>
            <p>{i.lede}</p>
            <div className="ind-actions">
              <a className="b b-dark" href="/#talk">Let’s talk</a>
              <a className="b b-line" href="/redesign">See your current site rebuilt</a>
              <a className="tplrow-link" href={`/preview/${i.example}`}>See a live example</a>
            </div>
          </div>
          <a className="gal-card ind-shot" href={`/preview/${i.example}`}>
            <div className="gal-shot">
              <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 900px) 100vw, 520px" style={{ objectFit: 'cover' }} />
              <span className={`gal-plaque${SHOWCASE_INFO[i.example]?.design === 'upscale' ? ' is-dark' : ''}`}><img src={`/media/logos/${i.example}.svg`} alt="" /></span>
              {info && (
                <div className="gal-over">
                  <small>{info.kind}, {info.place}</small>
                  <strong>A live example site</strong>
                </div>
              )}
            </div>
          </a>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">The problem</p>
              <h2>Why most {i.plural} are stuck with a website that doesn’t work for them.</h2>
            </div>
          </div>
          <div className="ind-grid">
            {i.problems.map((p) => (
              <div key={p.title}><h3>{p.title}</h3><p>{p.body}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="ind-sec ind-alt">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">What you get</p>
              <h2>The pages your site should have.</h2>
            </div>
            <p>Your site starts with a home, services and contact page written for your business and your town. Ask Sofie for any of the others. Every page is checked against Google’s basics and held to a 95+ speed score before it goes live.</p>
          </div>
          <ol className="ind-pages">
            {i.pages.map((p) => (
              <li key={p.name}><div><h3>{p.name}</h3><p>{p.why}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Getting found</p>
            <h2>Built for the searches your clients actually make.</h2>
            <ul className="ind-searches">
              {i.searches.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="ind-seo">
            {i.seo.map((s) => (
              <div key={s.title}><h3>{s.title}</h3><p>{s.body}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="ind-sec ind-dark">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Sofie, your assistant</p>
            <h2>Change anything by asking.</h2>
            <p className="ind-muted">No page builder to learn. Tell Sofie what you want in a sentence; she shows you the change as a draft, and it goes live when you say so.</p>
          </div>
          <ul className="ind-asks">
            {i.sofie.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </section>

      {guide && (
        <section className="ind-sec ind-guide" id="guide">
          <div className="wrap">
            <div className="ind-guide-head">
              <p className="kicker">The guide</p>
              <h2>{guide.title}</h2>
              <p>{guide.intro}</p>
            </div>
            <ul className="ind-guide-toc" aria-label="In this guide">
              {guide.sections.map((g, n) => <li key={g.heading}><a href={`#g${n + 1}`}>{g.heading}</a></li>)}
            </ul>
            {guide.sections.map((g, n) => (
              <div className="ind-guide-sec" id={`g${n + 1}`} key={g.heading}>
                <h3>{g.heading}</h3>
                <div className="ind-guide-body">{g.body.split(/\n\s*\n/).map((para, k) => <p key={k}>{para}</p>)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="ind-sec ind-price">
        <div className="wrap">
          <div className="ind-price-in">
            <div><b>100</b><span>speed score on our example sites</span></div>
            <div><b>0</b><span>setup fees or long contracts</span></div>
            <div><b>95+</b><span>speed score required on every page</span></div>
            <div><b>100%</b><span>yours: your words, photos and domain</span></div>
          </div>
        </div>
      </section>

      {i.slug === 'law-firms' && (
        <section className="ind-sec ind-alt" id="compared">
          <div className="wrap">
            <div className="head">
              <p className="kicker">Measured, not claimed</p>
              <h2>How SaySites compares with the firm sites that rank today.</h2>
              <p>We tested {LAW_RESEARCH.sites} law firm websites at the top of Google in {LAW_RESEARCH.date}. Here’s the middle of the pack next to a SaySites site.</p>
            </div>
            <div className="lr-wrap">
              <table className="lr-cmp">
                <thead><tr><th scope="col">Check</th><th scope="col">Typical top-ranking firm site</th><th scope="col">SaySites</th></tr></thead>
                <tbody>{LAW_RESEARCH.rows.map((r) => <tr key={r.label}><th scope="row">{r.label}</th><td data-l="Typical firm site">{r.them}</td><td data-l="SaySites"><strong>{r.us}</strong></td></tr>)}</tbody>
              </table>
            </div>
            <p className="lr-note">Middle values from our test; speed figures from a mobile Lighthouse test of {LAW_RESEARCH.lighthouseSample} sites. SaySites figures are our example law firm sites, measured the same way on our own server. <a href={LAW_RESEARCH.article}>How we tested</a>.</p>
          </div>
        </section>
      )}

      <section className="ind-sec" id="pricing">
        <div className="wrap">
          <div className="head">
            <p className="kicker">Pricing</p>
            <h2>{i.slug === 'law-firms' ? 'One monthly price. Everything a firm needs.' : `From $${PRICES.site.month} a month, everything included.`}</h2>
          </div>
          {i.slug === 'law-firms' ? <PricingPlans only="law" /> : <p><a className="b b-dark" href="/pricing">See every plan</a></p>}
        </div>
      </section>

      <section className="faq ind-faq">
        <div className="wrap faq-in">
          <div className="head">
            <p className="kicker">Questions</p>
            <h2>What {i.plural} ask us.</h2>
          </div>
          <div className="qa">
            {i.faq.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="ind-sec ind-more">
        <div className="wrap">
          <h2>Websites for other businesses</h2>
          <ul>
            {others.map((o) => <li key={o.slug}><a href={`/websites-for/${o.slug}`}>{o.h1.replace(/\.$/, '')}</a></li>)}
          </ul>
        </div>
      </section>
    </MarketingShell>
  )
}
