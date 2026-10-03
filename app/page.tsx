import type { Metadata } from 'next'
import Image from 'next/image'
import { Logo, LogoMark } from '@/components/Logo'
import { PRICES } from '@/lib/billing'
import './home.css'

// saysites.com: law firms first. A static page with no client JavaScript of
// its own; everything else (trades, shops, restaurants) lives at /trades.
// The three designs are screenshots of the live example firms.

export const metadata: Metadata = {
  title: { absolute: 'Law firm websites that bring in consultations | SaySites' },
  description: 'Fast, SEO fully optimized law firm websites with practice area pages, attorney profiles and a consultation request on the home page. Build it yourself or have us build it. No contract.',
  alternates: { canonical: '/' },
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2000&q=75`

function Frame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="frame">
      <div className="frame-bar"><i /><i /><i /><span>{url}</span></div>
      <div className="frame-body">{children}</div>
    </div>
  )
}

const DESIGNS = [
  { key: 'counsel', name: 'Counsel', firm: 'calder-and-vane', label: 'Calder & Vane, personal injury', text: 'Dark and formal, with the consultation form right beside your headline. Made for firms whose clients need to act quickly.' },
  { key: 'classic', name: 'Classic', firm: 'hale-and-porter', label: 'Hale & Porter, estate and family law', text: 'Ivory, serif and calm, with your practice areas set out like an index. Made for firms clients trust with their families.' },
  { key: 'modern', name: 'Modern', firm: 'ashgrove-defense', label: 'Ashgrove Defense, criminal defense', text: 'Light and clean, with a photo for each practice area and the form on a dark band. Made for firms that want to look current.' },
]

export default function Home() {
  return (
    <div className="home">
      <header className="nav">
        <div className="wrap">
          <Logo />
          <nav aria-label="Main">
            <a className="hide-sm" href="#designs">Designs</a>
            <a className="hide-sm" href="#pricing">Pricing</a>
            <a className="hide-sm" href="/trades">Other businesses</a>
            <a href="/login">Log in</a>
            <a className="b b-light b-sm" href="/redesign">Free redesign</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero lw-hero">
          <div className="hero-bg"><Image src={U('1436450412740-6b988f486c6b')} alt="" fill sizes="100vw" priority style={{ objectFit: 'cover', objectPosition: '60% 40%' }} /></div>
          <div className="wrap hero-in">
            <p className="lw-eyebrow">Websites for law firms</p>
            <h1>Law firm websites that bring in consultations.</h1>
            <p className="lede">Built for how people choose a lawyer: clear practice area pages, real attorney profiles and a consultation request right on the home page. Fast, SEO fully optimized, and no two firms look the same. <strong>From ${PRICES.law.month} a month. No contract.</strong></p>
            <div className="lw-acts">
              <a className="b b-light" href="/redesign">See your site redesigned, free</a>
              <a className="b lw-ghost" href="#designs">See the designs</a>
            </div>
            <ul className="assure"><li>7-day free trial</li><li>Your domain, your site</li><li>Cancel anytime</li></ul>
          </div>
        </section>

        <section className="lw-designs" id="designs">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Three designs</p>
                <h2>No two firms look alike.</h2>
              </div>
              <p>Every firm starts from one of three designs and makes it its own: its colors, its words, its photos and its attorneys. Yours won’t look like the office down the street.</p>
            </div>
            <div className="lw-grid">
              {DESIGNS.map((d, i) => (
                <article className="lw-card" key={d.key}>
                  <a href={`/preview/${d.firm}`} aria-label={`See the ${d.name} design live`}>
                    <Frame url={`${d.firm}.saysites.com`}>
                      <Image src={`/media/law/${d.key}.jpg`} alt={`The ${d.name} design: the home page of ${d.label}`} width={1280} height={860} sizes="(max-width: 900px) 92vw, 400px" priority={i === 0} />
                    </Frame>
                  </a>
                  <h3>{d.name}</h3>
                  <p className="lw-for">{d.label}</p>
                  <p>{d.text}</p>
                  <a className="lw-link" href={`/preview/${d.firm}`}>See it live</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how dark lw-inside" id="inside">
          <div className="how-mark" aria-hidden="true"><LogoMark size={720} /></div>
          <div className="wrap">
            <div className="head">
              <p className="kicker">In every law firm site</p>
              <h2>What people look for before they call a lawyer.</h2>
            </div>
            <div className="lw-feats">
              <div><h3>A page for every practice area</h3><p>Each area of law gets its own page: what it involves, how the work goes and the questions clients ask, written for your firm and your town.</p></div>
              <div><h3>Your attorneys, by name</h3><p>Profiles for the people clients will actually speak to, on the home page and a page of their own.</p></div>
              <div><h3>Consultation requests</h3><p>A request form on the home page and the contact page. Every request lands in your inbox, with the attorney-client notice beside it.</p></div>
              <div><h3>The notices clients expect</h3><p>An attorney advertising notice and a plain disclaimer at the foot of every page, and nothing that promises results.</p></div>
              <div><h3>Fast on every phone</h3><p>Every page has to score 95 or more on the speed check before it can go live. Our example firms score 100.</p></div>
              <div><h3>Ready for Google</h3><p>Titles, a sitemap and your firm’s details marked up as a legal service, following Google’s published guidelines. Nobody can promise rankings; we build it right.</p></div>
            </div>
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Pricing</p>
                <h2>Build it yourself, or have us build it.</h2>
              </div>
              <p>Either way the site, the words and the domain are yours. One flat monthly price, no setup fee and no contract.</p>
            </div>
            <div className="plans lw-plans">
              <div className="plan">
                <div className="plan-top"><h3>Law Firm</h3><span className="tag">You build it</span></div>
                <div className="amt">${PRICES.law.month}<small>/month</small></div>
                <p className="per">For firms who like to be hands on</p>
                <ul>
                  <li>One of three law designs, made yours</li>
                  <li>Practice area pages written for your firm</li>
                  <li>Attorney profiles and consultation requests</li>
                  <li>Attorney advertising notices on every page</li>
                  <li>Your domain, hosting, SSL and speed checks</li>
                  <li>Sofie for everyday changes, and a weekly Visibility Score</li>
                </ul>
                <a className="b b-line b-block" href="/signup">Start free</a>
              </div>
              <div className="plan plan-main">
                <div className="plan-top"><h3>Law Firm, built for you</h3><span className="tag">We build it</span></div>
                <div className="amt">${PRICES.lawpro.month}<small>/month</small></div>
                <p className="per">For firms with cases to run</p>
                <ul>
                  <li>Everything in Law Firm</li>
                  <li>We build your whole site for you</li>
                  <li>You review it from one private link</li>
                  <li>Nothing goes live until you approve it</li>
                  <li>Changes made for you whenever you ask</li>
                </ul>
                <a className="b b-light b-block" href="/redesign">Start with a free redesign</a>
              </div>
            </div>
            <ol className="lw-flow" aria-label="How built for you works">
              <li><b>Send us your current site</b><span>Or a few lines about your firm if you don’t have one.</span></li>
              <li><b>We build your new site</b><span>Your practice areas, your attorneys, your words.</span></li>
              <li><b>You review it from one link</b><span>Ask for changes right on the page.</span></li>
              <li><b>Approve, and it goes live</b><span>On your own domain, and it stays yours.</span></li>
            </ol>
            <p className="fine">7-day free trial. No setup fee, no contract, cancel anytime.</p>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="wrap faq-in">
            <div className="head">
              <p className="kicker">Questions</p>
              <h2>Good questions.</h2>
            </div>
            <div className="qa">
              <details><summary>Will my site follow the advertising rules for lawyers?</summary><p>Every law firm site carries an attorney advertising notice and a disclaimer that the site isn’t legal advice, and we never add results, ratings or claims you didn’t give us. Rules differ from state to state, so check yours; we’ll change any wording you need.</p></details>
              <details><summary>Who writes the words?</summary><p>Each practice area gets its own page explaining the work in plain English, written for your firm and your town, with no invented facts. You can change any word, or ask Sofie to.</p></details>
              <details><summary>We already have a website. What happens to it?</summary><p>Send it to the free redesign and see it rebuilt first, with every page kept at the same address so you don’t lose what you rank for. Nothing changes on your current site until you point your domain here.</p></details>
              <details><summary>How does the built-for-you plan work?</summary><p>We build your site, then send you one private link. You look through every page, ask for changes right there, and approve it when it’s right. It goes live after you approve, never before.</p></details>
              <details><summary>Is there a contract?</summary><p>No. Pay monthly and cancel anytime. Your words and your domain stay yours.</p></details>
            </div>
          </div>
        </section>

        <section className="lw-trades">
          <div className="wrap lw-trades-in">
            <div>
              <p className="kicker">Not a law firm?</p>
              <h2>SaySites builds for trades and local businesses too.</h2>
              <p>Plumbers, electricians, salons, restaurants and shops, each with designs of their own. From ${PRICES.site.month} a month.</p>
            </div>
            <a className="b b-line" href="/trades">See SaySites for your business</a>
          </div>
        </section>

        <section className="last">
          <div className="hero-bg"><Image src={U('1505664194779-8beaceb93744')} alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} /></div>
          <div className="wrap">
            <LogoMark size={44} />
            <h2>See your firm’s new site before you pay a thing.</h2>
            <div className="lw-acts">
              <a className="b b-light" href="/redesign">See your site redesigned, free</a>
              <a className="b lw-ghost" href="/signup">Start from scratch</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <Logo />
          <nav aria-label="Footer"><a href="/trades">Other businesses</a><a href="/templates">Templates</a><a href="#pricing">Pricing</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Log in</a></nav>
          <span>© {new Date().getFullYear()} SaySites</span>
        </div>
      </footer>
    </div>
  )
}
