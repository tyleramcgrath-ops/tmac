import { PRICES, TRIAL_DAYS } from '@/lib/billing'
import { BUILDERS_CHECKED, BUILDER_RANGE } from '@/lib/builder-prices'

// The original pricing cards (Site, Store, and a pointer to the law firm
// plans), at the prices in lib/billing.ts, the same ones Stripe charges.
// The comparison is an unnamed range from lib/builder-prices.ts.
const usd = (n: number) => `$${new Intl.NumberFormat('en-US').format(n)}`

export function ClassicPlans({ lawLink = '/websites-for/law-firms' }: { lawLink?: string }) {
  const { site, store, lawstarter } = PRICES
  const r = BUILDER_RANGE
  return (
    <>
      <div className="plans">
        <div className="plan plan-main">
          <div className="plan-top"><h3>Site</h3><span className="tag">Start here</span></div>
          <div className="amt">{usd(site.month)}<small>/month</small></div>
          <p className="per">For any small business, or {usd(site.year)} a year, two months free</p>
          <ul><li>Your full website, made by saying what you want</li><li>Sofie for everyday changes, every month</li><li>Your own domain</li><li>Hosting, SSL, SEO and speed checks</li><li>Call tracking and a leads inbox</li></ul>
          <a className="b b-light b-block" href="/signup">Start free</a>
        </div>
        <div className="plan">
          <div className="plan-top"><h3>Store</h3><span className="tag">0% of sales</span></div>
          <div className="amt">{usd(store.month)}<small>/month</small></div>
          <p className="per">For selling online, or {usd(store.year)} a year, two months free</p>
          <ul><li>Everything in Site</li><li>Products and a Shop page</li><li>Paid through your own Stripe</li><li>0% taken from your sales</li><li>A bigger Sofie allowance</li></ul>
          <a className="b b-line b-block" href="/signup">Start free</a>
        </div>
        <div className="plan">
          <div className="plan-top"><h3>Law firms</h3><span className="tag">For firms</span></div>
          <div className="amt">{usd(lawstarter.month)}<small>/month</small></div>
          <p className="per">Law Firm Starter, or {usd(lawstarter.year)} a year</p>
          <ul><li>Practice area pages and attorney profiles</li><li>A consultation request on every page</li><li>Intake questions and staff logins</li><li>Attorney advertising notices</li><li>Bigger plans with live Google tracking</li></ul>
          <a className="b b-line b-block" href={lawLink}>See law firm plans</a>
        </div>
      </div>
      <p className="fine">{TRIAL_DAYS}-day free trial, no card needed. Cancel anytime, no setup fees. Sofie’s allowance refills every month; you can always make changes yourself too.</p>

      <div className="compare">
        <div className="compare-head">
          <h3>What it costs somewhere else</h3>
          <p>Same job, the big-name builders’ prices. Most charge more for a site, and some take a cut of every sale on top.</p>
        </div>
        <div className="compare-scroll">
          <table>
            <thead>
              <tr><th scope="col"><span className="sr">Plan</span></th><th scope="col" className="us">SaySites</th><th scope="col">The big-name builders</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">A website</th><td className="us">{usd(site.month)}/mo</td><td>{usd(r.site.low)} to {usd(r.site.high)}/mo</td></tr>
              <tr><th scope="row">Selling online</th><td className="us">{usd(store.month)}/mo</td><td>{usd(r.store.low)} to {usd(r.store.high)}/mo</td></tr>
              <tr><th scope="row">Their cut of each sale</th><td className="us">0%</td><td>{r.cut.low}% to {r.cut.high}%</td></tr>
            </tbody>
          </table>
        </div>
        <p className="compare-note">The cheapest website and store plans of the three best-known website builders, from their own pricing pages, checked {BUILDERS_CHECKED}, billed monthly except one yearly-billed website plan. Card processing (about 2.9% + 30¢ a sale) applies everywhere, including Stripe on SaySites.</p>
      </div>
    </>
  )
}
