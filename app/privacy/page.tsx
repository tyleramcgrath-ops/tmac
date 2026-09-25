import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import '../home.css'

export const metadata: Metadata = { title: 'Privacy', description: 'What SaySites collects, why, and what we never do with it.', alternates: { canonical: '/privacy' } }

export default function Privacy() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Privacy</p>
          <h1>Your data, in plain words.</h1>
          <p>This page describes what SaySites does with your information today. We’ll update it whenever that changes.</p>
        </div>
      </section>
      <section className="legal">
        <div className="wrap">
          <h2>What we collect</h2>
          <ul>
            <li><strong>Your account:</strong> your name, email address and a scrambled (hashed) version of your password. We never store the password itself.</li>
            <li><strong>Your website:</strong> the business details, pages, words and settings you or Sofie create.</li>
            <li><strong>Your conversations with Sofie:</strong> what you ask her and what she changes, so you can see the history and undo changes.</li>
            <li><strong>Messages from your visitors:</strong> when someone fills in the contact form on your website, we store what they send so it can appear in your inbox.</li>
          </ul>
          <h2>What we use it for</h2>
          <p>Only to run your website and your account: showing your site to visitors, letting you log in, and letting Sofie make the changes you ask for. We don’t sell your data or your visitors’ data, and we don’t use it for advertising.</p>
          <h2>Who helps us run SaySites</h2>
          <ul>
            <li><strong>Vercel</strong> hosts the websites and the app.</li>
            <li><strong>Neon</strong> stores the database.</li>
            <li><strong>Anthropic</strong> provides the AI behind Sofie. Your requests and your site’s content are sent to Anthropic’s API to make each change.</li>
            <li><strong>Unsplash</strong> serves the starter photos on new websites.</li>
          </ul>
          <h2>Cookies</h2>
          <p>saysites.com uses one cookie to keep you logged in. Customer websites built with SaySites set no cookies and run no tracking scripts.</p>
          <h2>Deleting your data</h2>
          <p>Deleting a website removes its pages, Sofie history and messages. Deleting your account removes everything linked to it.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
