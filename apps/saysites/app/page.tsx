import Image from 'next/image'
import { Logo, LogoMark } from '@/components/Logo'
import { TEMPLATES } from '@/lib/templates'
import './home.css'

// saysites.com. A static page with no client JavaScript of its own; motion is
// CSS only. Anything not built yet is labelled "Coming soon". The example
// sites and the editor are design mockups drawn in HTML; their photos come from
// Unsplash and are resized by Vercel's image optimizer.

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2000&q=75`

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

function SayBox({ id, label = 'Build my site' }: { id: string; label?: string }) {
  return (
    <form className="say" action="/signup" method="get" role="search" aria-label="Describe your business">
      <label htmlFor={id} className="visually-hidden">What does your business do?</label>
      <input id={id} name="idea" placeholder="A family bakery in Portland, Oregon…" autoComplete="off" maxLength={200} />
      <button className="b b-light" type="submit">{label}</button>
    </form>
  )
}

/* ---------- Example sites (mockups) ---------- */

function Bakery({ priority = false }: { priority?: boolean }) {
  return (
    <div className="bk">
      <div className="bk-nav"><b>Rosie’s Bakery</b><span>Bread</span><span>Cakes</span><span>Visit</span><em>Order ahead</em></div>
      <div className="bk-hero">
        <div>
          <small>SE Division · Portland</small>
          <h3>Sourdough, baked every morning at five.</h3>
          <p>Country loaves, celebration cakes and good coffee, a block from the park.</p>
          <div className="bk-btns"><em>Order for pickup</em><span>Today’s bakes →</span></div>
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

function Plumber() {
  return (
    <div className="pl">
      <div className="pl-top"><span>Licensed and insured · Rivertown and the valley</span><b>(555) 014-2200</b></div>
      <div className="pl-nav"><b>RIVERTOWN PLUMBING</b><span>Services</span><span>Areas</span><span>About</span><em>Call now</em></div>
      <div className="pl-hero ph">
        <Photo id="1749532125405-70950966b0e5" sizes="(max-width: 900px) 100vw, 760px" pos="50% 40%" />
        <div className="pl-copy">
          <small>Open 24/7 · Same-day callouts</small>
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

function Salon() {
  return (
    <div className="sa">
      <div className="sa-nav"><span>Services</span><b>SALT &amp; STONE</b><span>Book</span></div>
      <div className="sa-hero">
        <div className="ph"><Photo id="1633681926022-84c23e8cb2d6" sizes="(max-width: 900px) 50vw, 300px" /></div>
        <div className="sa-copy">
          <small>Jones Street · Savannah</small>
          <h3>Hair that grows out beautifully.</h3>
          <p>Lived-in color and precise cuts, by appointment.</p>
          <em>Book a chair</em>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

export default function Home() {
  return (
    <div className="home">
      <header className="nav">
        <div className="wrap">
          <Logo />
          <nav aria-label="Main">
            <a className="hide-sm" href="#how">How it works</a>
            <a className="hide-sm" href="/templates">Templates</a>
            <a className="hide-sm" href="#pricing">Pricing</a>
            <a href="/login">Log in</a>
            <a className="b b-light b-sm" href="/signup">Start free</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg"><Photo id="1687422808248-f807f4ea2a2e" sizes="100vw" priority pos="60% 30%" /></div>
          <div className="wrap hero-in">
            <p className="eyebrow"><i />Early access · free while we build</p>
            <h1>Your business,<br />online by tonight.</h1>
            <p className="lede">Tell SaySites what you do. It builds a fast website that’s set up for Google, then changes it whenever you ask. <strong>$15 a month. 0% of your sales.</strong></p>
            <SayBox id="idea-top" />
            <ul className="assure"><li>No credit card</li><li>Live in minutes</li><li>Cancel anytime</li></ul>
          </div>
        </section>

        <section className="product" aria-label="The SaySites editor">
          <div className="wrap">
            <div className="app" aria-hidden="true">
              <div className="app-bar">
                <span className="app-logo"><LogoMark size={18} />saysites</span>
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
                  <div className="msg her m2">Done. I added “Sat–Sun, 7am–2pm” to the header and a pastries card on your home page.</div>
                  <div className="diff m3">
                    <div><span>Header</span><span>+ Weekend hours</span></div>
                    <div><span>Home · cards</span><span>+ Pastries</span></div>
                    <div><span>Speed check</span><span>Still 100</span></div>
                  </div>
                  <div className="msg me m4">Perfect. Publish it.</div>
                  <div className="ask">Ask Sofie to change anything…</div>
                </aside>
              </div>
            </div>
            <div className="checks" aria-hidden="true">
              <b>Page checks</b>
              <span>Title fits Google</span><span>One main heading</span><span>Business details</span><span>Sitemap</span>
            </div>
            <p className="product-note">A preview of the SaySites editor with Sofie, your assistant.</p>
          </div>
        </section>

        <section className="stats" aria-label="SaySites at a glance">
          <div className="wrap">
            <div><b>$15</b><span>a month, everything included</span></div>
            <div><b>0%</b><span>of your sales, ever</span></div>
            <div><b>100</b><span>Google speed score on our sample site</span></div>
            <div><b>95+</b><span>required before any page goes live</span></div>
          </div>
        </section>

        <section className="how dark" id="how">
          <div className="wrap">
            <div className="head">
              <p className="kicker">How it works</p>
              <h2>No templates. No plugins.<br />Just say it.</h2>
            </div>
            <ol className="steps">
              <li>
                <span className="n">01</span>
                <h3>Say what you do</h3>
                <p>Your business, your town, what you offer. A sentence or two is plenty.</p>
                <div className="vis vis-type">We’re a two-person roofing crew in Tulsa. Repairs and storm damage.<i /></div>
              </li>
              <li>
                <span className="n">02</span>
                <h3>Get a finished site</h3>
                <p>Home, Services and Contact pages, written for your customers and set up for Google.</p>
                <div className="vis vis-pages"><span>Home</span><span>Services</span><span>Contact</span><span>Sitemap</span></div>
              </li>
              <li>
                <span className="n">03</span>
                <h3>Ask for changes</h3>
                <p>Tell Sofie what to change. You see it first and can undo anything.</p>
                <div className="vis vis-chat"><span>Add 10% off gutter cleaning until Friday.</span></div>
              </li>
            </ol>
          </div>
        </section>

        <section className="examples" id="examples">
          <div className="wrap">
            <div className="head split">
              <div>
                <p className="kicker">Talk &amp; Design templates</p>
                <h2>Pick a look. Say who you are. Done.</h2>
              </div>
              <p>Each template comes with a ready-made prompt. Fill in your business name, town and services, and Sofie designs your site from it. Then keep talking to change anything.</p>
            </div>
            <div className="tpls">
              {TEMPLATES.map((t, i) => (
                <article className={`tplrow${i % 2 ? ' flip' : ''}`} key={t.key}>
                  <div className="tplrow-shot">
                    <Frame url={`${t.example}.saysites.com`}>{t.key === 'bold' ? <Plumber /> : t.key === 'editorial' ? <Salon /> : <Bakery />}</Frame>
                  </div>
                  <div className="tplrow-copy">
                    <h3>{t.name}</h3>
                    <p className="tplrow-for">Great for {t.bestFor.toLowerCase()}</p>
                    <div className="prompt-card">
                      <span className="prompt-label">The prompt</span>
                      <p>{t.prompt({}).split(/(\[[^\]]+\])/).map((part, n) => (part.startsWith('[') ? <mark key={n}>{part.slice(1, -1)}</mark> : part))}</p>
                    </div>
                    <div className="tplrow-actions">
                      <a className="b b-dark" href={`/signup?template=${t.key}`}>Use this template</a>
                      <a className="tplrow-link" href={`/preview/${t.example}`}>See the live example →</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="tpl-more"><a className="b b-line" href="/templates">See all 13 live example sites →</a></p>
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
            <div className="plans">
              <div className="plan plan-main">
                <div className="plan-top"><h3>Site</h3><span className="tag">Start here</span></div>
                <div className="amt">$15<small>/month</small></div>
                <p className="per">For service businesses</p>
                <ul><li>Your full website, built for you</li><li>Your own domain</li><li>Hosting, SSL, SEO and speed checks</li><li>Changes by Sofie</li><li>0% of your sales</li></ul>
                <a className="b b-light b-block" href="/signup">Start free</a>
              </div>
              <div className="plan">
                <div className="plan-top"><h3>Store</h3><span className="tag live">New</span></div>
                <div className="amt">$25<small>/month</small></div>
                <p className="per">For selling online</p>
                <ul><li>Everything in Site</li><li>Products and a Shop page</li><li>Paid through your own Stripe</li><li>0% taken from your sales</li><li>Prices Google can read</li></ul>
                <a className="b b-line b-block" href="/signup">Start free</a>
              </div>
              <div className="plan">
                <div className="plan-top"><h3>SEO Suite</h3><span className="tag">Add-on</span></div>
                <div className="amt">+$19<small>/month</small></div>
                <p className="per">For growing faster</p>
                <ul><li>Rank tracking</li><li>One-click SEO fixes</li><li>Competitor tracking</li><li>AI search tracking</li><li>Content plans Sofie writes</li></ul>
                <a className="b b-line b-block" href="/signup">Start free</a>
              </div>
            </div>
            <p className="fine">Free during early access. Planned launch prices. Cancel anytime, no setup fees.</p>
          </div>
        </section>

        <section className="feats">
          <div className="wrap">
            <div className="head">
              <p className="kicker">What’s inside</p>
              <h2>The things SEO pros do, done for you.</h2>
            </div>
            <div className="feat-grid">
              <div><h3>Built to rank</h3><p>Clean code, one clear heading per page, titles that fit Google, a sitemap and business details Google can read.</p><span className="tag live">Live</span></div>
              <div><h3>Always fast</h3><p>Every page is checked before it goes live. If a change would slow your site down, it gets fixed first.</p><span className="tag live">Live</span></div>
              <div><h3>Your own address</h3><p>Every site gets yourname.saysites.com, and you can connect a domain you own.</p><span className="tag live">Live</span></div>
              <div><h3>Sofie, your assistant</h3><p>Change text, photos, sections and pages by chatting. You see every change first and can undo it.</p><span className="tag live">Live</span></div>
              <div><h3>Messages, not missed calls</h3><p>Every site has a contact form. Messages land in your inbox, with reply and call buttons right there.</p><span className="tag live">Live</span></div>
              <div><h3>A blog that brings people in</h3><p>Write helpful posts, or ask Sofie to draft one. Each gets its own page, a spot in your sitemap and the markup Google looks for.</p><span className="tag live">Live</span></div>
              <div><h3>Nothing is ever lost</h3><p>Every change is saved as a version, and Sofie’s edits wait in a draft you can undo or throw away before anything goes live.</p><span className="tag live">Live</span></div>
              <div><h3>Google and Bing, connected</h3><p>Paste one code to prove you own your site in Search Console and Bing Webmaster Tools. Your sitemap is ready for both.</p><span className="tag live">Live</span></div>
              <div><h3>See who’s visiting</h3><p>Page views per day and your most-read pages, counted without cookies. No cookie banner, nothing slowing you down.</p><span className="tag live">Live</span></div>
              <div><h3>Your photos, your logo</h3><p>Upload from your phone and they’re resized for speed automatically. Show your work in a gallery and your reviews in their own section.</p><span className="tag live">Live</span></div>
              <div><h3>Sell online, keep 100%</h3><p>Add products and a Shop page in minutes. Customers pay you through your own Stripe account, with nothing taken from each sale.</p><span className="tag live">Live</span></div>
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
              <details><summary>Do I need any design or tech skills?</summary><p>No. You describe your business and we build the site, then you change anything by asking Sofie: “make the photo darker”, “add our Saturday hours”. A drag-and-drop editor is coming too, for people who like to tinker.</p></details>
              <details><summary>What does “0% of your sales” mean?</summary><p>Customers pay you through your own Stripe account. Stripe charges its normal card processing fee; SaySites takes nothing on top.</p></details>
              <details><summary>Will my site show up on Google?</summary><p>Every site is built the way Google likes: fast, clean, with proper titles, a sitemap and business details search engines can read. Nobody can promise a #1 spot, but you start with the foundations right.</p></details>
              <details><summary>Can I use my own domain?</summary><p>Yes. Every site gets a free yourname.saysites.com address, and you can connect a domain you own.</p></details>
              <details><summary>What happens after early access?</summary><p>We’ll tell you well before anything changes. Planned pricing is $15 a month for a site and $25 a month for a store, and you can cancel anytime.</p></details>
            </div>
          </div>
        </section>

        <section className="last">
          <div className="hero-bg"><Photo id="1633681926022-84c23e8cb2d6" sizes="100vw" /></div>
          <div className="wrap">
            <LogoMark size={44} />
            <h2>Your website is one sentence away.</h2>
            <SayBox id="idea-bottom" />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <Logo />
          <nav aria-label="Footer"><a href="/templates">Templates</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Log in</a></nav>
          <span>© {new Date().getFullYear()} SaySites</span>
        </div>
      </footer>
    </div>
  )
}
