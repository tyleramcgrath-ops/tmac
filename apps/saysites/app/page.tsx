import { Logo, LogoMark } from '@/components/Logo'
import './home.css'

// saysites.com. A static page: no client JavaScript of its own, all motion is
// CSS. Anything not built yet is labelled "Coming soon".

const TRADES = ['Plumbers', 'Dentists', 'Hair salons', 'Roofers', 'Bakeries', 'Law firms', 'Electricians', 'Cleaners', 'Landscapers', 'Auto shops', 'Restaurants', 'Boutiques']

function SayBox({ id }: { id: string }) {
  return (
    <form className="say" action="/signup" method="get" role="search" aria-label="Describe your business">
      <label htmlFor={id} className="visually-hidden">What does your business do?</label>
      <input id={id} name="idea" placeholder="A family bakery in Portland, Oregon…" autoComplete="off" maxLength={200} />
      <button className="btn btn-lime btn-lg" type="submit">Build my site →</button>
    </form>
  )
}

export default function Home() {
  return (
    <div className="home">
      <div className="night">
        <header className="hnav">
          <div className="wrap">
            <Logo inverted />
            <nav aria-label="Main">
              <a className="hide-sm" href="#how">How it works</a>
              <a className="hide-sm" href="#price">Pricing</a>
              <a className="hide-sm" href="#faq">FAQ</a>
              <a href="/login">Log in</a>
              <a className="btn btn-lime btn-sm" href="/signup">Start free</a>
            </nav>
          </div>
        </header>

        <section className="hero2">
          <div className="wrap">
            <div className="copy">
              <span className="kicker">The website builder you talk to</span>
              <h1>
                Say it.<br />
                It’s <span className="serif">built.</span>
              </h1>
              <p className="lede">
                Describe your business in one sentence. SaySites builds a fast website that’s ready for Google, and changes it whenever you ask.{' '}
                <strong>$15 a month. 0% of your sales. Ever.</strong>
              </p>
              <SayBox id="idea-top" />
              <div className="say-note">
                <span>Free while in early access</span>
                <span>No credit card</span>
                <span>Live in minutes</span>
              </div>
            </div>

            <div className="stage" aria-hidden="true">
              <div className="bubble2 you">“A family bakery in Portland. Sourdough, cakes and coffee.”</div>
              <div className="browser">
                <div className="browser-bar"><i /><i /><i /><span className="url">rosies-bakery.saysites.com</span></div>
                <div className="mini build">
                  <div className="mini-nav"><span>Rosie’s Bakery</span><span>Order ahead →</span></div>
                  <div className="mini-hero">
                    <b>Portland’s neighborhood sourdough, baked at 5am</b>
                    <p>Fresh loaves, celebration cakes and good coffee on SE Division. Order ahead or stop by.</p>
                    <div className="mini-btns"><em>Order now</em><em>See the menu</em></div>
                  </div>
                  <div className="mini-grid">
                    <div><b>Sourdough</b>Country, rye and seeded loaves daily.</div>
                    <div><b>Cakes</b>Birthdays, weddings and everything in between.</div>
                    <div><b>Coffee</b>Locally roasted, pulled with care.</div>
                  </div>
                </div>
              </div>
              <div className="bubble2 sofie"><b><i />Sofie</b>Done. Your site is live with Google-ready business info. Want me to add your opening hours?</div>
              <div className="gauge">
                <div><b>100</b>Speed</div>
                <div><b>100</b>SEO</div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Built for local businesses">
          <div className="ticker-track">
            {[...TRADES, ...TRADES].map((t, i) => <span key={i} aria-hidden={i >= TRADES.length}>{t}</span>)}
          </div>
        </div>
      </div>

      <section className="price-sec" id="price">
        <div className="wrap">
          <div>
            <span className="kicker">The price</span>
            <h2 className="big-h">Everything included.<br /><span className="serif">Nothing</span> taken.</h2>
            <p className="lead">Other builders charge more for a store, sell the extras as paid apps, and some take a fee on every sale. SaySites is one flat price, and your money stays yours.</p>
            <ul className="price-points">
              <li><b>1</b><span><strong>One price.</strong> Hosting, SSL, SEO setup and speed checks are included, not upsells.</span></li>
              <li><b>2</b><span><strong>0% of your sales.</strong> Customers pay you through your own Stripe account.</span></li>
              <li><b>3</b><span><strong>No plugins to buy.</strong> The things you’d normally add on are already built in.</span></li>
            </ul>
          </div>
          <div className="receipt" aria-label="What you pay SaySites each month">
            <span className="stamp">No hidden fees</span>
            <h3>SaySites</h3>
            <div className="sub">MONTHLY RECEIPT</div>
            <div className="line"><span>Your website</span><span>$15.00</span></div>
            <div className="line"><span>Hosting</span><span className="free">included</span></div>
            <div className="line"><span>SSL certificate</span><span className="free">included</span></div>
            <div className="line"><span>SEO setup</span><span className="free">included</span></div>
            <div className="line"><span>Speed checks</span><span className="free">included</span></div>
            <div className="line"><span>Changes by Sofie</span><span className="free">included</span></div>
            <div className="line"><span>Cut of your sales</span><span className="free">0%</span></div>
            <div className="total"><span>Total</span><b>$15<small>/mo</small></b></div>
            <div className="foot">Free while in early access. Planned launch price.</div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="wrap">
          <span className="kicker">How it works</span>
          <h2 className="big-h">No templates. No plugins.<br /><span className="serif">Just talk.</span></h2>
          <div className="how-rows">
            <div className="how-row">
              <div className="n">01</div>
              <div><h3>Say what you do</h3><p>Your business, your town, what you offer. A sentence or two is plenty.</p></div>
              <div className="ex"><q>We’re a two-person roofing crew in Tulsa. Repairs, replacements and storm damage.</q></div>
            </div>
            <div className="how-row">
              <div className="n">02</div>
              <div><h3>Get a finished website</h3><p>Home, Services and Contact pages, written for your customers and set up for Google, live on your own address.</p></div>
              <div className="ex">Your pages, your phone number on every page, a sitemap, and business details Google can read, all in seconds.</div>
            </div>
            <div className="how-row">
              <div className="n">03</div>
              <div><h3>Ask for changes</h3><p>Sofie makes the change, shows you first, and you can undo anything.</p></div>
              <div className="ex"><q>Add a banner: 10% off gutter cleaning until Friday.</q> <span className="tag" style={{ marginLeft: 6 }}>Coming soon</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof">
        <div className="wrap">
          <div>
            <span className="kicker">Fast by design</span>
            <h2 className="big-h">Built to <span className="serif">rank,</span> not just to look nice.</h2>
            <p className="lead" style={{ fontSize: 19, color: 'var(--ink-2)' }}>
              Google rewards fast, clean sites. Ours are lean from the start: no bloated page builder, no plugins, no waiting. Every page is checked before it goes live.
            </p>
          </div>
          <div>
            <div className="dials">
              {['Speed', 'SEO', 'Access', 'Best practice'].map((l) => (
                <div className="dial" key={l}><div className="ring"><b>100</b></div><span>{l}</span></div>
              ))}
            </div>
            <p className="note">Google Lighthouse mobile scores for our <a href="/preview/rivertown-plumbing">sample site</a>. Every SaySites page must score 95+ to publish.</p>
          </div>
        </div>
      </section>

      <section className="examples">
        <div className="wrap">
          <span className="kicker">What you get</span>
          <h2 className="big-h">Real sites, <span className="serif">ready to go.</span></h2>
          <div className="ex-grid">
            <a className="ex-card" href="/preview/rivertown-plumbing">
              <div className="ex-top" style={{ background: '#eaf1f8', color: '#0b2e4f' }}>
                <small>RIVERTOWN PLUMBING</small>
                <b>Fast, honest plumbing in Rivertown</b>
                <i style={{ background: '#0f5ea8', color: '#fff' }}>Call now</i>
              </div>
              <div className="ex-meta"><strong>Plumber</strong><span>View live example →</span></div>
            </a>
            <div className="ex-card">
              <div className="ex-top" style={{ background: '#edf5ef', color: '#12402a' }}>
                <small>BRIGHT SMILE DENTAL</small>
                <b>Dental care in Austin you can count on</b>
                <i style={{ background: '#1f7a4d', color: '#fff' }}>Book a visit</i>
              </div>
              <div className="ex-meta"><strong>Dentist</strong><span>Forest style</span></div>
            </div>
            <div className="ex-card">
              <div className="ex-top" style={{ background: '#fbf0e9', color: '#431407' }}>
                <small>SALT & STONE SALON</small>
                <b>Cuts and color in Savannah you’ll love</b>
                <i style={{ background: '#c2410c', color: '#fff' }}>Book now</i>
              </div>
              <div className="ex-meta"><strong>Hair salon</strong><span>Sunset style</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="feats">
        <div className="wrap">
          <span className="kicker">Everything in one place</span>
          <h2 className="big-h">The tools SEO pros use, <span className="serif">done for you.</span></h2>
          <div className="feat-grid">
            <div className="feat"><h3>Built to rank <span className="tag live">Live</span></h3><p>Clean code, one clear heading per page, titles that fit Google, a sitemap and business details Google can read.</p></div>
            <div className="feat"><h3>Always fast <span className="tag live">Live</span></h3><p>Every page is checked before it goes live. If a change would slow your site down, it gets fixed first.</p></div>
            <div className="feat"><h3>Your own address <span className="tag live">Live</span></h3><p>Every site gets yourname.saysites.com, and you can connect your own domain.</p></div>
            <div className="feat"><h3>Sofie, your assistant <span className="tag">Coming soon</span></h3><p>Change text, colors, sections and pages by chatting. You see every change first and can undo it.</p></div>
            <div className="feat"><h3>Google, connected <span className="tag">Coming soon</span></h3><p>Import your Business Profile and connect Search Console and Analytics in one click.</p></div>
            <div className="feat"><h3>Sell online, keep 100% <span className="tag">Coming soon</span></h3><p>Products, cart and checkout through your own Stripe account, with 0% taken from each sale.</p></div>
          </div>
        </div>
      </section>

      <section className="plans-sec">
        <div className="wrap">
          <div style={{ textAlign: 'center' }}>
            <span className="kicker">Pricing</span>
            <h2 className="big-h">Simple. <span className="serif">Honest.</span> Cheap.</h2>
          </div>
          <div className="plans2">
            <div className="plan2 hot">
              <h3>Site</h3>
              <div className="amt">$15<small>/mo</small></div>
              <div className="per">For service businesses</div>
              <ul><li>Your full website, built for you</li><li>Your own domain</li><li>SEO and speed built in</li><li>Changes by Sofie</li></ul>
              <a className="btn btn-lime btn-block" href="/signup">Start free</a>
            </div>
            <div className="plan2">
              <h3>Store <span className="tag">Coming soon</span></h3>
              <div className="amt">$25<small>/mo</small></div>
              <div className="per">For selling online</div>
              <ul><li>Everything in Site</li><li>Products, cart and checkout</li><li>0% taken from your sales</li><li>Google Shopping listings</li></ul>
              <a className="btn btn-ghost btn-block" href="/signup">Start free</a>
            </div>
            <div className="plan2">
              <h3>SEO Suite <span className="tag">Add-on</span></h3>
              <div className="amt">+$19<small>/mo</small></div>
              <div className="per">For growing faster</div>
              <ul><li>Rank tracking</li><li>One-click SEO fixes</li><li>Competitor and AI search tracking</li><li>Content plans Sofie writes</li></ul>
              <a className="btn btn-ghost btn-block" href="/signup">Start free</a>
            </div>
          </div>
          <p className="fine">Free while in early access. Planned launch prices. Cancel anytime, no setup fees.</p>
        </div>
      </section>

      <section className="faq-sec" id="faq">
        <div className="wrap">
          <div>
            <span className="kicker">Questions</span>
            <h2 className="big-h">Good <span className="serif">questions.</span></h2>
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

      <section className="last night">
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <span className="kicker" style={{ color: 'var(--lime)' }}>Ready?</span>
          <h2 className="big-h">Your website is <span className="serif" style={{ color: 'var(--lime)' }}>one sentence</span> away.</h2>
          <SayBox id="idea-bottom" />
          <div className="say-note"><span>Free while in early access</span><span>No credit card</span></div>
        </div>
      </section>

      <footer className="hfoot">
        <div className="wrap">
          <span className="logo"><LogoMark inverted />SaySites</span>
          <nav aria-label="Footer"><a href="#price">Pricing</a><a href="#faq">FAQ</a><a href="/login">Log in</a><a href="/signup">Start free</a></nav>
          <span>© {new Date().getFullYear()} SaySites</span>
        </div>
      </footer>
    </div>
  )
}
