import Link from 'next/link'
import { CityMap } from '@/components/fx/CityMap'
import { CountUp } from '@/components/fx/CountUp'
import { IssueFinder, type Issue } from '@/components/fx/IssueFinder'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { RotatingWord } from '@/components/fx/RotatingWord'
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

// The "What happened?" picker, in plain words people actually use.
const SITUATIONS: [string, string, string][] = [
  ['Hurt in an accident', '🚗', 'personal-injury'],
  ['Arrested or charged', '⚖️', 'criminal-defense'],
  ['Divorce or custody', '🏠', 'family-law'],
  ['Visa or green card', '🌎', 'immigration'],
  ['Pulled over for DUI', '🚨', 'dui-dwi'],
  ['Problem at work', '💼', 'employment-law'],
  ['Hurt on the job', '🦺', 'workers-compensation'],
  ['Buried in debt', '📉', 'bankruptcy'],
  ['Planning a will', '📜', 'estate-planning'],
  ['Medical mistake', '🩺', 'medical-malpractice'],
  ['Starting a business', '🏢', 'business-law'],
  ['Denied disability', '📋', 'social-security-disability'],
]

export default async function Home() {
  const featured = PRACTICE_AREAS.filter((p) => p.guide).slice(0, 12)
  const issues: Issue[] = SITUATIONS.flatMap(([label, icon, slug]) => {
    const p = PRACTICE_AREAS.find((x) => x.slug === slug)
    return p ? [{ label, icon, slug, name: p.name, title: p.lawyerTitle, short: p.guide?.overview[0] ?? p.short, steps: p.guide?.whenToHire.slice(0, 3) ?? [] }] : []
  })
  const { total: listings } = await searchAttorneys({ perPage: 1 })
  const questionCount = QUESTIONS.reduce((n, g) => n + g.items.length, 0)
  const [lead, ...rest] = GUIDES

  return (
    <>
      <RevealOnScroll />
      <section className="hero hero-x">
        <div className="hero-orbs" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap hero-grid">
          <div className="rise">
            <div className="eyebrow">Free · Private · All 50 states</div>
            <h1>
              When you&apos;re<br /><span className="nowrap"><RotatingWord words={['injured', 'arrested', 'divorcing', 'being sued', 'wrongly fired', 'in debt']} />,</span>
              <br /><em>find the right lawyer</em> fast.
            </h1>
            <p className="lede">
              Search attorneys by legal issue and city, understand your rights in plain English, and get a free case review in two minutes.
            </p>
            <SearchBar />
            <div className="search-hints">
              <span>Popular:</span>
              <Link href="/practice-area/personal-injury">Car accident</Link>
              <Link href="/practice-area/family-law">Divorce</Link>
              <Link href="/practice-area/criminal-defense">Criminal defense</Link>
              <Link href="/practice-area/immigration">Immigration</Link>
            </div>
          </div>
          <aside className="glass-card hero-card" aria-label="Free case review">
            <div className="glass-top"><span className="live-dot" /> Free case review</div>
            <ol className="mini-steps">
              <li><b>Tell us what happened</b><span>Pick your issue, add a few lines.</span></li>
              <li><b>We find the right firms</b><span>Attorneys who handle cases like yours.</span></li>
              <li><b>You decide</b><span>Talk first. No cost, no obligation.</span></li>
            </ol>
            <Link href="/get-started" className="btn btn-primary" style={{ width: '100%' }}>Start in 2 minutes →</Link>
            <p className="glass-foot">If you&apos;re in danger, call 911. <Link href="/emergency">Legal emergency steps</Link></p>
          </aside>
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...PRACTICE_AREAS, ...PRACTICE_AREAS].map((p, i) => <span key={i}>{p.name}<i>§</i></span>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">01 · Start here</div>
              <h2>What happened? <em>Tap one.</em></h2>
            </div>
            <p>Not sure what kind of lawyer you need? Pick the closest situation and we&apos;ll show you who handles it and what to do next.</p>
          </div>
          <div className="reveal"><IssueFinder issues={issues} /></div>
        </div>
      </section>

      <section className="stats-band reveal">
        <div className="wrap stats">
          {listings > 0 && <div><b><CountUp to={listings} /></b><span>attorney listings</span></div>}
          <div><b><CountUp to={PRACTICE_AREAS.length} /></b><span>practice areas</span></div>
          <div><b><CountUp to={STATES.length} /></b><span>states + D.C.</span></div>
          <div><b><CountUp to={CITIES.length} /></b><span>city guides</span></div>
          <div><b><CountUp to={GUIDES.length + PRACTICE_AREAS.filter((p) => p.guide).length} /></b><span>legal guides</span></div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">02 · Practice areas</div>
              <h2>Every kind of legal problem, <em>covered.</em></h2>
            </div>
            <p>Lawyers specialize. Start with your issue to see who focuses on it, what it costs and what to ask.</p>
          </div>
          <div className="grid c4">
            {featured.map((p, i) => (
              <Link key={p.slug} href={`/practice-area/${p.slug}`} className="card area-card glow-card reveal" style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
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

      <section className="section dark map-section">
        <div className="wrap map-grid">
          <div className="reveal">
            <div className="eyebrow">03 · Locations</div>
            <h2>Local lawyers in <em>{CITIES.length} cities</em> and every state.</h2>
            <p className="muted">Local attorneys know the courthouses, judges and deadlines where your case will be heard. Tap a city on the map, or browse the list.</p>
            <ul className="link-columns" style={{ marginTop: 24 }}>
              {CITIES.slice(0, 12).map((c) => <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}</Link><small>{c.state}</small></li>)}
            </ul>
            <p style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Link className="link-arrow" href="/cities">All cities</Link>
              <Link className="link-arrow" href="/states">All states</Link>
            </p>
          </div>
          <div className="reveal map-wrap"><CityMap /></div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">04 · How it works</div>
              <h2>From “what do I do?” to a lawyer who <em>gets it.</em></h2>
            </div>
          </div>
          <div className="steps light reveal">
            <div className="step"><h3>Describe your situation</h3><p>Search by issue and location, or answer three short questions in our free case review.</p></div>
            <div className="step"><h3>Compare attorneys</h3><p>See each lawyer&apos;s focus, experience, location and languages. Paid listings are always labeled.</p></div>
            <div className="step"><h3>Talk before you commit</h3><p>Contact the firms you like. Most offer a consultation, and you&apos;re never obligated to hire anyone.</p></div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">05 · Learn the law</div>
              <h2>Know where you stand <em>before</em> you call.</h2>
            </div>
            <p>Plain-English guides, reviewed and dated, answering the questions people ask most.</p>
          </div>
          <div className="bento reveal">
            <Link href={`/guide/${lead.slug}`} className="bento-lead">
              <span className="eyebrow">{lead.category}</span>
              <h3>{lead.title}</h3>
              <p>{lead.answer}</p>
              <span className="go">Read the guide · {lead.readMinutes} min →</span>
            </Link>
            {rest.slice(0, 4).map((g) => (
              <Link key={g.slug} href={`/guide/${g.slug}`} className="bento-item">
                <span className="tag">{g.category}</span>
                <h3>{g.title}</h3>
                <span className="go">{g.readMinutes} min read →</span>
              </Link>
            ))}
            <Link href="/questions" className="bento-item bento-dark">
              <b className="bento-num">{questionCount}</b>
              <h3>Common legal questions, answered</h3>
              <span className="go">Browse Q&amp;A →</span>
            </Link>
            <Link href="/glossary" className="bento-item bento-brass">
              <b className="bento-num">{GLOSSARY.length}</b>
              <h3>Legal terms in plain English</h3>
              <span className="go">Open the dictionary →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="firm-pitch reveal">
            <div>
              <div className="eyebrow">For law firms</div>
              <h2>Your next client is searching <em>right now.</em></h2>
              <p>People come here with a specific problem in a specific city. Claim your free profile and show up on the pages they read, built to be found on Google and cited by AI assistants.</p>
              <div className="btns">
                <Link href="/for-attorneys" className="btn btn-primary">See how it works</Link>
                <Link href="/for-attorneys#claim" className="btn btn-ghost">Claim your free profile</Link>
              </div>
            </div>
            <ul className="pitch-points">
              <li><b>Free to start</b>Basic profile, free forever</li>
              <li><b>Clients with intent</b>They searched your practice area and city</li>
              <li><b>Built for AI search</b>Pages ChatGPT, Claude and Google can read</li>
              <li><b>No fee-sharing</b>We never take a cut of your fees</li>
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />

      <section className="section">
        <div className="wrap reveal" style={{ maxWidth: 900 }}>
          <div className="eyebrow">06 · Questions</div>
          <h2>Frequently asked questions</h2>
          <Faqs faqs={HOME_FAQS} />
        </div>
      </section>
    </>
  )
}
