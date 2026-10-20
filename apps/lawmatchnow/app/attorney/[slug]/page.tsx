import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SimpleLeadForm } from '@/components/LeadForm'
import { Avatar, CaseReviewCard, JsonLd, PageHero, Stars } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { cityHubFor, getAttorney, locationLabel, type Attorney } from '@/lib/directory'
import { stateByCode } from '@/lib/geo'
import { abs, cleanHtml } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 3600

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
// Profiles with a real description or a claimed owner are worth indexing;
// bare name-and-city stubs are not.
const substantial = (a: Attorney) => a.claimed || plain(a.bio).length > 240

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAttorney((await params).slug)
  if (!a) return { title: 'Attorney not found', robots: { index: false } }
  const areas = PRACTICE_AREAS.filter((p) => a.practiceSlugs.includes(p.slug)).map((p) => p.name)
  const desc = plain(a.bio).slice(0, 155) || `${a.name}${a.firm && a.firm !== a.name ? ` of ${a.firm}` : ''}, ${areas.slice(0, 2).join(' and ').toLowerCase() || 'attorney'} in ${locationLabel(a)}.`
  return {
    title: `${a.name}, ${areas[0] ?? 'Attorney'} in ${locationLabel(a)}`,
    description: desc,
    alternates: { canonical: `/attorney/${a.slug}` },
    robots: substantial(a) ? undefined : { index: false, follow: true },
    openGraph: { type: 'profile', title: a.name, description: desc, url: abs(`/attorney/${a.slug}`), images: a.photo ? [a.photo] : undefined },
  }
}

export default async function AttorneyPage({ params }: Props) {
  const a = await getAttorney((await params).slug)
  if (!a) notFound()
  const areas = PRACTICE_AREAS.filter((p) => a.practiceSlugs.includes(p.slug))
  const st = stateByCode(a.state)
  const hub = cityHubFor(a)
  const crumbs = [
    ...(st ? [{ name: st.name, path: `/state/${st.slug}` }] : []),
    ...(hub ? [{ name: hub.name, path: `/${hub.slug}` }] : []),
    { name: a.name, path: `/attorney/${a.slug}` },
  ]
  const facts: [string, string][] = [
    ['Firm', a.firm !== a.name ? a.firm : ''],
    ['Location', [a.address, locationLabel(a), a.zip].filter(Boolean).join(', ')],
    ['Experience', a.yearsExperience ? `${a.yearsExperience}+ years` : ''],
    ['Education', a.education],
    ['Bar admissions', a.barAdmissions],
    ['Languages', a.languages],
    ['Consultations', a.consultation],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Attorney',
        '@id': abs(`/attorney/${a.slug}#attorney`),
        name: a.firm && a.firm !== a.name ? `${a.name}, ${a.firm}` : a.name,
        url: abs(`/attorney/${a.slug}`),
        ...(a.photo && { image: a.photo }),
        ...(a.phone && { telephone: a.phone }),
        ...(a.website && { sameAs: [a.website] }),
        address: { '@type': 'PostalAddress', streetAddress: a.address || undefined, addressLocality: a.city, addressRegion: a.state, postalCode: a.zip || undefined, addressCountry: 'US' },
        knowsAbout: areas.map((p) => p.name),
        ...(a.languages && { knowsLanguage: a.languages.split(/,\s*/) }),
      }} />
      <PageHero crumbs={crumbs} title="">
        <div className="profile-head" style={{ marginTop: -12 }}>
          <Avatar a={a} large />
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {a.tier !== 'free' && <span className="badge featured">Featured</span>}
              {a.claimed && <span className="badge verified">✓ Claimed profile</span>}
            </div>
            <h1>{a.name}</h1>
            <p className="lede">{[areas[0]?.name ?? 'Attorney', locationLabel(a)].filter(Boolean).join(' · ')}{a.firm && a.firm !== a.name ? ` · ${a.firm}` : ''}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              {a.phone && <a className="btn btn-primary" href={`tel:${a.phone.replace(/[^\d+]/g, '')}`}>Call {a.phone}</a>}
              <a className="btn btn-ghost" href="#contact">Send a message</a>
              {a.website && <a className="btn btn-ghost" href={a.website} rel="nofollow noopener" target="_blank">Website ↗</a>}
            </div>
          </div>
        </div>
      </PageHero>
      <section className="section">
        <div className="wrap layout">
          <div className="stack">
            <Stars rating={a.rating} count={a.reviewsCount} />
            {a.bio ? (
              <div className="prose">
                <h2 className="mt-0">About {a.name}</h2>
                <div dangerouslySetInnerHTML={{ __html: cleanHtml(a.bio) }} />
              </div>
            ) : null}
            {facts.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>At a glance</h2>
                <dl className="facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              </div>
            )}
            {areas.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Practice areas</h2>
                <div className="tags">{areas.map((p) => <Link key={p.slug} className="tag" href={hub ? `/${hub.slug}/${p.slug}` : `/practice-area/${p.slug}`}>{p.name}</Link>)}</div>
              </div>
            )}
            <div id="contact" className="card" style={{ scrollMarginTop: 100 }}>
              <h2 style={{ fontSize: '1.8rem' }}>Contact {a.name}</h2>
              <p className="muted">Your message goes to this attorney&apos;s office. Don&apos;t include confidential details until you&apos;ve spoken with them.</p>
              <SimpleLeadForm kind="contact-attorney" attorney={{ slug: a.slug, name: a.name }} submitLabel="Send message" />
            </div>
            {!a.claimed && (
              <p className="notice">
                This listing was compiled from public sources and hasn&apos;t been reviewed by the attorney. Details may be out of
                date. Are you {a.name}? <Link href="/for-attorneys#claim">Claim this profile</Link> to update it.
              </p>
            )}
          </div>
          <aside className="sidebar">
            <CaseReviewCard practice={areas[0]?.slug} />
            {hub && (
              <div className="card">
                <h3>More lawyers in {hub.name}</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {areas.slice(0, 4).map((p) => <li key={p.slug} style={{ padding: '3px 0' }}><Link href={`/${hub.slug}/${p.slug}`}>{p.lawyerTitle}</Link></li>)}
                  <li style={{ padding: '3px 0' }}><Link href={`/${hub.slug}`}>All {hub.name} attorneys</Link></li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
