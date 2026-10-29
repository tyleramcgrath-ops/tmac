import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { MockupForm } from '@/components/MockupForm'
import '../home.css'

export const metadata: Metadata = {
  title: 'Free homepage mockup',
  description: 'Tell us your website and we’ll send you a picture of your homepage redesigned on SaySites: fast, mobile-first and easy to change. Free, no account.',
  alternates: { canonical: '/mockup' },
}

export default function MockupPage() {
  return (
    <MarketingShell>
      <section className="page-hero redesign-hero">
        <div className="wrap">
          <p className="kicker">Free homepage mockup</p>
          <h1>See your homepage redesigned, sent to your inbox.</h1>
          <p>Give us your website and we’ll design your homepage on SaySites with your business name, phone, town and services, and send you a picture of it next to your site today, on a computer and a phone. Free, with no account and nothing to sign.</p>
          <MockupForm />
          <p className="fine">We only read your public website. Prefer to see it right now? <a href="/redesign">Get an instant live preview</a>.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
