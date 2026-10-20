import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { CtaBand, PageHero, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, cityBySlug, citiesInState, stateByCode } from '@/lib/geo'

type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> }
export const revalidate = 3600
export const dynamicParams = false
export const generateStaticParams = () => CITIES.map((c) => ({ city: c.slug }))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).city)
  if (!c) return {}
  return {
    title: `${c.name}, ${c.state} Lawyers: Find a Local Attorney`,
    description: `Find attorneys in ${c.name}, ${stateByCode(c.state)?.name} by practice area. Compare local lawyers and request a free case review.`,
    alternates: { canonical: `/${c.slug}` },
    robots: pageParam((await searchParams).page) > 1 ? { index: false, follow: true } : undefined,
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const c = cityBySlug((await params).city)
  if (!c) notFound()
  const st = stateByCode(c.state)!
  const page = pageParam((await searchParams).page)
  const nearby = citiesInState(c.state).filter((x) => x.slug !== c.slug)
  return (
    <>
      <PageHero crumbs={[{ name: st.name, path: `/state/${st.slug}` }, { name: c.name, path: `/${c.slug}` }]} eyebrow={`${c.name}, ${st.name}`}
        title={<>Lawyers in <em>{c.name}</em></>}
        lede={`Find ${c.name} attorneys by legal issue. Local lawyers know ${st.name} law and the courts where your case will be heard.`}>
        <div style={{ marginTop: 28 }}><SearchBar location={`${c.name}, ${c.state}`} /></div>
      </PageHero>
      <section className="section">
        <div className="wrap">
          <DirectoryResults query={{ city: c.name, state: c.state, page }} heading={`Attorneys in ${c.name}`} basePath={`/${c.slug}`}
            aside={nearby.length > 0 && (
              <div className="card">
                <h3>Elsewhere in {st.name}</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>{nearby.map((x) => <li key={x.slug} style={{ padding: '3px 0' }}><Link href={`/${x.slug}`}>{x.name}</Link></li>)}</ul>
              </div>
            )} />
        </div>
      </section>
      <section className="section alt">
        <div className="wrap">
          <div className="eyebrow">By practice area</div>
          <h2>{c.name} lawyers by issue</h2>
          <ul className="link-columns c4">
            {PRACTICE_AREAS.map((p) => <li key={p.slug}><Link href={`/${c.slug}/${p.slug}`}>{p.name}</Link></li>)}
          </ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
