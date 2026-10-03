import type { Metadata } from 'next'
import Image from 'next/image'
import { Logo, LogoMark } from '@/components/Logo'
import { TalkForm } from '@/components/TalkForm'
import './home.css'

// saysites.com: SaySites as a website company for the industries that
// compete hardest online. No prices on the public site; businesses ask us
// ("Let's talk") or start with a free redesign of their current site. Why
// to switch from an agency lives on /about. A static-feeling page with no
// client JavaScript of its own; the example screenshots are our own work.

export const metadata: Metadata = {
  title: { absolute: 'SaySites: websites built to bring in leads' },
  description: 'Websites built to turn searches into calls, consultation requests and booked appointments, for law firms, medical practices, med spas and home services.',
  alternates: { canonical: '/' },
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=72`

const SECTORS = [
  { name: 'Law firms', href: '/websites-for/law-firms', photo: '1436450412740-6b988f486c6b', text: 'Practice area pages, attorney profiles and a consultation request on every home page. Three designs, so no two firms look alike.', links: [] as [string, string][] },
  { name: 'Medical practices', href: '/websites-for/medical-practices', photo: '1631217868264-e5b90bb7e133', text: 'Clear service pages, your providers by name and an appointment request on the home page, with the notices patients expect.', links: [] },
  { name: 'Med spas', href: '/websites-for/med-spas', photo: '1570172619644-dfd03ed5d881', text: 'Calm, polished sites that explain every treatment, set honest expectations and make booking a consultation easy.', links: [] },
  { name: 'Dental practices', href: '/websites-for/dentists', photo: '1629909613654-28e377c37b09', text: 'Calm, reassuring sites that answer new-patient questions, explain each treatment and make it easy to ask for an appointment.', links: [] },
  { name: 'Home services', href: '/websites-for', photo: '1749532125405-70950966b0e5', text: 'Sites that win the emergency search: a big call button, a page per service and the towns you cover.', links: [['Plumbers', '/websites-for/plumbers'], ['Heating and air', '/websites-for/hvac-companies'], ['Roofers', '/websites-for/roofers'], ['Electricians', '/websites-for/electricians']] },
]

const WORK = [
  { img: '/media/law/counsel.jpg', firm: 'calder-and-vane', name: 'Calder & Vane', kind: 'Personal injury, San Antonio' },
  { img: '/media/work/brightwater-family-medicine.jpg', firm: 'brightwater-family-medicine', name: 'Brightwater Family Medicine', kind: 'Family medicine, Charlotte' },
  { img: '/media/work/lumen-aesthetics.jpg', firm: 'lumen-aesthetics', name: 'Lumen Aesthetics', kind: 'Med spa, Scottsdale' },
  { img: '/media/law/classic.jpg', firm: 'hale-and-porter', name: 'Hale & Porter', kind: 'Estate and family law, Columbus' },
  { img: '/media/work/northpoint-orthopedics.jpg', firm: 'northpoint-orthopedics', name: 'Northpoint Orthopedics', kind: 'Orthopedics, Minneapolis' },
  { img: '/media/work/willow-dental.jpg', firm: 'willow-dental', name: 'Willow Dental', kind: 'Dental practice, Madison' },
  { img: '/media/law/modern.jpg', firm: 'ashgrove-defense', name: 'Ashgrove Defense', kind: 'Criminal defense, Nashville' },
  { img: '/media/work/rivertown-plumbing.jpg', firm: 'rivertown-plumbing', name: 'Rivertown Plumbing', kind: 'Plumbing, Rivertown' },
  { img: '/media/work/summit-heating-air.jpg', firm: 'summit-heating-air', name: 'Summit Heating & Air', kind: 'Heating and air, Boise' },
]

export default async function Home({ searchParams }: { searchParams: Promise<{ sent?: string; talk?: string }> }) {
  const sp = await searchParams
  return (
    <div className="home ag">
      <header className="nav">
        <div className="wrap">
          <Logo />
          <nav aria-label="Main">
            <details className="ag-menu hide-sm">
              <summary>Who we work with</summary>
              <div>
                <a href="/websites-for/law-firms">Law firms</a>
                <a href="/websites-for/medical-practices">Medical practices</a>
                <a href="/websites-for/med-spas">Med spas</a>
                <a href="/websites-for/dentists">Dental practices</a>
                <a href="/websites-for/plumbers">Plumbers</a>
                <a href="/websites-for/hvac-companies">Heating and air</a>
                <a href="/websites-for/roofers">Roofers</a>
                <a href="/websites-for/electricians">Electricians</a>
                <a href="/websites-for">Every industry</a>
              </div>
            </details>
            <a className="hide-sm" href="#work">Our work</a>
            <a className="hide-sm" href="/about">Why SaySites</a>
            <a className="hide-sm" href="/redesign">Free redesign</a>
            <a href="/login">Log in</a>
            <a className="b b-light b-sm" href="#talk">Let’s talk</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="ag-hero">
          <div className="wrap ag-hero-in">
            <div className="ag-hero-copy">
              <p className="lw-eyebrow">Law, medical, aesthetics, dental and home services</p>
              <h1>Websites built to bring in leads.</h1>
              <p className="lede">When someone searches for a lawyer, a doctor or a plumber, they call one of the first few businesses they find. We build fast, SEO fully optimized websites where every page is made to turn that search into a call, a consultation request or a booked appointment, and every lead lands in one inbox.</p>
              <div className="lw-acts">
                <a className="b b-light" href="#talk">Let’s talk</a>
                <a className="b lw-ghost" href="/redesign">See your site redesigned, free</a>
              </div>
            </div>
            <div className="ag-stack" aria-hidden="true">
              {[WORK[0], WORK[1], WORK[2]].map((w, i) => (
                <div key={w.firm} className={`ag-shot ag-shot-${i + 1}`}>
                  <Image src={w.img} alt="" width={1280} height={860} sizes="(max-width: 900px) 70vw, 460px" priority={i === 0} />
                </div>
              ))}
            </div>
          </div>
          <ul className="ag-strip" aria-label="Industries we build for">
            {['Personal injury', 'Family law', 'Criminal defense', 'Estate planning', 'Family medicine', 'Orthopedics', 'Med spas', 'Dentistry', 'Plumbing', 'Heating and air', 'Roofing', 'Electrical'].map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section className="ag-sec" id="industries">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Who we work with</p>
                <h2>Only the industries where a website wins the work.</h2>
              </div>
              <p>We focus on businesses where every new client starts with a search. Each industry gets designs, pages and wording made for how its customers decide.</p>
            </div>
            <div className="ag-sectors">
              {SECTORS.map((s, i) => (
                <article key={s.name} className="ag-sector">
                  <a className="ag-sector-img" href={s.href} tabIndex={-1} aria-hidden="true">
                    <Image src={U(s.photo)} alt="" fill sizes="(max-width: 900px) 92vw, 400px" style={{ objectFit: 'cover' }} priority={i === 0} />
                  </a>
                  <h3><a href={s.href}>{s.name}</a></h3>
                  <p>{s.text}</p>
                  {s.links.length > 0 && <p className="ag-sublinks">{s.links.map(([l, h]) => <a key={h} href={h}>{l}</a>)}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ag-sec ag-dark" id="work">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Our work</p>
                <h2>Every one is different.</h2>
              </div>
              <p>Real pages you can open, click and test on your phone. Each business gets its own design, words and photos, never a template with the name swapped.</p>
            </div>
            <div className="ag-work">
              {WORK.map((w) => (
                <a key={w.firm} className="ag-work-item" href={`/preview/${w.firm}`}>
                  <div className="ag-work-img"><Image src={w.img} alt={`The ${w.name} website`} width={1280} height={860} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 380px" /></div>
                  <b>{w.name}</b>
                  <span>{w.kind}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="ag-sec" id="how">
          <div className="wrap">
            <div className="head">
              <p className="kicker">How we work</p>
              <h2>You see it before you commit to anything.</h2>
            </div>
            <ol className="ag-steps">
              <li><b>A free redesign</b><span>Send us your current site. We rebuild it so you can see the difference, page by page, before we’ve even spoken.</span></li>
              <li><b>We build your site</b><span>Your services, your people and your words, written for the way your clients search and decide.</span></li>
              <li><b>You approve it</b><span>One private link to look through every page and ask for changes. Nothing goes live until you say so.</span></li>
              <li><b>You watch the leads</b><span>Every message, every tap on your phone number and every visit shows in your dashboard, with a weekly Visibility Score and changes whenever you ask.</span></li>
            </ol>
          </div>
        </section>

        <section className="ag-sec ag-proof">
          <div className="wrap ag-proof-in">
            <div><b>100</b><span>Google speed score on our example sites</span></div>
            <div><b>95+</b><span>required before any page can go live</span></div>
            <div><b>0</b><span>long-term contracts</span></div>
            <div><b>1</b><span>private link to review and approve your site</span></div>
          </div>
        </section>

        <section className="ag-sec" id="built">
          <div className="wrap">
            <div className="head">
              <p className="kicker">Built for leads</p>
              <h2>How your site brings in business.</h2>
            </div>
            <div className="feat-grid">
              <div><h3>A request form up front</h3><p>A consultation or appointment request on the home page itself, not buried on a contact page, and a request button on every service page.</p></div>
              <div><h3>One tap to call</h3><p>Your number is a button everywhere, with a call bar fixed to the bottom of every phone screen.</p></div>
              <div><h3>Text us, right there</h3><p>A corner button lets visitors text you, message you on WhatsApp or reach your Facebook page without leaving the site.</p></div>
              <div><h3>Every lead in one inbox</h3><p>Requests land in one inbox with call and reply buttons beside them, and every tap on your phone number is counted, page by page.</p></div>
              <div><h3>Found when they search</h3><p>A page for every service and town, fast on every phone, and your details marked up the way Google reads them.</p></div>
              <div><h3>Trust before they call</h3><p>Your people by name, plain answers to the questions clients ask, and the notices your industry expects. Nothing invented.</p></div>
            </div>
          </div>
        </section>

        <section className="ag-sec ag-switch">
          <div className="wrap ag-switch-in">
            <div>
              <p className="kicker">Already with an agency?</p>
              <h2>Here’s why businesses switch to SaySites.</h2>
            </div>
            <a className="b b-line" href="/about">Why SaySites</a>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="wrap faq-in">
            <div className="head">
              <p className="kicker">Questions</p>
              <h2>Good questions.</h2>
            </div>
            <div className="qa">
              <details><summary>What does it cost?</summary><p>It depends on what your business needs, so we quote after a short conversation. There’s no setup fee and no long-term contract, and you can see a free redesign of your current site before you decide anything.</p></details>
              <details><summary>How long does it take?</summary><p>Your free redesign is ready in under a minute. A finished site depends on how many pages and people it covers; we’ll tell you when we talk, and you approve it before it goes live.</p></details>
              <details><summary>Will I lose what my current site ranks for?</summary><p>We keep your pages at the same addresses wherever we can, and set up redirects for the rest, so links and search results keep working.</p></details>
              <details><summary>Can I make changes myself?</summary><p>Yes. Ask us, or log in and change anything yourself, in plain words. You see every change before it goes live.</p></details>
              <details><summary>Can you promise more leads?</summary><p>No one honestly can promise a number. What we promise is a site where contacting you takes one tap, built the way Google’s own guidelines describe, and a dashboard that shows every message, call tap and visit, so you can see exactly what it brings in.</p></details>
            </div>
          </div>
        </section>

        <section className="ag-talk" id="talk">
          <div className="wrap ag-talk-in">
            <div>
              <LogoMark size={40} />
              <h2>Let’s talk about getting you more leads.</h2>
              <p>Tell us about your business and the clients you want more of. We’ll get back to you to talk it through, with no pressure and no jargon.</p>
              <p className="ag-talk-alt">Rather see it first? <a href="/redesign">Get a free redesign of your current site.</a></p>
            </div>
            <TalkForm from="/" sent={sp.sent === '1'} missing={sp.talk === 'missing'} />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <Logo />
          <nav aria-label="Footer"><a href="/websites-for">Who we work with</a><a href="/about">Why SaySites</a><a href="/redesign">Free redesign</a><a href="/templates">Our work</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Log in</a></nav>
          <span>© {new Date().getFullYear()} SaySites</span>
        </div>
      </footer>
    </div>
  )
}
