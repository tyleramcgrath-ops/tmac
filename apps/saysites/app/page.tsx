import { TopBar } from '@/components/TopBar'
import { LogoMark } from '@/components/Logo'

// saysites.com. Static server component: no client JavaScript of its own.
// Anything not built yet is labelled "Coming soon" — the page only promises
// what exists.

export default function Home() {
  return (
    <>
      <TopBar marketing />
      <main>
        <section className="hero">
          <div className="wrap">
            <div>
              <span className="eyebrow">Meet Sofie, your website assistant</span>
              <h1>
                Say what your business does.<br />
                <em>Get a website that ranks.</em>
              </h1>
              <p className="lede">
                Tell SaySites about your business and it builds a clean, fast website that’s ready for Google from day one. Want something changed? Just ask Sofie.
                Cheaper than Shopify, and we never take a cut of your sales.
              </p>
              <div className="actions">
                <a className="btn btn-primary" href="/signup">Build my website free</a>
                <a className="btn btn-ghost" href="/preview/rivertown-plumbing">See an example site</a>
              </div>
              <p className="fine">No credit card. No code. Free while we’re in early access.</p>
            </div>

            <div className="chat" aria-label="Example conversation with Sofie">
              <div className="chat-head">
                <div className="avatar" aria-hidden="true">S</div>
                <div>
                  <strong>Sofie</strong>
                  <span>● Online</span>
                </div>
              </div>
              <p className="bubble me">I run a plumbing company in Rivertown, Ohio. We do drains, leaks and water heaters, and we answer 24/7.</p>
              <p className="bubble sofie">Your site is live: Home, Services and Contact, with your phone number on every page and Google-ready business details built in.</p>
              <p className="bubble me">Can you make the top section darker and add a section about emergencies?</p>
              <div className="bubble sofie">
                Done. Here’s how the new version scores on a phone:
                <div className="scores">
                  <span className="score"><b>100</b>Speed</span>
                  <span className="score"><b>100</b>SEO</span>
                  <span className="score"><b>100</b>Access</span>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>A preview of Sofie. Chat editing is coming soon.</p>
            </div>
          </div>
        </section>

        <div className="strip">
          <div className="wrap">
            <div className="item"><strong>95+</strong><span>speed score on every page</span></div>
            <div className="item"><strong>0%</strong><span>taken from your sales</span></div>
            <div className="item"><strong>SEO</strong><span>built in, not bolted on</span></div>
            <div className="item"><strong>Minutes</strong><span>from sign-up to live site</span></div>
          </div>
        </div>

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <h2>As easy as telling a friend about your business</h2>
              <p>No templates to fight with, no plugins to update, no SEO jargon to learn.</p>
            </div>
            <div className="steps">
              <div className="step">
                <h3>Tell us about your business</h3>
                <p>Your name, what you do and where you do it. A few lines is enough.</p>
              </div>
              <div className="step">
                <h3>Get a finished website</h3>
                <p>Home, Services and Contact pages, written for your customers and set up for Google, live on your own address.</p>
              </div>
              <div className="step">
                <h3>Ask for changes</h3>
                <p>“Add our new service.” “Put up a holiday sale banner.” Sofie makes the change, and you approve it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="features" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-head">
              <h2>Everything a local business needs to be found</h2>
              <p>Built by SEO people, for business owners who’d rather not think about SEO.</p>
            </div>
            <div className="features">
              <div className="feature">
                <h3>Built to rank <span className="tag live">Live</span></h3>
                <p>Clean code, one clear heading per page, titles that fit Google, a sitemap, and business details Google can read, all automatic.</p>
              </div>
              <div className="feature">
                <h3>Fast. Always. <span className="tag live">Live</span></h3>
                <p>Every page is checked before it goes live. If a change would slow your site down, it gets fixed first.</p>
              </div>
              <div className="feature">
                <h3>Sofie, your assistant <span className="tag">Coming soon</span></h3>
                <p>Change text, colors, sections and pages by chatting. Every change is shown to you first and can be undone.</p>
              </div>
              <div className="feature">
                <h3>Google, connected <span className="tag">Coming soon</span></h3>
                <p>Sign in with Google to import your Business Profile and connect Search Console and Analytics automatically.</p>
              </div>
              <div className="feature">
                <h3>Sell online, keep 100% <span className="tag">Coming soon</span></h3>
                <p>Products, cart and checkout through your own Stripe account. We take 0% of every sale.</p>
              </div>
              <div className="feature">
                <h3>Drag-and-drop design <span className="tag">Coming soon</span></h3>
                <p>A builder like Elementor, only lighter, for when you want to arrange things yourself.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section dark">
          <div className="wrap">
            <div className="section-head">
              <h2>Why not just use Shopify, Wix or WordPress?</h2>
              <p>They’re good tools. They just weren’t built for a busy owner who needs to show up on Google.</p>
            </div>
            <div className="compare">
              <div><strong>No plugins</strong><p>SEO, speed and security are built in, so there’s nothing to install or keep updated.</p></div>
              <div><strong>No design skills</strong><p>Describe what you want and Sofie builds it. Use the builder only if you want to.</p></div>
              <div><strong>No cut of your sales</strong><p>Your customers pay you through your own Stripe account. We take 0%.</p></div>
              <div><strong>No slow pages</strong><p>Every page is lean and fast by design, and checked before it goes live.</p></div>
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="wrap">
            <div className="section-head center">
              <h2>Simple pricing</h2>
              <p>Free while we’re in early access. These are our planned launch prices.</p>
            </div>
            <div className="plans">
              <div className="plan">
                <h3>Site</h3>
                <div className="price">$15<small>/month</small></div>
                <ul>
                  <li>Your full website, built for you</li>
                  <li>Your own domain</li>
                  <li>SEO and speed built in</li>
                  <li>Sofie for changes</li>
                </ul>
                <a className="btn btn-ghost btn-block" href="/signup">Start free</a>
              </div>
              <div className="plan featured">
                <h3>Store <span className="tag">Coming soon</span></h3>
                <div className="price">$25<small>/month</small></div>
                <ul>
                  <li>Everything in Site</li>
                  <li>Products, cart and checkout</li>
                  <li>0% taken from your sales</li>
                  <li>Google Shopping listings</li>
                </ul>
                <a className="btn btn-primary btn-block" href="/signup">Start free</a>
              </div>
              <div className="plan">
                <h3>SEO Suite <span className="tag">Add-on</span></h3>
                <div className="price">+$19<small>/month</small></div>
                <ul>
                  <li>Rank tracking</li>
                  <li>One-click SEO fixes</li>
                  <li>Competitor and AI search tracking</li>
                  <li>Content plans Sofie writes for you</li>
                </ul>
                <a className="btn btn-ghost btn-block" href="/signup">Start free</a>
              </div>
            </div>
            <p className="plans-note">Cancel anytime. No setup fees.</p>
          </div>
        </section>

        <section className="section final" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2>Your website, in the time it takes to describe your business.</h2>
            <p className="muted" style={{ fontSize: 19 }}>Try it free. You’ll have a live site before your coffee gets cold.</p>
            <a className="btn btn-primary" href="/signup">Build my website free</a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap">
          <span className="logo" style={{ fontSize: 16 }}><LogoMark />SaySites</span>
          <span>© {new Date().getFullYear()} SaySites. Websites that rank, without the busywork.</span>
        </div>
      </footer>
    </>
  )
}
