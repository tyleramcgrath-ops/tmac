import Image from 'next/image'
import { Logo, LogoMark } from '@/components/Logo'
import './home.css'

// saysites.com. A static page: no client JavaScript of its own, all motion is
// CSS. Anything not built yet is labelled "Coming soon". The example sites are
// design mockups drawn in HTML; their photos come from Unsplash and are resized
// by Vercel's image optimizer.

const TRADES = ['Plumbers', 'Bakeries', 'Hair salons', 'Roofers', 'Dentists', 'Law firms', 'Electricians', 'Cleaners', 'Landscapers', 'Auto shops', 'Cafés', 'Boutiques']

function Photo({ id, sizes, priority = false, pos }: { id: string; sizes: string; priority?: boolean; pos?: string }) {
  return (
    <Image
      src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectFit: 'cover', objectPosition: pos ?? 'center' }}
    />
  )
}

function Browser({ url, className = '', children }: { url: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`browser ${className}`}>
      <div className="browser-bar"><i /><i /><i /><span>{url}</span></div>
      <div className="browser-body">{children}</div>
    </div>
  )
}

function SayBox({ id }: { id: string }) {
  return (
    <form className="say" action="/signup" method="get" role="search" aria-label="Describe your business">
      <label htmlFor={id} className="visually-hidden">What does your business do?</label>
      <span className="say-prompt" aria-hidden="true">›</span>
      <input id={id} name="idea" placeholder="A family bakery in Portland, Oregon…" autoComplete="off" maxLength={200} />
      <button className="hbtn hbtn-signal" type="submit">Build my site</button>
    </form>
  )
}

/* ---------- Example sites (mockups) ---------- */

function BakerySite() {
  return (
    <div className="bk">
      <div className="bk-nav">
        <b>Rosie’s</b>
        <span>Bread</span><span>Cakes</span><span>Visit</span>
        <em>Order ahead</em>
      </div>
      <div className="bk-hero">
        <div className="bk-copy">
          <small>SE Division · Portland</small>
          <h3>Sourdough,<br />baked at 5am.</h3>
          <p>Country loaves, celebration cakes and proper coffee, a block from the park.</p>
          <div className="bk-btns"><em>Order for pickup</em><span>Today’s bakes →</span></div>
        </div>
        <div className="bk-photo"><Photo id="1509440159596-0249088772ff" sizes="(max-width: 900px) 50vw, 420px" /></div>
      </div>
      <div className="bk-row">
        {[
          ['1579697096985-41fe1430e5df', 'Pastries', 'Croissants & buns'],
          ['1566698629409-787a68fc5724', 'Bread', 'Country, rye, seeded'],
          ['1567042661848-7161ce446f85', 'Wholesale', 'For cafés nearby'],
        ].map(([id, t, s]) => (
          <div className="bk-card" key={t}>
            <div className="bk-thumb"><Photo id={id} sizes="(max-width: 900px) 30vw, 240px" /></div>
            <b>{t}</b><span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SalonPhone() {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="sa">
        <div className="sa-nav"><b>SALT &amp; STONE</b><span>Menu</span></div>
        <div className="sa-photo"><Photo id="1634449571010-02389ed0f9b0" sizes="240px" pos="50% 30%" /></div>
        <div className="sa-copy">
          <h3>Cuts &amp; color,<br /><i>Savannah.</i></h3>
          <p>Lived-in color and precise cuts on Jones Street.</p>
          <em>Book a chair</em>
        </div>
        <div className="sa-list">
          <div><span>Cut &amp; style</span><b>$65</b></div>
          <div><span>Balayage</span><b>$180</b></div>
        </div>
      </div>
    </div>
  )
}

function PlumberSite() {
  return (
    <div className="pl">
      <div className="pl-top"><span>Licensed &amp; insured · Rivertown &amp; the valley</span><b>(555) 014-2200</b></div>
      <div className="pl-nav"><b><i />RIVERTOWN <span>PLUMBING</span></b><span>Services</span><span>Areas</span><span>About</span><em>Call now</em></div>
      <div className="pl-hero">
        <Photo id="1749532125405-70950966b0e5" sizes="(max-width: 900px) 100vw, 1120px" pos="50% 40%" />
        <div className="pl-copy">
          <small>Open 24/7 · Same-day callouts</small>
          <h3>Burst pipe?<br />We’re on the way.</h3>
          <p>Fast, upfront-priced plumbing for homes and small businesses in Rivertown.</p>
          <div className="pl-btns"><em>Call (555) 014-2200</em><span>Get a free quote</span></div>
        </div>
      </div>
      <div className="pl-strip">
        {[['Leaks & bursts', '60-minute response'], ['Water heaters', 'Repair & install'], ['Drains', 'Cleared same day'], ['Remodels', 'Kitchens & baths']].map(([t, s]) => (
          <div key={t}><b>{t}</b><span>{s}</span></div>
        ))}
      </div>
    </div>
  )
}

function SalonSite() {
  return (
    <div className="ss">
      <div className="ss-nav"><span>Services</span><b>SALT &amp; STONE</b><span>Book</span></div>
      <div className="ss-hero">
        <div className="ss-photo"><Photo id="1633681926022-84c23e8cb2d6" sizes="(max-width: 900px) 90vw, 560px" /></div>
        <div className="ss-copy">
          <small>Jones Street · Savannah</small>
          <h3>Hair that <i>grows out</i> beautifully.</h3>
          <em>Book online</em>
        </div>
      </div>
    </div>
  )
}

function BakeryShop() {
  return (
    <div className="bs">
      <div className="bs-head"><b>Rosie’s</b><span>Shop · Pickup tomorrow</span><em>Cart (2)</em></div>
      <div className="bs-grid">
        {[
          ['1549413468-cd78edb7e75c', 'Country sourdough', '$9'],
          ['1586765501019-cbe3973ef8fa', 'Seeded rye', '$10'],
          ['1579697096985-41fe1430e5df', 'Pastry box of 6', '$24'],
        ].map(([id, t, p]) => (
          <div className="bs-item" key={t}>
            <div className="bs-thumb"><Photo id={id} sizes="(max-width: 900px) 30vw, 200px" /></div>
            <b>{t}</b><span>{p}</span><i>Add</i>
          </div>
        ))}
      </div>
      <div className="bs-foot"><span>Pay by card through Stripe</span><b>0% SaySites fee</b></div>
    </div>
  )
}

function Seal() {
  return (
    <div className="seal" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs><path id="seal-path" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
        <text><textPath href="#seal-path">SPEED 100 · SEO READY · SPEED 100 · SEO READY ·</textPath></text>
      </svg>
      <b>100</b>
    </div>
  )
}

/* ---------- Page ---------- */

export default function Home() {
  return (
    <div className="home">
      <header className="hnav ink grain">
        <div className="wrap">
          <Logo />
          <nav aria-label="Main">
            <a className="hide-sm" href="#how">How it works</a>
            <a className="hide-sm" href="#examples">Examples</a>
            <a className="hide-sm" href="#price">Pricing</a>
            <a href="/login">Log in</a>
            <a className="hbtn hbtn-signal hbtn-sm" href="/signup">Start free</a>
          </nav>
        </div>
      </header>
      <main>
        <div className="ink grain hero-wrap">

          <section className="hero">
            <div className="wrap">
              <p className="label"><i className="dot" />Early access · free while we build</p>
              <h1>
                Say it.<br />
                It’s <span className="serif">built.</span>
              </h1>
              <div className="hero-row">
                <p className="lede">
                  Tell SaySites what your business does. Get a fast, good-looking website that’s set up for Google.{' '}
                  <strong>$15 a month. 0% of your sales.</strong>
                </p>
                <div>
                  <SayBox id="idea-top" />
                  <div className="say-note"><span>No credit card</span><span>No templates to fight</span><span>Live in minutes</span></div>
                </div>
              </div>
            </div>
          </section>

          <div className="wrap">
            <div className="stage rise" aria-hidden="true">
              <Browser url="rosies-bakery.saysites.com" className="stage-main"><BakerySite /></Browser>
              <div className="stage-phone"><SalonPhone /></div>
              <div className="chat">
                <div className="chat-you">A family bakery in Portland. Sourdough, cakes and coffee.</div>
                <div className="chat-sofie"><b><LogoMark />Sofie</b>Done. Your site is live and set up for Google. Want me to add your opening hours?</div>
              </div>
              <Seal />
            </div>
          </div>
        </div>

        <div className="band" aria-label="Built for local businesses">
          <div className="band-track">
            {[...TRADES, ...TRADES].map((t, i) => <span key={i} aria-hidden={i >= TRADES.length}>{t}</span>)}
          </div>
        </div>

        <section className="how" id="how">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">01 / How it works</p>
              <h2 className="h2">Three steps.<br />One of them is <span className="serif">typing.</span></h2>
            </div>
            <div className="steps">
              <div className="step">
                <span className="num">1</span>
                <h3>Say what you do</h3>
                <p>Your business, your town, what you offer. A sentence or two is plenty.</p>
                <div className="step-vis type-vis"><span>We’re a two-person roofing crew in Tulsa. Repairs and storm damage.</span><i /></div>
              </div>
              <div className="step">
                <span className="num">2</span>
                <h3>Get a finished website</h3>
                <p>Written for your customers, set up for Google, live on your own address.</p>
                <ul className="step-vis checks">
                  <li>Home, Services and Contact pages</li>
                  <li>Your phone number on every page</li>
                  <li>Business details Google can read</li>
                  <li>Sitemap and speed check</li>
                </ul>
              </div>
              <div className="step">
                <span className="num">3</span>
                <h3>Ask for changes <span className="tag">Coming soon</span></h3>
                <p>Sofie makes the change, shows you first, and you can undo anything.</p>
                <div className="step-vis mini-chat">
                  <div className="you">Add a banner: 10% off gutter cleaning until Friday.</div>
                  <div className="her">Added to your home page. Take a look?</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="examples ink grain" id="examples">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">02 / Examples</p>
              <h2 className="h2">One sentence in.<br />A <span className="serif">real</span> website out.</h2>
              <p className="sec-sub">Every site gets its own look, written for its own customers. These are design examples of what SaySites is built to make.</p>
            </div>

            <figure className="ex">
              <figcaption><span className="prompt">› “24/7 plumber in Rivertown. Leaks, water heaters, drains.”</span><a href="/preview/rivertown-plumbing">See our live sample site →</a></figcaption>
              <Browser url="rivertown-plumbing.saysites.com"><PlumberSite /></Browser>
            </figure>

            <div className="ex-pair">
              <figure className="ex">
                <figcaption><span className="prompt">› “Hair salon in Savannah. Color and cuts.”</span></figcaption>
                <Browser url="saltandstone.com"><SalonSite /></Browser>
              </figure>
              <figure className="ex">
                <figcaption><span className="prompt">› “Sell our bread online for pickup.”</span><span className="tag tag-dark">Store · Coming soon</span></figcaption>
                <Browser url="rosies-bakery.saysites.com/shop"><BakeryShop /></Browser>
              </figure>
            </div>
          </div>
        </section>

        <section className="price" id="price">
          <div className="wrap">
            <div className="price-copy">
              <p className="label">03 / The price</p>
              <div className="mega">$15<small>/mo</small></div>
              <h2 className="h2">Everything included.<br />Nothing taken.</h2>
              <p>Other builders charge extra for a store, sell the basics as paid apps, and some take a cut of every sale. SaySites is one flat price, and your money stays yours.</p>
            </div>
            <div className="receipt" aria-label="What you pay SaySites each month">
              <div className="r-head"><LogoMark /><b>SaySites</b><span>Monthly receipt</span></div>
              <div className="r-line"><span>Your website</span><span>$15.00</span></div>
              <div className="r-line"><span>Hosting &amp; SSL</span><span className="in">included</span></div>
              <div className="r-line"><span>SEO setup</span><span className="in">included</span></div>
              <div className="r-line"><span>Speed checks</span><span className="in">included</span></div>
              <div className="r-line"><span>Changes by Sofie</span><span className="in">included</span></div>
              <div className="r-line"><span>Cut of your sales</span><span className="in">0%</span></div>
              <div className="r-total"><span>Total</span><b>$15.00</b></div>
              <p className="r-foot">Free during early access · planned launch price</p>
            </div>
          </div>
        </section>

        <section className="speed ink grain">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">04 / Built to rank</p>
              <h2 className="h2">Fast isn’t a feature.<br />It’s the <span className="serif">rule.</span></h2>
              <p className="sec-sub">Google rewards fast, clean sites. Ours are lean from the first line of code, and every page is checked before it goes live. If it can’t score 95, it doesn’t publish.</p>
            </div>
            <div className="dials">
              {['Performance', 'SEO', 'Accessibility', 'Best practices'].map((l) => (
                <div className="dial" key={l}><div className="ring" /><b>100</b><span>{l}</span></div>
              ))}
            </div>
            <p className="fine-dark">Google Lighthouse mobile scores for our <a href="/preview/rivertown-plumbing">sample site</a>.</p>
          </div>
        </section>

        <section className="feats">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">05 / What’s inside</p>
              <h2 className="h2">The things SEO pros do,<br /><span className="serif">done for you.</span></h2>
            </div>
            <div className="feat-grid">
              <div className="feat"><span className="tag live">Live</span><h3>Built to rank</h3><p>Clean code, one clear heading per page, titles that fit Google, a sitemap and business details Google can read.</p></div>
              <div className="feat"><span className="tag live">Live</span><h3>Always fast</h3><p>Every page is checked before it goes live. If a change would slow your site down, it gets fixed first.</p></div>
              <div className="feat"><span className="tag live">Live</span><h3>Your own address</h3><p>Every site gets yourname.saysites.com, and you can connect a domain you own.</p></div>
              <div className="feat"><span className="tag">Coming soon</span><h3>Sofie, your assistant</h3><p>Change text, colors, sections and pages by chatting. You see every change first and can undo it.</p></div>
              <div className="feat"><span className="tag">Coming soon</span><h3>Google, connected</h3><p>Import your Business Profile and connect Search Console and Analytics in one click.</p></div>
              <div className="feat"><span className="tag">Coming soon</span><h3>Sell online, keep 100%</h3><p>Products, cart and checkout through your own Stripe account, with 0% taken from each sale.</p></div>
            </div>
          </div>
        </section>

        <section className="plans">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">06 / Plans</p>
              <h2 className="h2">Simple. Honest. <span className="serif">Cheap.</span></h2>
            </div>
            <div className="plan-grid">
              <div className="plan hot">
                <div className="plan-top"><h3>Site</h3><span className="tag tag-signal">Start here</span></div>
                <div className="amt">$15<small>/mo</small></div>
                <p className="per">For service businesses</p>
                <ul><li>Your full website, built for you</li><li>Your own domain</li><li>SEO and speed built in</li><li>Changes by Sofie</li></ul>
                <a className="hbtn hbtn-signal hbtn-block" href="/signup">Start free</a>
              </div>
              <div className="plan">
                <div className="plan-top"><h3>Store</h3><span className="tag">Coming soon</span></div>
                <div className="amt">$25<small>/mo</small></div>
                <p className="per">For selling online</p>
                <ul><li>Everything in Site</li><li>Products, cart and checkout</li><li>0% taken from your sales</li><li>Google Shopping listings</li></ul>
                <a className="hbtn hbtn-line hbtn-block" href="/signup">Start free</a>
              </div>
              <div className="plan">
                <div className="plan-top"><h3>SEO Suite</h3><span className="tag">Add-on</span></div>
                <div className="amt">+$19<small>/mo</small></div>
                <p className="per">For growing faster</p>
                <ul><li>Rank tracking</li><li>One-click SEO fixes</li><li>Competitor and AI search tracking</li><li>Content plans Sofie writes</li></ul>
                <a className="hbtn hbtn-line hbtn-block" href="/signup">Start free</a>
              </div>
            </div>
            <p className="fine">Free during early access. Planned launch prices. Cancel anytime, no setup fees.</p>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="wrap">
            <div className="sec-head">
              <p className="label">07 / Questions</p>
              <h2 className="h2">Good <span className="serif">questions.</span></h2>
            </div>
            <div className="qa">
              <details><summary>Do I need any design or tech skills?</summary><p>No. You describe your business and we build the site. When Sofie arrives, you’ll change things just by asking. A drag-and-drop builder is coming too, for people who like to tinker.</p></details>
              <details><summary>What does “0% of your sales” mean?</summary><p>When online selling launches, customers pay you through your own Stripe account. Stripe charges its normal card processing fee; SaySites takes nothing on top.</p></details>
              <details><summary>Will my site show up on Google?</summary><p>Every site is built the way Google likes: fast, clean, with proper titles, a sitemap and business details search engines can read. Nobody can promise a #1 spot, but you start with the foundations right.</p></details>
              <details><summary>Can I use my own domain?</summary><p>Yes. Every site gets a free yourname.saysites.com address, and you can connect a domain you own.</p></details>
              <details><summary>What happens after early access?</summary><p>We’ll tell you well before anything changes. Planned pricing is $15/month for a site and $25/month for a store, and you can cancel anytime.</p></details>
            </div>
          </div>
        </section>

        <section className="last ink grain">
          <div className="wrap">
            <h2 className="last-h">Your website is<br /><span className="serif">one sentence</span> away.</h2>
            <SayBox id="idea-bottom" />
            <div className="say-note"><span>Free during early access</span><span>No credit card</span></div>
          </div>
        </section>

      </main>

      <footer className="hfoot ink">
        <div className="wrap">
          <span className="logo"><LogoMark />SaySites</span>
          <nav aria-label="Footer"><a href="#price">Pricing</a><a href="#faq">FAQ</a><a href="/login">Log in</a><a href="/signup">Start free</a></nav>
          <span>© {new Date().getFullYear()} SaySites</span>
        </div>
      </footer>
    </div>
  )
}
