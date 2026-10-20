import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SectionNav } from '@/components/fx/SectionNav'
import { UsMap } from '@/components/fx/UsMap'
import { SimpleLeadForm } from '@/components/LeadForm'
import { Avatar, Breadcrumbs, JsonLd, Stars } from '@/components/ui'
import { COMMON_FEES, FEE_TYPES } from '@/lib/content/fees'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { cityHubFor, getAttorney, locationLabel, searchAttorneys, type Attorney } from '@/lib/directory'
import { stateByCode } from '@/lib/geo'
import { abs, cleanHtml } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 3600

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
// Profiles with a real description or a claimed owner are worth indexing;
// bare name-and-city stubs are not.
const substantial = (a: Attorney) => a.claimed || plain(a.bio).length > 240
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

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
  const main = areas[0]
  const st = stateByCode(a.state)
  const hub = cityHubFor(a)
  const firm = a.firm && a.firm !== a.name ? a.firm : ''
  const crumbs = [
    ...(st ? [{ name: st.name, path: `/state/${st.slug}` }] : []),
    ...(hub ? [{ name: hub.name, path: `/${hub.slug}` }] : []),
    { name: a.name, path: `/attorney/${a.slug}` },
  ]
  const facts = [
    { k: 'Experience', v: a.yearsExperience ? `${a.yearsExperience}+ years in practice` : '' },
    { k: 'Bar admissions', v: a.barAdmissions },
    { k: 'Education', v: a.education },
    { k: 'Languages', v: a.languages },
    { k: 'Consultations', v: a.consultation ? a.consultation.replace(/^\w/, (c) => c.toUpperCase()) : '' },
    { k: 'Office', v: [a.address, locationLabel(a), a.zip].filter(Boolean).join(', ') },
  ].filter((f) => f.v)
  const fees = main ? COMMON_FEES[main.slug] ?? [] : []
  // "Employment Lawyers" → "an employment lawyer"
  const oneLawyer = main ? main.lawyerTitle.replace(/s$/, '').toLowerCase() : 'lawyer'
  const aLawyer = `${/^[aeiou]/.test(oneLawyer) ? 'an' : 'a'} ${oneLawyer}`

  // Other attorneys nearby with the same main practice area.
  const similar = (await searchAttorneys({ city: a.city, state: a.state, practice: main?.slug, perPage: 4 })).items
    .filter((x) => x.slug !== a.slug).slice(0, 3)

  const nav = [
    { id: 'about', label: 'About' },
    ...(areas.length ? [{ id: 'practice', label: 'Practice areas' }] : []),
    ...(facts.length ? [{ id: 'details', label: 'Details' }] : []),
    ...(main?.guide ? [{ id: 'ask', label: 'What to ask' }] : []),
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Attorney',
        '@id': abs(`/attorney/${a.slug}#attorney`),
        name: firm ? `${a.name}, ${firm}` : a.name,
        url: abs(`/attorney/${a.slug}`),
        ...(a.photo && { image: a.photo }),
        ...(a.phone && { telephone: a.phone }),
        ...(a.website && { sameAs: [a.website] }),
        address: { '@type': 'PostalAddress', streetAddress: a.address || undefined, addressLocality: a.city, addressRegion: a.state, postalCode: a.zip || undefined, addressCountry: 'US' },
        knowsAbout: areas.map((p) => p.name),
        ...(a.languages && { knowsLanguage: a.languages.split(/,\s*/) }),
      }} />

      <section className="pf-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={crumbs} light />
          <div className="pf-hero-grid rise">
            <div className="pf-id">
              <div className="pf-avatar"><Avatar a={a} large /></div>
              <div>
                <div className="pf-badges">
                  {a.claimed && <span className="badge verified">✓ Claimed profile</span>}
                  {a.tier !== 'free' && <span className="badge featured">Featured</span>}
                  {main && <span className="pf-kicker">{main.lawyerTitle.replace(/s$/, '')}</span>}
                </div>
                <h1>{a.name}</h1>
                <p className="pf-sub">{[firm, locationLabel(a)].filter(Boolean).join(' · ')}</p>
                <Stars rating={a.rating} count={a.reviewsCount} />
                <div className="pf-actions">
                  {a.phone && <a className="btn btn-primary" href={telHref(a.phone)}>Call {a.phone}</a>}
                  <a className={`btn ${a.phone ? 'btn-ghost' : 'btn-primary'}`} href="#contact">Send a message</a>
                  {a.website && <a className="btn btn-ghost" href={a.website} rel="nofollow noopener" target="_blank">Website ↗</a>}
                </div>
              </div>
            </div>
            <dl className="pf-quick">
              {a.yearsExperience ? <div><dt>Experience</dt><dd>{a.yearsExperience}+ yrs</dd></div> : null}
              {areas.length > 0 && <div><dt>Practice areas</dt><dd>{areas.length}</dd></div>}
              {a.languages && <div><dt>Languages</dt><dd>{a.languages.split(/,\s*/).length}</dd></div>}
              {fees.length > 0 && <div><dt>Typical fees</dt><dd className="pf-small">{fees.map((f) => FEE_TYPES.find((t) => t.key === f)!.name).join(' or ')}</dd></div>}
            </dl>
          </div>
        </div>
      </section>
      <SectionNav items={nav} />

      <section className="section">
        <div className="wrap layout">
          <div className="pf-main">
            <section id="about" className="reveal">
              <div className="eyebrow">About</div>
              <h2>About {a.name}</h2>
              {a.bio ? <div className="prose" dangerouslySetInnerHTML={{ __html: cleanHtml(a.bio) }} />
                : <p className="muted">{a.name} hasn&apos;t added a description yet.</p>}
              {main?.guide && (
                <div className="pf-context">
                  <span className="kicker">What {aLawyer} does</span>
                  <p>{main.guide.overview[0]}</p>
                  <Link className="link-arrow" href={`/practice-area/${main.slug}`}>Read the {main.name.toLowerCase()} guide</Link>
                </div>
              )}
            </section>

            {areas.length > 0 && (
              <section id="practice" className="reveal">
                <div className="eyebrow">Practice areas</div>
                <h2>What {a.name.split(' ')[0]} handles</h2>
                <div className="pf-areas">
                  {areas.map((p) => (
                    <Link key={p.slug} href={hub ? `/${hub.slug}/${p.slug}` : `/practice-area/${p.slug}`} className="pf-area">
                      <span className="pf-area-name">{p.name}</span>
                      <span className="pf-area-short">{p.short}</span>
                      <span className="pf-area-go">{hub ? `More ${p.lawyerTitle.toLowerCase()} in ${hub.name}` : `About ${p.name.toLowerCase()}`} →</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {facts.length > 0 && (
              <section id="details" className="reveal">
                <div className="eyebrow">Details</div>
                <h2>At a glance</h2>
                <dl className="pf-facts">{facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
                {hub && (
                  <div className="pf-map">
                    <UsMap highlight={hub.slug} />
                    <div className="map-mini-foot"><span>Serves <b>{hub.name}</b>, {st?.name}</span><Link className="link-arrow" href={`/${hub.slug}`}>All {hub.name} lawyers</Link></div>
                  </div>
                )}
              </section>
            )}

            {main?.guide && (
              <section id="ask" className="reveal">
                <div className="eyebrow">Your first call</div>
                <h2>Questions to ask {a.name.split(' ')[0]}</h2>
                <p className="muted">Good questions to ask {aLawyer} at a first consultation.</p>
                <ol className="numbered">{main.guide.questionsToAsk.map((q) => <li key={q}><b>{q}</b></li>)}</ol>
              </section>
            )}

            {!a.claimed && (
              <p className="notice reveal">
                This listing was compiled from public sources and hasn&apos;t been reviewed by the attorney, so details may be out of date.
                Are you {a.name}? <Link href="/for-attorneys#claim">Claim this profile</Link> to update it.
              </p>
            )}
          </div>

          <aside className="sidebar">
            <div id="contact" className="card pf-contact">
              <div className="eyebrow">Contact</div>
              <h3>Message {a.name.split(' ')[0]}</h3>
              <p className="muted">Your message goes to this attorney&apos;s office. Don&apos;t include confidential details until you&apos;ve spoken.</p>
              <SimpleLeadForm kind="contact-attorney" attorney={{ slug: a.slug, name: a.name }} submitLabel="Send message" />
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head reveal">
              <div><div className="eyebrow">Compare</div><h2>Similar attorneys{hub ? ` in ${hub.name}` : ''}</h2></div>
              <p>It&apos;s worth talking to two or three lawyers before you decide.</p>
            </div>
            <div className="pf-similar reveal">
              {similar.map((s) => {
                const sa = PRACTICE_AREAS.filter((p) => s.practiceSlugs.includes(p.slug)).slice(0, 2)
                return (
                  <Link key={s.slug} href={`/attorney/${s.slug}`} className="pf-sim">
                    <Avatar a={s} />
                    <div>
                      <span className="pf-sim-name">{s.name}</span>
                      <span className="pf-sim-meta">{[s.firm && s.firm !== s.name ? s.firm : '', locationLabel(s)].filter(Boolean).join(' · ')}</span>
                      {sa.length > 0 && <span className="pf-sim-areas">{sa.map((p) => p.name).join(' · ')}</span>}
                    </div>
                    <span className="pf-sim-go" aria-hidden="true">→</span>
                  </Link>
                )
              })}
            </div>
            <p className="reveal" style={{ marginTop: 24 }}>
              <Link className="btn btn-ghost" href={hub && main ? `/${hub.slug}/${main.slug}` : hub ? `/${hub.slug}` : '/find-a-lawyer'}>See more attorneys →</Link>
            </p>
          </div>
        </section>
      )}

      <section className="section tight">
        <div className="wrap">
          <div className="band reveal">
            <div>
              <h2>Not sure {a.name.split(' ')[0]} is the right fit?</h2>
              <p>Tell us what happened and we&apos;ll help you reach attorneys who handle cases like yours. Free, private, no obligation.</p>
            </div>
            <div className="btns">
              <Link href={main ? `/get-started?practice=${main.slug}` : '/get-started'} className="btn btn-primary">Free case review</Link>
              <Link href="/find-a-lawyer" className="btn btn-ghost">Browse lawyers</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
