import Link from 'next/link'
import type { ReactNode } from 'react'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import type { Faq } from '@/lib/content/types'
import { CITIES } from '@/lib/geo'
import { breadcrumbLd, faqLd } from '@/lib/site'
import { type Attorney, locationLabel } from '@/lib/directory'

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped can't break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export type Crumb = { name: string; path: string }

export function Breadcrumbs({ crumbs, light = false }: { crumbs: Crumb[]; light?: boolean }) {
  const all = [{ name: 'Home', path: '/' }, ...crumbs]
  return (
    <nav className={`crumbs${light ? ' light' : ''}`} aria-label="Breadcrumb">
      <JsonLd data={breadcrumbLd(all)} />
      <ol>
        {all.map((c, i) => (
          <li key={c.path}>
            {i === all.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHero({ crumbs, eyebrow, title, lede, children }: {
  crumbs: Crumb[]; eyebrow?: string; title: ReactNode; lede?: ReactNode; children?: ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="wrap rise">
        <Breadcrumbs crumbs={crumbs} />
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title ? <h1>{title}</h1> : null}
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  )
}

export function Faqs({ faqs, schema = true }: { faqs: Faq[]; schema?: boolean }) {
  if (!faqs.length) return null
  return (
    <div className="faq">
      {schema && <JsonLd data={faqLd(faqs)} />}
      {faqs.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}

/** Plain GET form: works without JavaScript and lands on a crawlable results page. */
export function SearchBar({ practice = '', location = '' }: { practice?: string; location?: string }) {
  return (
    <form className="search" action="/find-a-lawyer" method="get" role="search">
      <label>
        <span>Legal issue</span>
        <select name="practice" defaultValue={practice} aria-label="Legal issue">
          <option value="">All practice areas</option>
          {[...PRACTICE_AREAS].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>City or state</span>
        <input name="location" defaultValue={location} placeholder="e.g. Miami, FL" list="lmn-cities" autoComplete="address-level2" aria-label="City or state" />
        <datalist id="lmn-cities">
          {CITIES.map((c) => <option key={c.slug} value={`${c.name}, ${c.state}`} />)}
        </datalist>
      </label>
      <button className="btn btn-primary" type="submit">Find lawyers</button>
    </form>
  )
}

const initials = (name: string) =>
  name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '§'

export function Avatar({ a, large = false }: { a: Pick<Attorney, 'name' | 'photo'>; large?: boolean }) {
  return (
    <div className={`avatar${large ? ' lg' : ''}`} aria-hidden="true">
      {a.photo ? <img src={a.photo} alt="" width={large ? 112 : 64} height={large ? 112 : 64} loading="lazy" /> : initials(a.name)}
    </div>
  )
}

export function Stars({ rating, count }: { rating: number | null; count: number }) {
  if (rating == null || !count) return null
  const full = Math.round(rating)
  return (
    <span>
      <span className="stars" aria-hidden="true">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>{' '}
      {rating.toFixed(1)} ({count} reviews)
    </span>
  )
}

export function AttorneyCard({ a }: { a: Attorney }) {
  const areas = PRACTICE_AREAS.filter((p) => a.practiceSlugs.includes(p.slug)).slice(0, 3)
  const featured = a.tier !== 'free'
  return (
    <article className={`atty${featured ? ' featured' : ''}`}>
      <Avatar a={a} />
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {featured && <span className="badge featured">Featured</span>}
          {a.claimed && <span className="badge verified">✓ Claimed profile</span>}
        </div>
        <h3><Link href={`/attorney/${a.slug}`}>{a.name}</Link></h3>
        {a.firm && a.firm !== a.name && <p className="firm">{a.firm}</p>}
        <div className="meta">
          {locationLabel(a) && <span>{locationLabel(a)}</span>}
          {a.yearsExperience ? <span>{a.yearsExperience}+ years</span> : null}
          <Stars rating={a.rating} count={a.reviewsCount} />
        </div>
        {areas.length > 0 && (
          <div className="tags">
            {areas.map((p) => <Link className="tag" key={p.slug} href={`/practice-area/${p.slug}`}>{p.name}</Link>)}
          </div>
        )}
      </div>
      <div className="actions">
        {a.phone && <a className="btn btn-ghost btn-sm" href={`tel:${a.phone.replace(/[^\d+]/g, '')}`}>Call</a>}
        <Link className="btn btn-dark btn-sm" href={`/attorney/${a.slug}`}>View profile</Link>
      </div>
    </article>
  )
}

export function CaseReviewCard({ practice }: { practice?: string }) {
  return (
    <div className="card cta-card">
      <div className="eyebrow">Free case review</div>
      <h3>Not sure who to call?</h3>
      <p>Tell us what happened in a few short steps. It&apos;s free, and there&apos;s no obligation to hire anyone.</p>
      <Link href={practice ? `/get-started?practice=${practice}` : '/get-started'} className="btn btn-primary">Start my free review</Link>
    </div>
  )
}

export function CtaBand({ title, text, practice }: { title?: string; text?: string; practice?: string }) {
  return (
    <section className="section tight">
      <div className="wrap">
        <div className="band">
          <div>
            <h2>{title ?? 'Talk to the right lawyer sooner.'}</h2>
            <p>{text ?? 'Answer a few questions about your situation and we’ll help you find attorneys who handle cases like yours. Free, private, no obligation.'}</p>
          </div>
          <div className="btns">
            <Link href={practice ? `/get-started?practice=${practice}` : '/get-started'} className="btn btn-primary">Free case review</Link>
            <Link href="/find-a-lawyer" className="btn btn-ghost">Browse lawyers</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 && <Link className="btn btn-ghost btn-sm" href={href(page - 1)} rel="prev">← Previous</Link>}
      <span className="btn btn-sm" aria-current="page">Page {page} of {pages}</span>
      {page < pages && <Link className="btn btn-ghost btn-sm" href={href(page + 1)} rel="next">Next →</Link>}
    </nav>
  )
}
