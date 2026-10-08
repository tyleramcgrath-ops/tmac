import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { getStore } from '@/lib/store'
import '../../home.css'

export const dynamic = 'force-dynamic'

// A city report (lib/prospects buildReport): what we measured on the public
// websites of one trade in one city, published under SaySites' own name.
// Everyone's numbers together; by name only the lightest sites. Never a list
// of who did worst.

async function load(slug: string) {
  const r = /^[a-z0-9-]{1,80}$/.test(slug) ? await getStore().report(slug) : null
  return r?.publishedAt ? r : null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug)
  if (!r) return { title: 'Report not found', robots: { index: false } }
  return { title: r.title, description: `We measured ${r.sites} ${r.trade} websites in ${r.city}: page weight, scripts, what Google can read and what phones get. The numbers, and the lightest sites by name.`, alternates: { canonical: `/reports/${r.slug}` } }
}

const fmtDate = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = await load((await params).slug)
  if (!r) notFound()
  const facts: [string, string][] = [
    ['Median homepage size', `${r.medianKb} KB of HTML`],
    ['Median scripts loaded', String(r.medianScripts)],
    ['Tell Google their business details (structured data)', `${r.businessDetails}%`],
    ['Mark up common questions for Google', `${r.faq}%`],
    ['Set up for phone screens', `${r.mobileReady}%`],
    ['Have exactly one main heading', `${r.oneHeading}%`],
    ['Describe every image (for screen readers and Google)', `${r.imagesDescribed}%`],
  ]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: r.title,
    datePublished: r.publishedAt,
    dateModified: r.measuredAt,
    author: { '@type': 'Organization', name: 'SaySites', url: 'https://saysites.com' },
    publisher: { '@type': 'Organization', name: 'SaySites', url: 'https://saysites.com' },
    mainEntityOfPage: `https://saysites.com/reports/${r.slug}`,
  }
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Local websites report, {r.city}</p>
          <h1>{r.title}</h1>
          <p>{r.intro || `We measured the public homepages of ${r.sites} ${r.trade} businesses in ${r.city}: how heavy they are, how many scripts they load, and what Google and phones get from them. Here’s what we found.`}</p>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">The numbers</p>
              <h2>{r.sites} websites, measured {fmtDate(r.measuredAt)}.</h2>
            </div>
            <p>Each homepage was read once, as it was served that day, the way a search engine first reads it. Percentages are of the {r.sites} sites.</p>
          </div>
          <div className="compare-scroll">
            <table className="rp-table">
              <tbody>
                {facts.map(([k, v]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
                ))}
                {r.ours && <tr><th scope="row">The same sites rebuilt on SaySites (median)</th><td>{r.ours.kb} KB, {r.ours.scripts} scripts</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {r.lightest.length > 0 && (
        <section className="ind-sec">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Leading the way</p>
                <h2>The lightest {r.lightest.length} homepages.</h2>
              </div>
              <p>Lighter pages generally load faster on phones. Weight isn’t everything a good website does, but these businesses keep theirs lean.</p>
            </div>
            <ol className="rp-list">
              {r.lightest.map((x) => (
                <li key={x.host}><strong>{x.name}</strong> <span>{x.host}</span> <em>{x.kb} KB, {x.scripts} scripts</em></li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="ind-sec">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">Your business</p>
              <h2>See your own site, rebuilt free.</h2>
            </div>
            <div>
              <p>Paste your website’s address and see it rebuilt on SaySites, with your own words and photos, side by side with what it is today. <a href="/redesign">Get your free redesign</a>.</p>
              <p className="rp-note">How we measured: the homepage’s HTML as served, its script and stylesheet tags, its structured data, its viewport setting, its headings and its image descriptions. We don’t judge design or content. Want your business left out of this report? <a href="/#talk">Tell us</a> and we’ll remove it.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
