import Link from 'next/link'
import { CountUp } from '@/components/fx/CountUp'
import { IssueFinder, type Issue } from '@/components/fx/IssueFinder'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { RotatingWord } from '@/components/fx/RotatingWord'
import { UsMap } from '@/components/fx/UsMap'
import { Photo } from '@/components/Photo'
import { CtaBand, Faqs, SearchBar } from '@/components/ui'
import { searchAttorneys } from '@/lib/directory'
import { GLOSSARY } from '@/lib/content/glossary'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { QUESTIONS } from '@/lib/content/questions'
import { CITIES, STATES } from '@/lib/geo'

export const revalidate = 3600

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

// The "What happened?" picker, in the words people actually use.
const SITUATIONS: [string, string][] = [
  ['Hurt in an accident', 'personal-injury'],
  ['Arrested or charged', 'criminal-defense'],
  ['Divorce or custody', 'family-law'],
  ['Visa or green card', 'immigration'],
  ['Pulled over for DUI', 'dui-dwi'],
  ['Problem at work', 'employment-law'],
  ['Hurt on the job', 'workers-compensation'],
  ['Buried in debt', 'bankruptcy'],
  ['Planning a will', 'estate-planning'],
  ['Medical mistake', 'medical-malpractice'],
  ['Starting a business', 'business-law'],
  ['Denied disability', 'social-security-disability'],
]

export default async function Home() {
  const featured = PRACTICE_AREAS.filter((p) => p.guide).slice(0, 12)
  const issues: Issue[] = SITUATIONS.flatMap(([label, slug]) => {
    const p = PRACTICE_AREAS.find((x) => x.slug === slug)
    return p ? [{ label, slug, name: p.name, title: p.lawyerTitle, short: p.guide?.overview[0] ?? p.short, steps: p.guide?.whenToHire.slice(0, 3) ?? [] }] : []
  })
  const { total: listings } = await searchAttorneys({ perPage: 1 })
  const questionCount = QUESTIONS.reduce((n, g) => n + g.items.length, 0)
  const [lead, ...rest] = GUIDES

  return (
    <>
      <RevealOnScroll />
      <section className="photo-hero">
        <Photo name="columns" className="photo-hero-img" priority />
        <div className="photo-hero-scrim" aria-hidden="true" />
        <div className="wrap photo-hero-inner rise">
          <div className="eyebrow light">America&apos;s attorney directory</div>
          <h1>
            When you&apos;re<br />
            <span className="nowrap"><RotatingWord words={['injured', 'arrested', 'divorcing', 'being sued', 'wrongly fired', 'in debt']} />,</span><br />
            find the right lawyer.
          </h1>
          <p className="lede">Search attorneys by legal issue and city across all 50 states, know your rights in plain English, and get a free case review.</p>
          <SearchBar />
          <div className="search-hints">
            <span>Popular:</span>
            <Link href="/practice-area/personal-injury">Car accident</Link>
            <Link href="/practice-area/family-law">Divorce</Link>
            <Link href="/practice-area/criminal-defense">Criminal defense</Link>
            <Link href="/practice-area/immigration">Immigration</Link>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="trustbar">
          <div><b>Free</b><span>for everyone looking for a lawyer</span></div>
          <div><b>{STATES.length}</b><span>states and D.C. covered</span></div>
          <div><b>{PRACTICE_AREAS.length}</b><span>practice areas</span></div>
          <div><b>Always labeled</b><span>paid listings, every time</span></div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Start here</div>
              <h2>What happened?</h2>
            </div>
            <p>Not sure what kind of lawyer you need? Choose the closest situation and we&apos;ll show you who handles it and what to do next.</p>
          </div>
          <div className="reveal"><IssueFinder issues={issues} /></div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Practice areas</div>
              <h2>Every kind of legal problem, covered.</h2>
            </div>
            <p>Lawyers specialize. Start with your issue to see who focuses on it, what it costs and what to ask.</p>
          </div>
          <div className="area-list reveal">
            {featured.map((p, i) => (
              <Link key={p.slug} href={`/practice-area/${p.slug}`} className="area-row">
                <span className="area-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="area-name">{p.name}</span>
                <span className="area-short">{p.short}</span>
                <span className="area-go" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 28 }}><Link className="btn btn-dark" href="/practice-areas">All {PRACTICE_AREAS.length} practice areas</Link></p>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div className="split-photo reveal"><Photo name="justice" sizes="(min-width: 1000px) 45vw, 100vw" /></div>
          <div className="reveal">
            <div className="eyebrow">How it works</div>
            <h2>From “what do I do?” to the right lawyer.</h2>
            <ol className="numbered">
              <li><b>Describe your situation</b><span>Search by issue and city, or answer three short questions in our free case review.</span></li>
              <li><b>Compare attorneys</b><span>See each lawyer&apos;s focus, experience, location and languages. Paid listings are always labeled.</span></li>
              <li><b>Talk before you commit</b><span>Contact the firms you like. Most offer a consultation, and you&apos;re never obligated to hire anyone.</span></li>
            </ol>
            <Link href="/get-started" className="btn btn-primary">Start a free case review</Link>
          </div>
        </div>
      </section>

      <section className="section map-section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Locations</div>
              <h2>Find a lawyer in your state or city.</h2>
            </div>
            <p>Local attorneys know the courthouses, judges and deadlines where your case will be heard. Choose your state, or a pinned city.</p>
          </div>
          <div className="map-card reveal">
            <UsMap />
            <div className="map-legend">
              <span><i className="lg-pin" /> City guide</span>
              <span><i className="lg-state" /> State with city guides</span>
              <span className="map-links"><Link className="link-arrow" href="/states">All states</Link><Link className="link-arrow" href="/cities">All {CITIES.length} cities</Link></span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band reveal">
        <div className="wrap stats">
          {listings > 0 && <div><b><CountUp to={listings} /></b><span>Attorney listings</span></div>}
          <div><b><CountUp to={PRACTICE_AREAS.length} /></b><span>Practice areas</span></div>
          <div><b><CountUp to={CITIES.length} /></b><span>City guides</span></div>
          <div><b><CountUp to={GUIDES.length + PRACTICE_AREAS.filter((p) => p.guide).length} /></b><span>Legal guides</span></div>
          <div><b><CountUp to={GLOSSARY.length} /></b><span>Legal terms explained</span></div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Learn the law</div>
              <h2>Know where you stand before you call.</h2>
            </div>
            <p>Plain-English guides, reviewed and dated, answering the questions people ask most.</p>
          </div>
          <div className="guides-grid reveal">
            <Link href={`/guide/${lead.slug}`} className="guide-feature">
              <Photo name="signing" sizes="(min-width: 900px) 50vw, 100vw" />
              <div className="guide-feature-body">
                <span className="kicker">{lead.category} · {lead.readMinutes} min read</span>
                <h3>{lead.title}</h3>
                <p>{lead.answer}</p>
              </div>
            </Link>
            <div className="guide-list">
              {rest.slice(0, 5).map((g) => (
                <Link key={g.slug} href={`/guide/${g.slug}`} className="guide-row">
                  <span className="kicker">{g.category}</span>
                  <span className="guide-title">{g.title}</span>
                  <span className="guide-meta">{g.readMinutes} min</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="learn-links reveal">
            <Link href="/questions"><b>{questionCount}</b> common legal questions, answered <span aria-hidden="true">→</span></Link>
            <Link href="/glossary"><b>{GLOSSARY.length}</b> legal terms in plain English <span aria-hidden="true">→</span></Link>
            <Link href="/guides"><b>All</b> legal guides <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="firm-banner">
        <Photo name="library" className="firm-banner-img" sizes="100vw" />
        <div className="firm-banner-scrim" aria-hidden="true" />
        <div className="wrap firm-banner-inner reveal">
          <div>
            <div className="eyebrow light">For law firms</div>
            <h2>Your next client is searching right now.</h2>
            <p>People come here with a specific problem in a specific city. Claim your free profile and appear on the pages they read, built to be found on Google and cited by AI assistants.</p>
            <div className="btns">
              <Link href="/for-attorneys" className="btn btn-primary">See how it works</Link>
              <Link href="/for-attorneys#claim" className="btn btn-outline-light">Claim your free profile</Link>
            </div>
          </div>
          <ul className="firm-points">
            <li><b>Free to start</b>A basic profile is free, permanently.</li>
            <li><b>Clients with intent</b>They searched your practice area and city.</li>
            <li><b>Built for AI search</b>Pages Google, ChatGPT and Claude can read.</li>
            <li><b>No fee-sharing</b>We never take a share of your fees.</li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap reveal" style={{ maxWidth: 900 }}>
          <div className="eyebrow">Questions</div>
          <h2>Frequently asked questions</h2>
          <Faqs faqs={HOME_FAQS} />
        </div>
      </section>

      <CtaBand />
    </>
  )
}
