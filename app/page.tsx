import type { Metadata } from 'next'
import Image from 'next/image'
import { Logo, LogoMark, Wordmark } from '@/components/Logo'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/MarketingShell'
import { ClassicPlans } from '@/components/ClassicPlans'
import { ClosingSay, SayBox } from '@/components/SayBox'
import { TalkForm } from '@/components/TalkForm'
import { PRICES, TRIAL_DAYS } from '@/lib/billing'
import { TEMPLATES } from '@/lib/templates'
import './home.css'

// saysites.com: website building for small businesses, with Sofie at the
// centre. You say what you want, in your own words, and your site changes:
// that's the product and the fun of it. Prices are public and read from
// PRICES (lib/billing.ts, the same ones Stripe charges); never type one.
// A static page with no client JavaScript of its own; motion is CSS only.
// The example sites and the editor are design mockups drawn in HTML, and
// everything Sofie says on this page is something she can actually do.

export const metadata: Metadata = {
  title: { absolute: 'SaySites: say it, and your website does it' },
  description: `Tell Sofie about your business and watch your website appear. Then say anything you want changed, in plain words. From $${PRICES.site.month} a month, 0% of your sales.`,
  alternates: { canonical: '/' },
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2000&q=75`
const money = (n: number) => `$${n.toFixed(2)}`

function Photo({ id, sizes, priority = false, pos }: { id: string; sizes: string; priority?: boolean; pos?: string }) {
  return <Image src={U(id)} alt="" fill sizes={sizes} priority={priority} style={{ objectFit: 'cover', objectPosition: pos ?? 'center' }} />
}

function Frame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="frame">
      <div className="frame-bar"><i /><i /><i /><span>{url}</span></div>
      <div className="frame-body">{children}</div>
    </div>
  )
}

// Things owners say to Sofie, and what she does. Each one maps to a tool she
// really has (lib/sofie.ts): pages, posts, logos, photos, the promo bar,
// events, the chat button, colours, fonts and the site's personality.
const SAYINGS: [string, string][] = [
  ['Make it feel cozier.', 'Softer colours, rounded photos and a warmer heading font, all at once.'],
  ['Design me a logo with a little loaf of bread.', 'A logo drawn for you, ready for your header. Don’t love it? Say what to change.'],
  ['Add a page for our wedding cakes.', 'A new page with its own address, in your menu and your sitemap.'],
  ['Put up a banner: pies 20% off until Thanksgiving.', 'A slim bar across the top of every page that disappears when the offer ends.'],
  ['Write a post about how we make our sourdough.', 'A blog post in your words, with its own page Google can find.'],
  ['We have live music Friday at 7.', 'Your event on the home page, and in the details Google reads.'],
  ['Let people text me from the site.', 'A text button in the corner, to the number you give her.'],
  ['That photo is too dark. Find a brighter one.', 'A few brighter photos to choose from, sized so your site stays fast.'],
]

/* ---------- Example sites (mockups) ---------- */

/* ---------- Example sites (mockups) ---------- */

function Bakery({ priority = false }: { priority?: boolean }) {
  return (
    <div className="bk">
      <div className="bk-nav"><img className="mk-logo" src="/media/logos/rosies-bakery.svg" alt="Rosie’s Bakery" width="203" height="79" /><span>Bread</span><span>Cakes</span><span>Visit</span><em>Order ahead</em></div>
      <div className="bk-hero">
        <div>
          <small>SE Division, Portland</small>
          <h3>Sourdough, baked every morning at five.</h3>
          <p>Country loaves, celebration cakes and good coffee, a block from the park.</p>
          <div className="bk-btns"><em>Order for pickup</em><span>Today’s bakes</span></div>
        </div>
        <div className="ph bk-ph"><Photo id="1509440159596-0249088772ff" sizes="(max-width: 900px) 45vw, 380px" priority={priority} /></div>
      </div>
      <div className="bk-row">
        {[
          ['1579697096985-41fe1430e5df', 'Pastries', 'Croissants and buns'],
          ['1566698629409-787a68fc5724', 'Bread', 'Country, rye, seeded'],
          ['1567042661848-7161ce446f85', 'Wholesale', 'For cafés nearby'],
        ].map(([id, t, s]) => (
          <div key={t}><div className="ph bk-th"><Photo id={id} sizes="(max-width: 900px) 30vw, 220px" /></div><b>{t}</b><span>{s}</span></div>
        ))}
      </div>
    </div>
  )
}

// A coffee roaster's shop: the Store plan's products, prices and buy buttons.
function Roaster() {
  return (
    <div className="ro">
      <div className="ro-nav"><b>Northside <span>Roasters</span></b><span>Shop</span><span>Wholesale</span><span>Visit</span></div>
      <div className="ro-hero">
        <div className="ph"><Photo id="1741994043738-393513f7bf52" sizes="(max-width: 900px) 90vw, 560px" /></div>
        <div className="ro-hero-t"><small>Small-batch, roasted Tuesdays</small><h3>Fresh coffee, at your door by Friday.</h3></div>
      </div>
      <div className="ro-row">
        {[
          ['1695245503558-5cdb37f49092', 'House Blend', 'Chocolate, toasted nuts', money(18), false],
          ['1712402832925-d41c446883d3', 'Colombia Huila', 'Red apple, caramel', money(21), false],
          ['1562051036-e0eea191d42f', 'Espresso Roast', 'Dark cocoa, molasses', money(19), true],
        ].map(([id, name, notes, price, out]) => (
          <div key={name as string} className="ro-card">
            <div className="ph ro-th"><Photo id={id as string} sizes="(max-width: 900px) 30vw, 200px" /></div>
            <b>{name}</b><span>{notes}</span>
            <div className="ro-buy"><strong>{price}</strong>{out ? <em className="out">Sold out</em> : <em>Buy now</em>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Plumber() {
  return (
    <div className="pl">
      <div className="pl-top"><span>Licensed and insured, Rivertown and the valley</span><b>(555) 014-2200</b></div>
      <div className="pl-nav"><img className="mk-logo" src="/media/logos/rivertown-plumbing.svg" alt="Rivertown Plumbing" width="476" height="89" /><span>Services</span><span>Areas</span><span>About</span><em>Call now</em></div>
      <div className="pl-hero ph">
        <Photo id="1749532125405-70950966b0e5" sizes="(max-width: 900px) 100vw, 760px" pos="50% 40%" />
        <div className="pl-copy">
          <small>Open 24/7, Same-day callouts</small>
          <h3>Burst pipe? We’re on the way.</h3>
          <p>Upfront-priced plumbing for homes and small businesses in Rivertown.</p>
          <div className="pl-btns"><em>Call (555) 014-2200</em><span>Get a free quote</span></div>
        </div>
      </div>
      <div className="pl-strip">
        {[['Leaks and bursts', '60-minute response'], ['Water heaters', 'Repair and install'], ['Drains', 'Cleared same day'], ['Remodels', 'Kitchens and baths']].map(([t, s]) => (
          <div key={t}><b>{t}</b><span>{s}</span></div>
        ))}
      </div>
    </div>
  )
}

// Dark & Upscale: Olive & Ember, the look of the birthday demo.
function Upscale() {
  return (
    <div className="up">
      <div className="up-nav"><img className="mk-logo" src="/media/logos/olive-and-ember.svg" alt="Olive &amp; Ember" width="388" height="78" /><span>Menu</span><span>Visit</span><em>Reserve</em></div>
      <div className="up-hero ph">
        <Photo id="1622880833523-7cf1c0bd4296" sizes="(max-width: 900px) 100vw, 760px" pos="50% 55%" />
        <div className="up-copy">
          <small>Wall Street, Asheville</small>
          <h3>Wood-fired, and worth the wait.</h3>
          <div className="up-btns"><em>Reserve a table</em><span>See the menu</span></div>
        </div>
      </div>
      <div className="up-row">
        {[
          ['1599130143407-2a6ff8a196c9', 'Wood-fired pizza', 'From the oven at 900°'],
          ['1516685018646-549198525c1b', 'Handmade pasta', 'Rolled every afternoon'],
          ['1776362441386-c02107b86576', 'Private dining', 'Up to 24 guests'],
        ].map(([id, t, s]) => (
          <div key={t}><div className="ph up-th"><Photo id={id} sizes="(max-width: 900px) 30vw, 220px" /></div><b>{t}</b><span>{s}</span></div>
        ))}
      </div>
    </div>
  )
}

function Salon() {
  return (
    <div className="sa">
      <div className="sa-nav"><span>Services</span><img className="mk-logo" src="/media/logos/salt-and-stone.svg" alt="Salt &amp; Stone" width="431" height="84" /><span>Book</span></div>
      <div className="sa-hero">
        <div className="ph"><Photo id="1633681926022-84c23e8cb2d6" sizes="(max-width: 900px) 50vw, 300px" /></div>
        <div className="sa-copy">
          <small>Jones Street, Savannah</small>
          <h3>Hair that grows out beautifully.</h3>
          <p>Lived-in color and precise cuts, by appointment.</p>
          <em>Book a chair</em>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

export default async function Home({ searchParams }: { searchParams: Promise<{ sent?: string; talk?: string }> }) {
  const sp = await searchParams
  const site = PRICES.site
  const store = PRICES.store
  return (
    <div className="home">
      <header className="nav">
        <div className="wrap">
          <Logo />
          <SiteNav home />
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg"><Photo id="1687422808248-f807f4ea2a2e" sizes="100vw" priority pos="60% 30%" /></div>
          <div className="wrap hero-in">
            <h1>Say it.<br />It’s on your site.</h1>
            <p className="lede">Tell Sofie about your business in your own words and watch your website appear. Then say anything: “make it cozier”, “add our Saturday hours”, “put up a menu”. You see every change before it goes live. <strong>${site.month} a month. 0% of your sales.</strong></p>
            <SayBox id="idea-top" />
            <ul className="assure"><li>No credit card</li><li>{TRIAL_DAYS}-day free trial</li><li>Cancel anytime</li></ul>
            <p className="hero-alt"><a href="/redesign">Already have a website? See it rebuilt on SaySites, free</a></p>
          </div>
        </section>

        <section className="product" id="sofie-demo" aria-label="The SaySites editor">
          <div className="wrap">
            <div className="app" aria-hidden="true">
              <div className="app-bar">
                <span className="app-logo"><LogoMark size={24} /><Wordmark /></span>
                <span className="app-site">Rosie’s Bakery</span>
                <div className="app-tabs"><span className="on">Home</span><span>Services</span><span>Contact</span></div>
                <span className="app-live"><i />Live</span>
                <span className="app-pub">Publish</span>
              </div>
              <div className="app-body">
                <div className="canvas"><Frame url="rosies-bakery.saysites.com"><Bakery priority /></Frame></div>
                <aside className="side">
                  <div className="side-h"><span><LogoMark size={14} />Sofie</span><span>Speed 100</span></div>
                  <div className="msg me m1">Can you add our weekend hours and a photo of the pastries?</div>
                  <div className="msg her m2">Done. I added “Sat-Sun, 7am-2pm” to the header and a pastries card on your home page.</div>
                  <div className="diff m3">
                    <div><span>Header</span><span>+ Weekend hours</span></div>
                    <div><span>Home, cards</span><span>+ Pastries</span></div>
                    <div><span>Speed check</span><span>Still 100</span></div>
                  </div>
                  <div className="msg me m4">Perfect. Publish it.</div>
                  <div className="ask">Say what you want changed</div>
                </aside>
              </div>
            </div>
            <p className="product-note">An example of the SaySites editor. Sofie is the assistant built into every site.</p>
          </div>
        </section>

        <section className="sofie" id="sofie">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Meet Sofie</p>
                <h2>Say anything.<br />Watch it happen.</h2>
              </div>
              <p>No menus to learn, no settings to hunt for. Talk to your site the way you’d talk to a friend who’s good with websites. A few things owners say:</p>
            </div>
            <ul className="says">
              {SAYINGS.map(([said, did]) => (
                <li key={said}>
                  <q>{said}</q>
                  <p>{did}</p>
                </li>
              ))}
            </ul>
            <div className="sofie-rules">
              <div><h3>You see it first</h3><p>Sofie’s changes wait in a draft. Look it over, then publish, or undo with one tap.</p></div>
              <div><h3>It stays yours</h3><p>Your words, your photos, your look. Sofie never makes up reviews, prices or facts about your business.</p></div>
              <div><h3>It stays fast</h3><p>Every change is checked before it goes live. If it would slow your site down, it gets fixed first.</p></div>
            </div>
          </div>
        </section>

        <section className="stats" aria-label="SaySites at a glance">
          <div className="wrap">
            <div><b>${site.month}</b><span>a month, everything included</span></div>
            <div><b>0%</b><span>of your sales, ever</span></div>
            <div><b>1</b><span>sentence to start your site</span></div>
            <div><b>95+</b><span>speed score required before any page goes live</span></div>
          </div>
        </section>

        <section className="how dark" id="how">
          <div className="how-mark" aria-hidden="true"><LogoMark size={720} /></div>
          <div className="wrap">
            <div className="head">
              <p className="kicker">How it works</p>
              <h2>Your site.<br />Your say.</h2>
              <p className="head-note">It’s your website because you said what goes on it. Built on years of experience making sites that rank: what search engines look for, what customers need and what gets them to call.</p>
            </div>
            <ol className="steps">
              <li>
                <h3>Say what you do</h3>
                <p>Your business, your town, what you offer. A sentence or two is plenty.</p>
                <div className="vis vis-type">We’re a two-person roofing crew in Tulsa. Repairs and storm damage.<i /></div>
              </li>
              <li>
                <h3>Watch it appear</h3>
                <p>Home, services and contact pages, written for your business and SEO fully optimized from day one.</p>
                <div className="vis vis-pages"><span>Home</span><span>Services</span><span>Contact</span><span>Sitemap</span></div>
              </li>
              <li>
                <h3>Keep talking</h3>
                <p>Say what to change, whenever you like. You see it first and can undo anything.</p>
                <div className="vis vis-chat"><span>Add 10% off gutter cleaning until Friday.</span></div>
              </li>
            </ol>
          </div>
        </section>

        <section className="examples" id="examples">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Pick a look</p>
                <h2>Pick a look. Say who you are. Done.</h2>
              </div>
              <p>Each look comes with a ready-made sentence. Fill in your business name, town and services, and your site is built from it. Then keep talking to change anything.</p>
            </div>
            <div className="tpls">
              {TEMPLATES.slice(0, 4).map((t, i) => (
                <article className={`tplrow${i % 2 ? ' flip' : ''}`} key={t.key}>
                  <div className="tplrow-shot">
                    <Frame url={`${t.example}.saysites.com`}>{t.key === 'bold' ? <Plumber /> : t.key === 'editorial' ? <Salon /> : t.key === 'upscale' ? <Upscale /> : <Bakery />}</Frame>
                  </div>
                  <div className="tplrow-copy">
                    <h3>{t.name}</h3>
                    <p className="tplrow-for">Great for {t.bestFor.toLowerCase()}</p>
                    <div className="prompt-card">
                      <span className="prompt-label">Say this</span>
                      <p>{t.prompt({}).split(/(\[[^\]]+\])/).map((part, n) => (part.startsWith('[') ? <mark key={n}>{part.slice(1, -1)}</mark> : part))}</p>
                    </div>
                    <div className="tplrow-actions">
                      <a className="b b-dark" href={`/signup?template=${t.key}`}>Start with this look</a>
                      <a className="tplrow-link" href={`/preview/${t.example}`}>See the live example</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="tpl-more"><a className="b b-line" href="/templates">See every example site</a></p>
          </div>
        </section>

        <section className="sell" id="sell">
          <div className="wrap sell-in">
            <div className="sell-copy">
              <p className="kicker">Sell online</p>
              <h2>A real store for ${store.month} a month. Keep every dollar.</h2>
              <p>Say “add our House Blend, twelve ounces, eighteen dollars” and it’s in your shop with a buy button. Customers pay through your own Stripe checkout, so the money goes straight to you. SaySites takes 0% of every sale.</p>
              <ul className="sell-list">
                <li>Products, photos and a Shop page</li>
                <li>Checkout through your own Stripe account</li>
                <li>Prices Google can read</li>
                <li>Sold out? Mark it in one tap</li>
              </ul>
              <p><a className="b b-dark" href="/signup">Open your store</a></p>
            </div>
            <div className="sell-vis" aria-hidden="true">
              <Frame url="northside-roasters.saysites.com"><Roaster /></Frame>
              <div className="sell-order"><i>✓</i><div><b>New order, {money(36)}</b><span>Paid to your Stripe, SaySites fee {money(0)}</span></div></div>
            </div>
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Pricing</p>
                <h2>One price. Everything included.</h2>
              </div>
              <p>Other builders charge more for a store, sell the basics as paid apps, and some take a fee on every sale. SaySites is one flat price, and your money stays yours.</p>
            </div>
            <ClassicPlans />
          </div>
        </section>

        <section className="feats">
          <div className="wrap">
            <div className="head">
              <p className="kicker">What’s inside</p>
              <h2>Everything a small business needs, in one price.</h2>
            </div>
            <div className="feat-grid">
              <div><h3>Sofie, built in</h3><p>Change words, photos, colours, pages and your whole look by saying so. Her monthly allowance refills on the 1st, and you can always edit by hand too.</p></div>
              <div><h3>Built to rank</h3><p>Clean code, one clear heading per page, titles that fit Google, a sitemap and business details Google can read.</p></div>
              <div><h3>Kept up with Google</h3><p>Every site follows Google’s published guidelines, and when Google changes them we update the platform once, so every site keeps up the same day. <a href="/google-guidelines">How it works</a></p></div>
              <div><h3>Always fast</h3><p>Every page is checked before it goes live. If a change would slow your site down, it gets fixed first.</p></div>
              <div><h3>Your own address</h3><p>Every site gets yourname.saysites.com, and you can connect a domain you own.</p></div>
              <div><h3>Every lead in one place</h3><p>Messages from your site land in your inbox, with instant replies, reminders to follow up and call buttons right there.</p></div>
              <div><h3>A blog that brings people in</h3><p>Write helpful posts, or ask Sofie to draft one. Each gets its own page, a spot in your sitemap and the markup Google looks for.</p></div>
              <div><h3>Nothing is ever lost</h3><p>Every change is saved as a version, so you can always go back.</p></div>
              <div><h3>See who’s visiting</h3><p>Page views per day and your most-read pages, counted without cookies. No cookie banner, nothing slowing you down.</p></div>
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
              <details><summary>Do I need any design or tech skills?</summary><p>No. You say what your business is and your site appears. Then you change anything by telling Sofie: “make the photo brighter”, “add our Saturday hours”. You can also edit everything by hand.</p></details>
              <details><summary>Who is Sofie?</summary><p>Sofie is the assistant built into SaySites. She makes the changes you ask for, in a draft you look over before anything goes live. She only uses facts you give her, never made-up reviews, prices or claims.</p></details>
              <details><summary>What does it cost?</summary><p>${site.month} a month for a website, or ${store.month} a month with a store. Paying yearly is two months free. There’s a {TRIAL_DAYS}-day free trial with no card, no setup fee and no contract.</p></details>
              <details><summary>What does “0% of your sales” mean?</summary><p>Customers pay you through your own Stripe account. Stripe charges its normal card processing fee; SaySites takes nothing on top.</p></details>
              <details><summary>Will my site show up on Google?</summary><p>Every site is built the way Google likes: fast, clean, with proper titles, a sitemap and business details search engines can read. Nobody can promise a #1 spot, but you start with the foundations right.</p></details>
              <details><summary>Can I use my own domain?</summary><p>Yes. Every site gets a free yourname.saysites.com address, and you can connect a domain you own.</p></details>
              <details><summary>I run a law firm. Is there a plan for me?</summary><p>Yes. Law firm plans add practice area pages, attorney profiles, intake questions and attorney advertising notices. <a href="/websites-for/law-firms">See websites for law firms</a>.</p></details>
            </div>
          </div>
        </section>

        <section className="ag-talk ag-talk-light" id="talk">
          <div className="wrap ag-talk-in">
            <div>
              <p className="kicker">Rather we build it?</p>
              <h2>Tell us about your business.</h2>
              <p>If you’d like a hand, send us a note and we’ll get back to you. No pressure and no jargon.</p>
              <p className="ag-talk-alt">Rather see it first? <a href="/redesign">Get a free redesign of your current site.</a></p>
            </div>
            <TalkForm from="/" sent={sp.sent === '1'} missing={sp.talk === 'missing'} />
          </div>
        </section>

        <ClosingSay />
      </main>

      <SiteFooter />
    </div>
  )
}
