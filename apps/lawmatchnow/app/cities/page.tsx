import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, PageHero } from '@/components/ui'
import { CITIES, stateByCode } from '@/lib/geo'

export const metadata: Metadata = {
  title: 'Find a Lawyer by City',
  description: `Find attorneys in ${CITIES.length} major U.S. cities, from New York and Los Angeles to Miami, Houston and Chicago.`,
  alternates: { canonical: '/cities' },
}

export default function Cities() {
  const sorted = [...CITIES].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <>
      <PageHero crumbs={[{ name: 'Cities', path: '/cities' }]} eyebrow="Locations" title="Find a lawyer in your city"
        lede="Local attorneys know the courthouses, judges and procedures where your case will be heard." />
      <section className="section">
        <div className="wrap">
          <ul className="link-columns c4">
            {sorted.map((c) => <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}</Link><small>{stateByCode(c.state)?.name}</small></li>)}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
