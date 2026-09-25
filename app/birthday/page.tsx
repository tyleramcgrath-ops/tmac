import type { Metadata } from 'next'
import { BirthdayDemo } from '@/components/BirthdayDemo'
import { BirthdayFeedback } from '@/components/BirthdayFeedback'
import { MarketingShell } from '@/components/MarketingShell'
import '../home.css'

export const metadata: Metadata = {
  title: 'For my birthday, build a website with me',
  description: 'No gifts. Build a free website on SaySites in two minutes and tell me what you honestly think.',
  robots: { index: false },
  openGraph: { title: 'For my birthday, build a website with me', description: 'No gifts. Build a free website in two minutes and tell me what you honestly think.' },
}

// Tyler's birthday ask (Monday, September 28): try SaySites, then say what
// you think. Signups carry the BIRTHDAY code so they can be counted.
export default function BirthdayPage() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap bd-hero-grid">
          <div>
          <p className="kicker">My birthday · Monday, September 28</p>
          <h1>For my birthday, build a website with me.</h1>
          <p>No gifts, no cake. All I want is for you to try SaySites, the website builder I’ve been making for small businesses, and tell me what you honestly think. It takes about two minutes, and building costs you nothing.</p>
          <p>You’re one of the first people to see it. You don’t need to know anything about websites: say what the business is, pick the look, and watch your site come together. Want something changed? Ask Sofie, the assistant, the way you’d text a friend. I’ve spent many years learning what websites need and what search engines reward, and all of it is built in.</p>
          <p style={{ marginTop: 28 }}><a className="b b-dark" href="/signup?promo=BIRTHDAY">Build a site for my birthday</a></p>
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
            <li><span>01</span><div><h3>Make a free account</h3><p>Just a name, an email and a password. No card.</p></div></li>
            <li><span>02</span><div><h3>Describe the business</h3><p>Pick the kind of business and type a few details. You’ll watch your site come together as you type, SEO fully optimized. Then ask Sofie to change anything, in plain words.</p></div></li>
            <li><span>03</span><div><h3>Tell me what you think</h3><p>Press <strong>Feedback</strong> in the bottom corner of your dashboard. What was great, what was confusing, what broke. Blunt is best. Write a few real sentences and your first three months are free, my thank-you for being here early.</p></div></li>
          </ol>
          <p style={{ marginTop: 28 }}><a className="b b-dark" href="/signup?promo=BIRTHDAY">Start building</a></p>
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
          <BirthdayFeedback />
        </div>
      </section>
    </MarketingShell>
  )
}
