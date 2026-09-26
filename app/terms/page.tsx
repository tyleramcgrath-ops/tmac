import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import '../home.css'

export const metadata: Metadata = { title: 'Terms', description: 'The terms for using SaySites.', alternates: { canonical: '/terms' } }

export default function Terms() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Terms</p>
          <h1>The fair, short version.</h1>
          <p>These terms cover your use of SaySites. We’ll tell you before they change.</p>
        </div>
      </section>
      <section className="legal">
        <div className="wrap">
          <h2>Plans and changes</h2>
          <p>Every account starts with a 7-day free trial. After that, plans are billed monthly at the prices shown on the homepage, and you can cancel anytime. Features may change, and we’ll tell you before anything you rely on goes away or before any price changes.</p>
          <h2>Who can have an account</h2>
          <p>You must be 18 or older (or the age of majority where you live) to create a SaySites account. Children can help build a website with a parent or guardian, using the parent’s own account. The parent is the account holder, stays responsible for what is published, and shouldn’t put a child’s surname, photo, address, school or contact details on a public website.</p>
          <h2>Your content is yours</h2>
          <p>You own your business details, words, photos and the websites you build. You give us permission to store and display them so your website works.</p>
          <h2>Using SaySites fairly</h2>
          <ul>
            <li>Only publish content you have the right to use.</li>
            <li>Don’t use SaySites for anything illegal, deceptive or harmful, or to send spam.</li>
            <li>Don’t try to break, overload or get around the security of the service.</li>
            <li>Every site must follow <a href="https://developers.google.com/search/docs/essentials">Google Search Essentials</a> and Google’s spam policies: no keyword stuffing, hidden text, doorway pages, fake reviews or misleading claims. SaySites is built to earn rankings honestly, and Sofie won’t make changes that break these rules.</li>
          </ul>
          <p>We may take down content or close accounts that break these rules.</p>
          <h2>Sofie</h2>
          <p>Sofie is an AI assistant. She shows every change as a draft before it goes live, but you’re responsible for checking what you publish, especially prices, opening hours and claims about your business.</p>
          <h2>No guarantees</h2>
          <p>We work hard to keep sites fast and online, but SaySites is provided as is. Nobody can promise a particular Google ranking.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
