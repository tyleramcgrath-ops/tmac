import type { Metadata } from 'next'
import Image from 'next/image'
import { Logo, LogoMark } from '@/components/Logo'
import { SiteNav } from '@/components/SiteNav'
import { TalkForm } from '@/components/TalkForm'
import { auditSite } from '@/lib/seo-intel'
import { SHOWCASE } from '@/lib/showcase'
import './home.css'

// saysites.com: SaySites as a website company for the industries that
// compete hardest online. No prices on the public site; businesses ask us
// ("Let's talk") or start with a free redesign of their current site. Why
// to switch from an agency lives on /about. A static-feeling page with no
// client JavaScript of its own; the example screenshots are our own work.

export const metadata: Metadata = {
  title: { absolute: 'SaySites: premium websites built to bring in leads' },
  description: 'Premium websites built to turn searches into calls, consultation requests and booked appointments, for law firms, medical practices, med spas and home services.',
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

// A real audit of one of our example sites, run the same way every client's
// SEO tab runs it. Nothing on this card is made up.
// Worked out once per server start, not on every visit.
const EXAMPLE = 'hale-and-porter'
let example: ReturnType<typeof auditSite> | null = null
function exampleAudit() {
  const { site, pages } = SHOWCASE[EXAMPLE]
  example ??= auditSite({ site, pages, redirects: [] }, `https://${EXAMPLE}.saysites.com`)
  return example.catch(() => null)
}

const LEAD_FEATURES = [
  ['A pipeline for every lead', 'Each request lands as a card: New, Contacted, Booked, Won. Move it along in one tap and see who’s still waiting on you.'],
  ['An instant reply, every time', 'The moment someone asks for help, they get a reply from your firm saying it arrived. Their answer comes straight to you.'],
  ['Nothing slips', 'An email alert for every new lead, a reminder if one is still unanswered, a follow-up to leads nobody has called back, and a review request to every new client.'],
  ['Call, text or email in one tap', 'Every lead has its own page with their message, buttons to reach them, your notes, a follow-up date and the full history.'],
  ['Know what’s working', 'Where every lead came from, from Google Ads to Google Maps, plus phone taps, how fast you answer and new clients, in a results email on the 1st of each month.'],
  ['Into the CRM you already use', 'Each new lead can go straight to HubSpot, Salesforce, Pipedrive or Clio Grow, or anywhere else through Zapier or Make.'],
] as const

const CRMS = ['HubSpot', 'Salesforce', 'Pipedrive', 'Clio Grow', 'Zapier', 'Make']

const SEO_FEATURES = [
  ['A full audit of every page', 'Titles, descriptions, headings, links, photos, Google data and speed, checked the way Google reads them. It runs by itself after every change and every week.'],
  ['Fixes, most important first', 'Each one explained in plain words. Common ones, like duplicate titles and descriptions, are fixed in one click. For the rest, say what you want changed and approve it before it goes live.'],
  ['Ready for AI answers', 'A score for how easily ChatGPT-style answer engines can read and quote your pages, and what would raise it.'],
  ['Side by side with competitors', 'Add the firms you lose clients to. Their sites are read and scored the same way as yours, so you see exactly where you lead and where you don’t.'],
  ['Where you show up on Google', 'Track the searches that bring clients, like “estate planning lawyer near me”, and see your real position each day.'],
  ['Who AI recommends', 'Ask the questions clients ask AI and see whether your site is cited, and which sites are cited instead. Plus the websites that link to yours.'],
] as const

export default async function Home({ searchParams }: { searchParams: Promise<{ sent?: string; talk?: string }> }) {
  const [sp, audit] = await Promise.all([searchParams, exampleAudit()])
  return (
    <div className="home ag">
      <header className="nav">
        <div className="wrap">
          <Logo />
          <SiteNav home />
        </div>
      </header>

      <main>
        <section className="ag-hero">
          <div className="wrap ag-hero-in">
            <div className="ag-hero-copy">
              <p className="lw-eyebrow">Premium websites for law, medical, aesthetics, dental and home services</p>
              <h1>Premium websites built to bring in leads.</h1>
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
              <div><h3>Every lead, followed up</h3><p>Requests land in your own leads pipeline with call and reply buttons, an instant reply goes to every lead, and each one can go straight to HubSpot, Salesforce, Clio Grow or Pipedrive.</p></div>
              <div><h3>Found when they search</h3><p>A page for every service and town, fast on every phone, and your details marked up the way Google reads them.</p></div>
              <div><h3>Trust before they call</h3><p>Your people by name, plain answers to the questions clients ask, and the notices your industry expects. Nothing invented.</p></div>
            </div>
          </div>
        </section>

        <section className="ag-sec standing" id="seo">
          <div className="wrap">
            <div className="standing-in">
              <div className="standing-copy">
                <p className="kicker">SEO, built in</p>
                <h2>Know where you stand on Google, and what to fix next.</h2>
                <p>Every site comes with its own SEO suite in your dashboard. It audits every page, ranks what to fix, fixes the common things in one click and shows you how you compare with the firms you compete with.</p>
                <p>No one honest can promise you a ranking. What we promise is that you’ll always know exactly where you stand and why.</p>
              </div>
              {audit && (
                <div className="standing-card" aria-label="An example audit">
                  <div className="sc-head"><span>Example audit</span><span>{SHOWCASE[EXAMPLE].site.business.name}</span></div>
                  <div className="seo-ex">
                    <b>{audit.siteScore}</b>
                    <span>out of 100, across {audit.pages.length} pages</span>
                  </div>
                  <ol>
                    {([['Technical', audit.scores.technical], ['Content', audit.scores.content], ['Google data', audit.scores.schema], ['AI answers', audit.scores.ai]] as const).map(([k, v]) => (
                      <li key={k}><span>{k}</span><i className="seo-bar" aria-hidden="true"><em style={{ width: `${v}%` }} /></i><em>{v}</em></li>
                    ))}
                  </ol>
                  <p className="sc-tip">A real audit of our <a href={`/preview/${EXAMPLE}`}>example law firm site</a>, run the same way every client’s runs.</p>
                </div>
              )}
            </div>
            <div className="feat-grid seo-feats">
              {SEO_FEATURES.map(([h, t]) => (
                <div key={h}><h3>{h}</h3><p>{t}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="ag-sec standing" id="leads">
          <div className="wrap">
            <div className="standing-in">
              <div className="standing-copy">
                <p className="kicker">Leads, handled</p>
                <h2>Every lead answered, followed up and tracked.</h2>
                <p>Your site comes with its own leads pipeline. Every request is answered the moment it arrives, you’re told about it straight away, and nothing waits in an inbox until it goes cold.</p>
                <p>Already use a CRM? Connect it in a minute and every lead goes there too.</p>
              </div>
              <div className="standing-card leads-ex" aria-label="An example leads pipeline">
                <div className="sc-head"><span>Example pipeline</span><span>This week</span></div>
                <div className="lx-cols">
                  {([['New', 2], ['Contacted', 3], ['Booked', 1], ['Won', 1]] as const).map(([k, n]) => (
                    <div key={k}><b>{n}</b><span>{k}</span></div>
                  ))}
                </div>
                <ol>
                  <li><span><em>Estate planning question</em></span><i>New</i></li>
                  <li><span>Probate consultation</span><i className="lx-auto">Replied automatically</i></li>
                  <li><span>Will update after a move</span><i className="lx-booked">Booked</i></li>
                </ol>
                <p className="sc-tip">An example of what you see in your dashboard. Every lead also goes to <b>HubSpot</b>, <b>Salesforce</b> or another CRM if you connect one.</p>
              </div>
            </div>
            <div className="feat-grid seo-feats">
              {LEAD_FEATURES.map(([h, t]) => (
                <div key={h}><h3>{h}</h3><p>{t}</p></div>
              ))}
            </div>
            <p className="lx-crms"><span>Works with</span>{CRMS.map((c) => <b key={c}>{c}</b>)}</p>
          </div>
        </section>

        <section className="ag-sec ag-switch">
          <div className="wrap ag-switch-in">
            <div>
              <p className="kicker">The premium choice</p>
              <h2>See how SaySites compares with agencies and website builders.</h2>
            </div>
            <a className="b b-line" href="/about#compare">See the comparison</a>
          </div>
        </section>

        <section className="ag-sec ag-essay" id="why-website">
          <div className="wrap ind-two">
            <div>
              <p className="kicker">Why it matters</p>
              <h2>Your website decides who gets the call.</h2>
            </div>
            <div className="ind-guide-body">
              <p>People rarely pick a lawyer, a doctor or a plumber from one result. They search, open two or three sites, and call the one that feels right and makes it easy. That decision usually happens on a phone, in a minute or two, and it turns on a few things: whether the page appears quickly, whether it clearly does the thing they need, whether there are real people behind it, and whether the next step is obvious.</p>
              <p>That is why every SaySites site is built around the next step. The request form sits on the home page instead of hiding behind a contact link. Your phone number is a button. Each service or practice area has a page of its own, written for your business and your town, because that is what people search for and what Google matches them to.</p>
              <p>Search engines reward the same things people do: pages that load fast, say clearly what they are about and keep their facts consistent. We build to Google’s published guidelines, keep every page above a strict speed bar, and show you every message, call tap and visit, so you can see what your site brings in instead of guessing.</p>
            </div>
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
              <details><summary>Do you only work with certain industries?</summary><p>We focus on businesses where new clients start with a search: law firms, medical practices, med spas, dental practices and home service companies. Each has designs, pages and wording made for how its clients decide. If you are close to one of these, ask us.</p></details>
              <details><summary>Who writes the words on my site?</summary><p>We write a page for each of your services, explaining the work the way you would to a client, for your business and your town. Nothing is invented: no reviews, results or credentials you didn’t give us. You approve every word before it goes live.</p></details>
              <details><summary>What happens to my domain and email?</summary><p>Your domain stays yours. When you approve your new site, we walk you through pointing your domain to it, step by step. Your email keeps working where it is.</p></details>
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
