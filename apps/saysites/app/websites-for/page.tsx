import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { INDUSTRIES } from '@/lib/industries'
import '../home.css'

export const metadata: Metadata = {
  title: 'Websites for local businesses, by trade',
  description: 'Websites built for law firms, plumbers, dentists, salons, restaurants and more: written for your trade and your town, fast, and easy to change by asking.',
  alternates: { canonical: '/websites-for' },
}

export default function IndustriesHub() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">By business</p>
          <h1>A website made for what you do.</h1>
          <p>Every trade gets found differently. A law firm needs practice area pages and trust; a plumber needs a phone number and a service area; a café needs hours and a menu. Pick yours to see what SaySites builds.</p>
        </div>
      </section>
      <section className="ind-sec">
        <div className="wrap">
          <ul className="ind-hub">
            {INDUSTRIES.map((i) => (
              <li key={i.slug}>
                <a href={`/websites-for/${i.slug}`}>
                  <img src={`/media/logos/${i.example}-icon.svg`} alt="" width={44} height={44} />
                  <span><b>{i.h1.replace(/\.$/, '')}</b><small>{i.lede}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  )
}
