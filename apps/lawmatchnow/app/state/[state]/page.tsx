import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { CtaBand, PageHero, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { STATES, citiesInState, stateBySlug } from '@/lib/geo'

type Props = { params: Promise<{ state: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => STATES.map((s) => ({ state: s.slug }))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const s = stateBySlug((await params).state)
  if (!s) return {}
  return {
    title: `${s.name} Lawyers: Find an Attorney in ${s.code}`,
    description: `Find attorneys licensed in ${s.name} by city and practice area, including personal injury, family law, criminal defense and more.`,
    alternates: { canonical: `/state/${s.slug}` },
    robots: pageParam((await searchParams).page) > 1 ? { index: false, follow: true } : undefined,
  }
}

export default async function StatePage({ params, searchParams }: Props) {
  const s = stateBySlug((await params).state)
  if (!s) notFound()
  const page = pageParam((await searchParams).page)
  const cities = citiesInState(s.code)
  const top = PRACTICE_AREAS.filter((p) => p.guide)
  return (
    <>
      <PageHero crumbs={[{ name: 'States', path: '/states' }, { name: s.name, path: `/state/${s.slug}` }]} eyebrow={s.code}
        title={`${s.name} lawyers`}
        lede={`Attorneys must be licensed by the ${s.name} bar to give legal advice on ${s.name} law. Search by issue, or browse by city below.`}>
        <div style={{ marginTop: 28 }}><SearchBar location={s.name} /></div>
      </PageHero>
      <section className="section">
        <div className="wrap">
          <DirectoryResults query={{ state: s.code, page }} heading={`Attorneys in ${s.name}`} basePath={`/state/${s.slug}`}
            aside={cities.length > 0 && (
              <div className="card">
                <h3>Cities in {s.name}</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>{cities.map((c) => <li key={c.slug} style={{ padding: '3px 0' }}><Link href={`/${c.slug}`}>{c.name}</Link></li>)}</ul>
              </div>
            )} />
        </div>
      </section>
      <section className="section alt">
        <div className="wrap">
          <div className="eyebrow">By practice area</div>
          <h2>Find {s.name} lawyers by issue</h2>
          <ul className="link-columns">
            {top.map((p) => (
              <li key={p.slug}><Link href={`/find-a-lawyer?practice=${p.slug}&location=${encodeURIComponent(s.name)}`} rel="nofollow">{s.name} {p.lawyerTitle.toLowerCase()}</Link></li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
