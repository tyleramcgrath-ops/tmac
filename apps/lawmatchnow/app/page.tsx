import Link from 'next/link'
import { IssueFinder, type Issue } from '@/components/fx/IssueFinder'
import { JusticeReveal } from '@/components/fx/JusticeReveal'
import { Odometer } from '@/components/fx/Odometer'
import { PenFlow } from '@/components/fx/PenFlow'
import { PracticeLens, type LensItem } from '@/components/fx/PracticeLens'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { UsMap } from '@/components/fx/UsMap'
import { JsonLd, SearchBar } from '@/components/ui'
import { searchAttorneys } from '@/lib/directory'
import { GLOSSARY } from '@/lib/content/glossary'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, STATES } from '@/lib/geo'
import { photoUrl, type PhotoKey } from '@/lib/photos'
import { faqLd } from '@/lib/site'
import './home.css'

export const revalidate = 3600

const HOME_FAQS = [
  { q: 'Is LawMatchNow free to use?', a: 'Yes. Searching the directory, reading guides and requesting a free case review cost you nothing, and you don’t need an account. Attorneys can list themselves for free; paid placements are always labeled “Featured”.' },
  { q: 'Is LawMatchNow a law firm?', a: 'No. We’re a directory and legal information site that helps you find and compare attorneys. We don’t give legal advice, and using the site doesn’t create an attorney-client relationship.' },
  { q: 'How do I know what kind of lawyer I need?', a: 'Use the “What happened?” picker above, or browse our practice-area guides, which explain what each type of lawyer handles, what they usually cost and what to ask.' },
  { q: 'How much does a first consultation cost?', a: 'Many lawyers offer a free or low-cost first consultation, especially in injury, criminal defense and bankruptcy. Others charge their normal rate. Ask when you book.' },
  { q: 'I’m an attorney. How do I get listed?', a: 'Claim your free profile from the For Attorneys page. We verify your bar license, then you can choose your practice areas and keep your details up to date.' },
]

// "What happened?" picker: plain words, the practice area, and a photo for the panel.
const SITUATIONS: [string, string, PhotoKey][] = [
  ['Hurt in an accident', 'personal-injury', 'gavel'],
  ['Arrested or charged', 'criminal-defense', 'columns'],
  ['Divorce or custody', 'family-law', 'signing'],
  ['Visa or green card', 'immigration', 'scotus'],
  ['Pulled over for DUI', 'dui-dwi', 'justice'],
  ['Problem at work', 'employment-law', 'library'],
]

const LENS: [string, string, PhotoKey][] = [
  ['personal-injury', 'Accidents and injuries', 'gavel'], ['criminal-defense', 'Charges and arrests', 'columns'],
  ['family-law', 'Divorce and custody', 'signing'], ['immigration', 'Visas and citizenship', 'scotus'],
  ['bankruptcy', 'Debt relief and filing', 'library'], ['employment-law', 'Workplace rights', 'signing'],
  ['estate-planning', 'Wills and trusts', 'library'], ['medical-malpractice', 'Medical negligence', 'justice'],
  ['dui-dwi', 'Impaired driving charges', 'columns'], ['workers-compensation', 'Injured on the job', 'gavel'],
  ['real-estate', 'Property and closings', 'scotus'], ['business-law', 'Contracts and companies', 'justice'],
]

const HOME_CITIES = ['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'dallas', 'atlanta', 'phoenix', 'seattle', 'denver', 'boston', 'san-francisco']

export default async function Home() {
  const area = (slug: string) => PRACTICE_AREAS.find((p) => p.slug === slug)!
  const issues: Issue[] = SITUATIONS.map(([label, slug, img]) => {
    const p = area(slug)
    return { label, slug, name: p.name, title: p.lawyerTitle, short: p.guide?.overview[0] ?? p.short, steps: p.guide?.whenToHire.slice(0, 4) ?? [], img: photoUrl(img, 1000) }
  })
  const lens: LensItem[] = LENS.map(([slug, sub, img]) => ({ href: `/practice-area/${slug}`, name: area(slug).name, sub, img: photoUrl(img, 700) }))
  const { total: listings } = await searchAttorneys({ perPage: 1 })
  const guideCount = GUIDES.length + PRACTICE_AREAS.filter((p) => p.guide).length
  const nums = [
    ...(listings > 0 ? [{ n: listings, label: 'Attorney listings' }] : []),
    { n: PRACTICE_AREAS.length, label: 'Practice areas' },
    { n: STATES.length, label: 'States + D.C.' },
    { n: CITIES.length, label: 'City guides' },
    { n: guideCount, label: 'Legal guides' },
    ...(listings > 0 ? [] : [{ n: GLOSSARY.length, label: 'Legal terms explained' }]),
  ]
  const rule = (no: string, label: string) => (
    <div className="h5-rule reveal"><span className="no">{no}</span><span>{label}</span><span className="ln" /></div>
  )

  return (
    <div className="h5">
      <RevealOnScroll />
      <JsonLd data={faqLd(HOME_FAQS)} />
      <JusticeReveal photo={photoUrl('scotus', 2000)} caption="Washington, D.C.">
        <h1 className="jr-h1">
          <span className="jr-line"><span>The right attorney,</span></span>
          <span className="jr-line"><span>found with <em>care</em>,</span></span>
          <span className="jr-line"><span>not guesswork.</span></span>
        </h1>
        <div className="jr-side">
          <p>A free directory of US attorneys, organized by what actually happened to you and where you live.</p>
          <div className="jr-facts"><span><i />Free to use</span><span><i />All 50 states + D.C.</span><span><i />No sign-up</span></div>
        </div>
        <div className="jr-card">
          <div className="jr-card-head"><h2>Find a lawyer near you</h2><span>Search {PRACTICE_AREAS.length} practice areas across the country</span></div>
          <SearchBar />
          <div className="search-hints">
            <span>Popular:</span>
            <Link href="/practice-area/personal-injury">Car accident</Link>
            <Link href="/practice-area/family-law">Divorce</Link>
            <Link href="/practice-area/criminal-defense">Criminal defense</Link>
            <Link href="/practice-area/immigration">Immigration</Link>
          </div>
        </div>
      </JusticeReveal>

      <PenFlow>
        <section className="h5-sec h5-stone" data-flow>
          <div className="wrap">
            {rule('01', 'Start here')}
            <div className="h5-head">
              <h2 className="reveal">What <em>happened?</em></h2>
              <p className="reveal">Not sure what kind of lawyer you need? Pick the situation closest to yours and we&apos;ll point you in the right direction.</p>
            </div>
            <div className="reveal"><IssueFinder issues={issues} /></div>
          </div>
        </section>

        <section className="h5-sec" data-flow>
          <div className="wrap">
            {rule('02', 'Practice areas')}
            <div className="h5-head">
              <h2 className="reveal">Every area of law, <em>in plain English.</em></h2>
              <p className="reveal">Twelve places to start, each with its own guide to costs, common cases and what to ask.</p>
            </div>
            <PracticeLens items={lens} />
            <div className="h5-foot reveal"><span>{PRACTICE_AREAS.length} practice areas, from car accidents to cannabis licensing.</span><Link href="/practice-areas" className="btn btn-ghost">All practice areas →</Link></div>
          </div>
        </section>

        <section className="h5-nums" data-flow>
          <div className="wrap"><Odometer items={nums} /></div>
        </section>

        <section className="h5-sec" data-flow>
          <div className="wrap">
            {rule('03', 'How it works')}
            <div className="h5-head">
              <h2 className="reveal">Three calm steps <em>to counsel.</em></h2>
              <p className="reveal">No account, no fees, no pressure. You stay in control of who you talk to.</p>
            </div>
            <div className="h5-steps reveal">
              <div className="track"><i /></div>
              <div className="h5-step"><div className="dot">i</div><h3>Describe your situation</h3><p>Search by issue and city, or answer three short questions in our free case review.</p></div>
              <div className="h5-step"><div className="dot">ii</div><h3>Compare attorneys</h3><p>See each lawyer&apos;s focus, experience, location and languages. Paid listings are always labeled.</p></div>
              <div className="h5-step"><div className="dot">iii</div><h3>Talk before you commit</h3><p>Contact the firms you like. Many offer a first conversation at no cost, and you&apos;re never obligated to hire.</p></div>
            </div>
            <p className="reveal" style={{ marginTop: 48 }}><Link href="/get-started" className="btn btn-primary">Start a free case review →</Link></p>
          </div>
        </section>

        <section className="h5-sec h5-stone" data-flow>
          <div className="wrap">
            {rule('04', 'Locations')}
            <div className="h5-head">
              <h2 className="reveal">Local lawyers, <em>coast to coast.</em></h2>
              <p className="reveal">{CITIES.length} city guides and all {STATES.length} state pages, including D.C. Start with a major city, or choose any state on the map.</p>
            </div>
            <div className="h5-cities">
              {HOME_CITIES.map((s, i) => {
                const c = CITIES.find((x) => x.slug === s)!
                return (
                  <Link key={s} href={`/${s}`} className="h5-city reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                    <div className="top"><span>CITY GUIDE</span><span className="st">{c.state}</span></div>
                    <h3>{c.name}</h3>
                    <div className="more"><span>Find lawyers</span><span>→</span></div>
                    <i className="bar" />
                  </Link>
                )
              })}
            </div>
            <div className="map-card reveal" style={{ marginTop: 40 }}><UsMap /></div>
            <div className="h5-locfoot reveal">
              <span>Browse by state:</span>
              {['california', 'texas', 'florida', 'new-york', 'illinois'].map((s) => { const st = STATES.find((x) => x.slug === s)!; return <Link key={s} href={`/state/${s}`}>{st.name}</Link> })}
              <Link href="/states">All {STATES.length} →</Link>
            </div>
          </div>
        </section>

        <section className="h5-sec" data-flow>
          <div className="wrap">
            {rule('05', 'Learn the law')}
            <div className="h5-head">
              <h2 className="reveal">Know where you stand <em>before you call.</em></h2>
              <p className="reveal">Plain-English guides, reviewed and dated, plus {GLOSSARY.length} legal terms explained.</p>
            </div>
            <div className="h5-guides reveal">
              {GUIDES.slice(0, 6).map((g, i) => (
                <Link key={g.slug} href={`/guide/${g.slug}`} className="h5-guide">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="k">{g.category} · {g.readMinutes} min</span>
                  <span className="t">{g.title}</span>
                  <span className="go">Read →</span>
                </Link>
              ))}
            </div>
            <div className="h5-foot reveal"><span>Also: <Link href="/questions">common legal questions</Link> and the <Link href="/glossary">legal dictionary</Link>.</span><Link href="/guides" className="btn btn-ghost">All legal guides →</Link></div>
          </div>
        </section>

        <section className="h5-sec" data-flow>
          <div className="wrap">
            {rule('06', 'For law firms')}
            <div className="h5-firms reveal">
              <div className="h5-firms-photo" style={{ backgroundImage: `url(${photoUrl('signing', 1600)})` }} />
              <div className="h5-firms-copy">
                <div className="eyebrow">For attorneys</div>
                <h2>Your next client is searching <em>right now.</em></h2>
                <p>People come to LawMatchNow looking for a lawyer in a specific practice area and city. Make sure they find you.</p>
                <ul>
                  <li>Free profile, listed in your practice areas</li>
                  <li>Appear on your city and state pages</li>
                  <li>Pages built for Google and AI assistants</li>
                  <li>We never take a share of your fees</li>
                </ul>
                <div className="row"><Link href="/for-attorneys#claim" className="btn btn-primary">Claim your free profile →</Link><Link href="/for-attorneys" className="btn btn-ghost">Learn more</Link></div>
              </div>
            </div>
          </div>
        </section>

        <section className="h5-sec" style={{ paddingTop: 20 }} data-flow>
          <div className="wrap">
            {rule('07', 'Questions')}
            <div className="h5-faq">
              <div>
                <h2 className="reveal">Good to <em>know.</em></h2>
                <p className="reveal">Can&apos;t find your answer? Browse <Link href="/questions">common legal questions</Link> or <Link href="/contact">contact us</Link>.</p>
              </div>
              <div className="reveal">
                {HOME_FAQS.map((f, i) => (
                  <details key={f.q} open={i === 0}>
                    <summary>{f.q}<span className="pm" /></summary>
                    <div className="ans">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </PenFlow>

      <section className="h5-close">
        <div className="wrap h5-close-inner reveal">
          <h2>Start with <em>what happened.</em></h2>
          <p>Tell us in a few sentences. It&apos;s free, private and there&apos;s no obligation to hire anyone.</p>
          <div className="row"><Link href="/get-started" className="btn btn-primary">Free case review →</Link><Link href="/find-a-lawyer" className="btn btn-ghost">Browse lawyers</Link></div>
        </div>
      </section>
    </div>
  )
}
