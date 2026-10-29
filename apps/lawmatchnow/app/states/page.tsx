import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, PageHero } from '@/components/ui'
import { STATES, citiesInState } from '@/lib/geo'

export const metadata: Metadata = {
  title: 'Find a Lawyer by State',
  description: 'Browse attorneys in all 50 states and Washington, D.C. Choose your state to see lawyers by city and practice area.',
  alternates: { canonical: '/states' },
}

export default function States() {
  return (
    <>
      <PageHero crumbs={[{ name: 'States', path: '/states' }]} eyebrow="Locations" title={<>Lawyers in <em>every</em> state.</>}
        lede="Lawyers are licensed state by state, and each state has its own laws, courts and deadlines. Start with yours." />
      <section className="section">
        <div className="wrap">
          <ul className="link-columns c4">
            {STATES.map((s) => (
              <li key={s.code}>
                <Link href={`/state/${s.slug}`}>{s.name}</Link>
                {citiesInState(s.code).length > 0 && <small>{citiesInState(s.code).length} cities</small>}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
