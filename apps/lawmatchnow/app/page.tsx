import Link from 'next/link'
import { CtaBand, Faqs, SearchBar } from '@/components/ui'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, STATES } from '@/lib/geo'

export const revalidate = 86400

const HOME_FAQS = [
  {
    q: 'How do I find a good lawyer near me?',
    a: 'Start with the type of problem you have, because lawyers specialize. Search LawMatchNow by practice area and city, compare a few attorneys’ experience and focus, then schedule consultations with two or three before you decide. Our guide on how to choose a lawyer lists the questions to ask.',
  },
  {
    q: 'Is LawMatchNow free to use?',
    a: 'Yes. Searching the directory, reading guides and requesting a free case review cost you nothing. Attorneys can list themselves for free, and some pay for featured placement, which is always labeled.',
  },
  {
    q: 'How much does a first consultation with a lawyer cost?',
    a: 'Many lawyers offer a free or low-cost first consultation, especially in personal injury, criminal defense and bankruptcy. Others charge their normal hourly rate. Ask when you book so there are no surprises.',
  },
  {
    q: 'Is LawMatchNow a law firm?',
    a: 'No. LawMatchNow is a directory and legal information site. We don’t give legal advice, and using the site does not create an attorney-client relationship. An attorney you contact through the site can advise you on your situation.',
  },
]

export default function Home() {
  const featured = PRACTICE_AREAS.filter((p) => p.guide).slice(0, 12)
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="rise">
            <div className="eyebrow">The attorney directory, reconsidered</div>
            <h1>The right lawyer, <em>found</em> with care.</h1>
            <p className="lede">
              Search attorneys by legal issue and city across all 50 states, understand your options in plain English,
              and get a free case review. No cost, no obligation.
            </p>
            <SearchBar />
            <div className="search-hints">
              <span>Popular:</span>
              <Link href="/practice-area/personal-injury">Personal injury</Link>
              <Link href="/practice-area/family-law">Divorce</Link>
              <Link href="/practice-area/criminal-defense">Criminal defense</Link>
              <Link href="/practice-area/immigration">Immigration</Link>
            </div>
          </div>
          <aside className="hero-aside" aria-label="Why LawMatchNow">
            <ul>
              <li><b>{PRACTICE_AREAS.length} practice areas</b>From car accidents to cannabis licensing.</li>
              <li><b>All 50 states + DC</b>{CITIES.length} city guides and growing.</li>
              <li><b>Plain-English guides</b>Know your rights before you call.</li>
              <li><b>Free case review</b>Tell us once, hear from the right firms.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">01 · Practice areas</div>
              <h2>What kind of help do you need?</h2>
            </div>
            <p>Lawyers specialize. Start with your issue and we&apos;ll show attorneys who focus on it, plus what to expect.</p>
          </div>
          <div className="grid c4">
            {featured.map((p, i) => (
              <Link key={p.slug} href={`/practice-area/${p.slug}`} className="card area-card">
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.name}</h3>
                <p>{p.short}</p>
                <span className="go">Find {p.lawyerTitle.toLowerCase()} →</span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 24 }}><Link className="link-arrow" href="/practice-areas">See all {PRACTICE_AREAS.length} practice areas</Link></p>
        </div>
      </section>

      <section className="section dark">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">02 · How it works</div>
              <h2>From “what do I do?” to a conversation with a lawyer.</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step"><h3>Describe your situation</h3><p>Search by issue and location, or answer three short questions in our free case review.</p></div>
            <div className="step"><h3>Compare attorneys</h3><p>See each lawyer&apos;s focus, experience, location and languages. Featured listings are always labeled.</p></div>
            <div className="step"><h3>Talk before you commit</h3><p>Contact the firms you like. Most offer a consultation, and you&apos;re never obligated to hire anyone.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">03 · Locations</div>
              <h2>Find a lawyer in your city.</h2>
            </div>
            <p>Local lawyers know the local courts, judges and deadlines. Browse by city or by state.</p>
          </div>
          <ul className="link-columns c4">
            {CITIES.slice(0, 32).map((c) => (
              <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}</Link><small>{c.state}</small></li>
            ))}
          </ul>
          <p style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link className="link-arrow" href="/cities">All cities</Link>
            <Link className="link-arrow" href="/states">All {STATES.length} states and DC</Link>
          </p>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">04 · Learn the law</div>
              <h2>Understand your options before you call.</h2>
            </div>
            <p>Clear, carefully reviewed guides that answer the questions people ask most.</p>
          </div>
          <div className="grid c3">
            {GUIDES.slice(0, 6).map((g) => (
              <Link key={g.slug} href={`/guide/${g.slug}`} className="card">
                <div className="eyebrow" style={{ marginBottom: 10 }}>{g.category}</div>
                <h3>{g.title}</h3>
                <p>{g.description}</p>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link className="link-arrow" href="/guides">All legal guides</Link>
            <Link className="link-arrow" href="/questions">Common legal questions</Link>
            <Link className="link-arrow" href="/glossary">Legal dictionary</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="trust">
            <div><b>Free for you</b><span>Search, guides and case reviews never cost you anything.</span></div>
            <div><b>Labeled ads</b><span>Paid placements are marked “Featured”, every time.</span></div>
            <div><b>Real listings</b><span>We hide incomplete or unverifiable listings rather than pad results.</span></div>
            <div><b>Your privacy</b><span>We only share your details with attorneys when you ask us to.</span></div>
          </div>
        </div>
      </section>

      <CtaBand />

      <section className="section">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="eyebrow">05 · Questions</div>
          <h2>Frequently asked questions</h2>
          <Faqs faqs={HOME_FAQS} />
        </div>
      </section>
    </>
  )
}
