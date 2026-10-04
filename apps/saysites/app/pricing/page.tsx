import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { PricingPlans } from '@/components/PricingPlans'
import { PRICES } from '@/lib/billing'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Law firm websites from $${PRICES.law.month} a month, with leads, intake, SEO and hosting included. Websites for other businesses from $${PRICES.site.month} a month. No setup fee, no contract.`,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Pricing</p>
          <h1>Everything a firm needs, at one monthly price.</h1>
          <p>Your website, hosting, leads, intake, SEO and reporting, all included. No setup fee, no contract, and you can see your site redesigned free before you decide.</p>
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
