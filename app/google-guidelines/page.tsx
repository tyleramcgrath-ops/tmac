import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { GUIDELINES, GUIDELINES_REVIEWED } from '@/lib/guidelines'
import '../home.css'

export const metadata: Metadata = {
  title: 'Built to Google’s guidelines, kept up to date for every site',
  description: 'How every SaySites website follows Google Search Essentials, spam policies and page experience guidelines, and why a Google change reaches every site at once.',
  alternates: { canonical: '/google-guidelines' },
}

export default function GoogleGuidelinesPage() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Google’s guidelines · reviewed {GUIDELINES_REVIEWED}</p>
          <h1>Built to Google’s guidelines. Kept up with every change.</h1>
          <p>Every SaySites website follows Google’s published guidelines to the letter, and they’re checked on every page before it goes live. When Google changes a guideline, we update the platform once and every site gets it the same day.</p>
        </div>
      </section>

      <section className="ind-sec ind-alt">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Why it matters</p>
            <h2>One platform, updated for everyone.</h2>
            <p className="ind-lede-dark">Most small business sites are a theme plus a pile of plugins, each updated separately, if at all. When Google changes how it ranks pages, those sites fall behind one by one.</p>
          </div>
          <div className="ind-seo">
            <div><h3>No plugins to fall behind</h3><p>SaySites sites are rendered by one platform. Improve the code or a check once, and every site has it immediately. There’s nothing for owners to install or update.</p></div>
            <div><h3>Checked before anything goes live</h3><p>Speed, headings, titles, image descriptions, structured data and originality are checked on every page, every time it changes.</p></div>
            <div><h3>Honest by design</h3><p>No tricks that work until the next update. We don’t chase loopholes; we build what Google says it rewards: fast, accurate, original pages written for people.</p></div>
          </div>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">What every site follows</p>
              <h2>Google’s guidelines, and how SaySites meets each one.</h2>
            </div>
            <p>Each is Google’s own published guidance, linked so you can read it yourself.</p>
          </div>
          <ol className="ind-pages">
            {GUIDELINES.map((g, n) => (
              <li key={g.id}>
                <span>{String(n + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{g.title}</h3>
                  <p>{g.how}</p>
                  <p className="gl-src"><a href={g.source.url} rel="noopener">{g.source.label} ↗</a></p>
                </div>
              </li>
            ))}
          </ol>
          <p className="fine" style={{ marginTop: 32, color: 'var(--ink-mu)', fontSize: 14, maxWidth: 720 }}>Nobody can promise a ranking, and anyone who does isn’t being straight with you. What we can promise is that your site follows Google’s published guidelines, and that when they change, your site changes with them.</p>
          <p style={{ marginTop: 24 }}><a className="b b-dark" href="/redesign">See your site rebuilt to these standards</a></p>
        </div>
      </section>
    </MarketingShell>
  )
}
