import type { Metadata } from 'next'
import { BirthdayDemo } from '@/components/BirthdayDemo'
import { BirthdayFeedback } from '@/components/BirthdayFeedback'
import { MarketingShell } from '@/components/MarketingShell'
import { LAUNCH_SHORT } from '@/lib/launch'
import '../home.css'

export const metadata: Metadata = {
  title: 'Try SaySites before anyone else',
  description: 'Build a free website on SaySites in about two minutes, before it opens to everyone, and tell me what you honestly think.',
  robots: { index: false },
  alternates: { canonical: '/early' },
  openGraph: { title: 'Try SaySites before anyone else', description: 'Build a free website in about two minutes and tell me what you honestly think.', images: [{ url: '/og-home.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', images: ['/og-home.jpg'] },
}

// Early access before the public launch (formerly /birthday): friends and
// first customers try SaySites, then say what they think. Signups carry the
// EARLY code so they can be counted on the launch dashboard.
export default function EarlyPage() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap bd-hero-grid">
          <div>
          <p className="kicker">Early access, opens {LAUNCH_SHORT}</p>
          <h1>Build a website with me, before anyone else.</h1>
          <p>SaySites is the website builder I’ve been making for small businesses. Before it opens to everyone, I’d love you to try it and tell me what you honestly think. It takes about two minutes, and building costs you nothing.</p>
          <p>You’re one of the first people to see it. You don’t need to know anything about websites: say what the business is, pick the look, and watch your site come together. Want something changed? Ask Sofie, the assistant, the way you’d text a friend. I’ve spent many years learning what websites need and what search engines reward, and all of it is built in.</p>
          <p style={{ marginTop: 28 }}><a className="b b-dark" href="/signup?promo=EARLY">Build a site</a></p>
          <p className="bd-fine">Free to build, no card. Send me a few honest sentences and your first three months are on me.</p>
          </div>
          <BirthdayDemo />
        </div>
      </section>

      <section className="ind-sec ind-alt">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">How it works</p>
              <h2>Three steps, about two minutes.</h2>
            </div>
            <p>No business? Build one for a friend, a relative, or make one up. A taco truck, a dog groomer, a law firm: anything works.</p>
          </div>
          <ol className="ind-pages">
            <li><div><h3>Make a free account</h3><p>Just a name, an email and a password. No card.</p></div></li>
            <li><div><h3>Describe the business</h3><p>Pick the kind of business and type a few details. You’ll watch your site come together as you type, SEO fully optimized. Then ask Sofie to change anything, in plain words.</p></div></li>
            <li><div><h3>Tell me what you think</h3><p>Press <strong>Feedback</strong> in the bottom corner of your dashboard. What was great, what was confusing, what broke. Blunt is best. Write a few real sentences and your first three months are free, my thank-you for being here early.</p></div></li>
          </ol>
          <p style={{ marginTop: 28 }}><a className="b b-dark" href="/signup?promo=EARLY">Start building</a></p>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Just want to say something?</p>
            <h2>Tell me straight.</h2>
            <p className="ind-lede-dark">Looked around but didn’t build anything? I still want to hear it. What would make you, or a business you know, actually use this?</p>
            <p className="bd-fine">Built a site? Send it from the Feedback button inside, so the three free months land on your account.</p>
          </div>
          <BirthdayFeedback page="/early" />
        </div>
      </section>
    </MarketingShell>
  )
}
