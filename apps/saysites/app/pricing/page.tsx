import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { ClassicPlans } from '@/components/ClassicPlans'
import { PricingPlans } from '@/components/PricingPlans'
import { PLAN_NAMES, PLANS, PRICES } from '@/lib/billing'
import { JsonLd, ORG, breadcrumbs } from '@/components/JsonLd'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Pricing: Websites from $${PRICES.site.month} a Month, No Setup Fee`,
  description: `Small-business websites from $${PRICES.site.month} a month and online stores from $${PRICES.store.month}, with hosting, SEO and Sofie included. Law firm plans from $${PRICES.lawstarter.month}. No setup fee.`,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'SaySites website plans',
          description: 'Websites and online stores for small businesses and law firms, with hosting, SEO and Sofie included. No setup fee.',
          brand: { '@type': 'Brand', name: 'SaySites' },
          offers: PLANS.map((p) => ({ '@type': 'Offer', name: PLAN_NAMES[p], price: String(PRICES[p].month), priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(PRICES[p].month), priceCurrency: 'USD', unitText: 'MONTH' }, url: 'https://saysites.com/pricing', seller: { '@id': ORG['@id'] } })),
        },
        breadcrumbs([['Home', '/'], ['Pricing', '/pricing']]),
      ]} />
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Pricing</p>
          <h1>One price.<br />Everything included.</h1>
          <p>Your website, Sofie, hosting, SEO and your leads inbox, all in one monthly price, with 0% taken from your sales. No setup fee, no contract, and a free trial with no card.</p>
        </div>
      </section>
      <section className="pricing" id="plans">
        <div className="wrap">
          <ClassicPlans lawLink="#law" />
        </div>
      </section>
      <section className="ind-sec" id="law">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">Law firms</p>
              <h2>Plans made for law firms.</h2>
            </div>
            <p>Practice area pages, attorney profiles, intake questions and attorney advertising notices, built in.</p>
          </div>
          <PricingPlans only="law" />
        </div>
      </section>
    </MarketingShell>
  )
}
