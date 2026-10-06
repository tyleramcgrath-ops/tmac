import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { PricingPlans } from '@/components/PricingPlans'
import { PRICES } from '@/lib/billing'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Small-business websites from $${PRICES.site.month} a month and online stores from $${PRICES.store.month}, with Sofie, hosting, SEO and leads included and 0% of your sales. Law firm plans from $${PRICES.lawstarter.month}. No setup fee, no contract.`,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Pricing</p>
          <h1>Small-business prices. Everything included.</h1>
          <p>Your website, Sofie, hosting, SEO and your leads inbox, all in one monthly price, with 0% taken from your sales. No setup fee, no contract, and a free trial with no card.</p>
        </div>
      </section>
      <section className="ind-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <PricingPlans />
        </div>
      </section>
    </MarketingShell>
  )
}
