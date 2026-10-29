import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { getStore } from '@/lib/store'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Local websites reports',
  description: 'What we measured on the websites of local businesses, city by city: page weight, scripts, and what Google and phones get from them.',
  alternates: { canonical: '/reports' },
}

export default async function ReportsIndex() {
  const reports = (await getStore().reports()).filter((r) => r.publishedAt)
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Local websites reports</p>
          <h1>How local websites really measure up.</h1>
          <p>City by city, we measure the public websites of local businesses: how heavy they are, what they load and what Google can read. The numbers, plainly.</p>
        </div>
      </section>
      <section className="ind-sec">
        <div className="wrap">
          {reports.length === 0 ? (
            <p>The first reports are on their way.</p>
          ) : (
            <ul className="rp-index">
              {reports.map((r) => (
                <li key={r.slug}><a href={`/reports/${r.slug}`}><strong>{r.title}</strong><span>{r.sites} sites, measured {r.measuredAt}</span></a></li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </MarketingShell>
  )
}
