import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DirectoryResults, pageParam } from '@/components/Directory'
import { PageHero, SearchBar } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { resolveLocation } from '@/lib/geo'

type SP = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams
  const filtered = ['practice', 'location', 'q', 'page'].some((k) => one(sp[k]))
  return {
    title: 'Find a Lawyer Near You',
    description: 'Search attorneys by practice area, city and state. Compare experience and focus, then contact a lawyer or request a free case review.',
    alternates: { canonical: '/find-a-lawyer' },
    // Filtered result pages aren't indexed; the city and practice pages are.
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function FindALawyer({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const practiceSlug = one(sp.practice)
  const practice = PRACTICE_AREAS.find((p) => p.slug === practiceSlug)
  const locationText = one(sp.location)
  const text = one(sp.q)
  const page = pageParam(sp.page)
  const { city, state } = resolveLocation(locationText)

  // Searches that match a page we already publish go to that page, which has
  // richer content and is the one we want ranked.
  if (!text && page === 1) {
    if (city && practice) redirect(`/${city.slug}/${practice.slug}`)
    if (city && !practiceSlug) redirect(`/${city.slug}`)
    if (!locationText && practice) redirect(`/practice-area/${practice.slug}`)
    if (state && !city && !practiceSlug) redirect(`/state/${state.slug}`)
  }

  const where = city ? `${city.name}, ${city.state}` : state?.name ?? (locationText || '')
  const heading = [practice?.lawyerTitle ?? (text ? `Results for “${text}”` : 'Attorneys'), where && `in ${where}`].filter(Boolean).join(' ')
  const qs = new URLSearchParams(Object.entries({ practice: practiceSlug, location: locationText, q: text }).filter(([, v]) => v) as [string, string][])
  const filtered = qs.toString() !== ''

  return (
    <>
      <PageHero crumbs={[{ name: 'Find a Lawyer', path: '/find-a-lawyer' }]} eyebrow="Attorney directory" title="Find a lawyer" lede="Search by legal issue and location. Featured listings are paid placements and always labeled.">
        <div style={{ marginTop: 28 }}><SearchBar practice={practiceSlug} location={locationText} /></div>
      </PageHero>
      <section className="section">
        <div className="wrap">
          <DirectoryResults
            query={{ practice: practice?.slug, city: city?.name, state: state?.code, text, page }}
            heading={heading}
            basePath={`/find-a-lawyer${filtered ? `?${qs}` : ''}`}
            practiceSlug={practice?.slug}
          />
        </div>
      </section>
    </>
  )
}
