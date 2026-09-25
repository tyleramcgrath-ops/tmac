import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { INDUSTRIES, industry } from '@/lib/industries'
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
              <a className="b b-dark" href="/signup">Build my site free</a>
              <a className="b b-line" href="/redesign">See your current site rebuilt</a>
              <a className="tplrow-link" href={`/preview/${i.example}`}>See a live example →</a>
            </div>
          </div>
          <a className="gal-card ind-shot" href={`/preview/${i.example}`}>
            <div className="gal-shot">
              <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 900px) 100vw, 520px" style={{ objectFit: 'cover' }} />
              <span className="gal-plaque"><img src={`/media/logos/${i.example}.svg`} alt="" /></span>
              {info && (
                <div className="gal-over">
                  <small>{info.kind} · {info.place}</small>
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
            {i.pages.map((p, n) => (
              <li key={p.name}><span>{String(n + 1).padStart(2, '0')}</span><div><h3>{p.name}</h3><p>{p.why}</p></div></li>
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

      <section className="ind-sec ind-price">
        <div className="wrap">
          <div className="ind-price-in">
            <div><b>$15</b><span>a month, everything included</span></div>
            <div><b>0</b><span>setup fees or long contracts</span></div>
            <div><b>95+</b><span>speed score required on every page</span></div>
            <div><b>100%</b><span>yours: your words, photos and domain</span></div>
          </div>
          <p className="fine">7-day free trial. Cancel anytime.</p>
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
