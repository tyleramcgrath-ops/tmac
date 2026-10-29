import { PRICES, TRIAL_DAYS } from '@/lib/billing'
import { intelReady } from '@/lib/seo-intel'

// The plans, at the prices in lib/billing.ts (the same ones Stripe charges),
// so the website and checkout can never disagree. Small businesses first,
// law firms after (or alone, on the law firm page). Each line is a feature
// that's built; the paid Google and AI lookups only show once switched on.
const usd = (n: number) => `$${new Intl.NumberFormat('en-US').format(n)}`

export function PricingPlans({ only }: { only?: 'law' }) {
  const google = intelReady.rankings()
  const ai = intelReady.ai()
  const starter = [
    'Three law firm designs, written for how clients choose a lawyer',
    'A page for every practice area, attorney profiles and office pages',
    'A consultation request on every page, with intake questions per practice area and a conflict-check field',
    'Attorney advertising notices and disclaimers in the footer',
    'Your leads pipeline: instant replies, alerts, follow-ups and review requests',
    'Every lead sent to Clio Grow, HubSpot, Salesforce or Pipedrive if you use them',
    'Logins for your intake staff, paralegals and office manager',
    'A full SEO audit of every page, fixes in one click, and side-by-side with three competitors',
    'A monthly results email: leads, calls and where they came from',
    'Hosting, your domain, security and a 95+ speed score on every page',
  ]
  const law = [
    'Everything in Law Firm Starter',
    ...(google ? ['Your Google positions for the searches that matter, checked daily', 'Citation Gap: your pages against what Google ranks and its AI Overview quotes'] : []),
    ...(ai ? ['Whether AI assistants cite your firm, checked daily'] : []),
    'Three times the Sofie allowance, for bigger changes in plain words',
  ]
  return (
    <div className="pp">
      {only !== 'law' && (
        <div className="pp-group">
          <h3 className="pp-label">For small businesses</h3>
          <div className="pp-row">
            <Plan
              name="Site"
              price={PRICES.site.month}
              year={PRICES.site.year}
              lede="Your whole website for any small business. Say what you want and it’s on your site."
              items={['Sofie: change anything by saying so, with a monthly allowance', 'Designs and wording made for your kind of business', 'Your leads inbox, instant replies and alerts', 'SEO audit, call tracking and visitor counts', 'Hosting, your domain and security']}
              cta={{ href: '/signup', label: `Start free for ${TRIAL_DAYS} days` }}
              featured
            />
            <Plan
              name="Store"
              price={PRICES.store.month}
              year={PRICES.store.year}
              lede="Everything in Site, plus selling online."
              items={['Everything in Site', 'Products and a shop page', '0% of your sales, always', 'A bigger monthly allowance for Sofie']}
              cta={{ href: '/signup', label: `Start free for ${TRIAL_DAYS} days` }}
            />
          </div>
        </div>
      )}
      <div className="pp-group">
        <h3 className="pp-label">For law firms</h3>
        <div className="pp-row pp-three">
          <Plan
            name="Law Firm Starter"
            price={PRICES.lawstarter.month}
            year={PRICES.lawstarter.year}
            lede="A complete law firm website you build and change yourself, with everything a firm needs from day one."
            items={starter}
            cta={{ href: '/signup', label: `Start free for ${TRIAL_DAYS} days` }}
            featured={only === 'law'}
          />
          <Plan
            name="Law Firm"
            price={PRICES.law.month}
            year={PRICES.law.year}
            lede="For firms competing hard for searches: everything in Starter, plus live tracking of where you stand."
            items={law}
            cta={{ href: '/signup', label: `Start free for ${TRIAL_DAYS} days` }}
          />
          <Plan
            name="Law Firm, built for you"
            price={PRICES.lawpro.month}
            year={PRICES.lawpro.year}
            lede="We build your whole site from your current one and your practice, you approve it before it goes live, and we make changes when you ask."
            items={['Everything in Law Firm', 'Built by our team from your current site, your bios and your practice areas', 'Your pages keep their addresses, with redirects for the rest, so you keep what you rank for', 'You approve every page before it goes live', 'Changes made for you whenever you ask']}
            cta={{ href: '/redesign', label: 'See your site redesigned, free' }}
          />
        </div>
      </div>
      <p className="pp-fine">Prices in US dollars. Yearly billing is two months free. No setup fee, no contract: cancel any time from your account. A {TRIAL_DAYS}-day free trial on every self-serve plan.</p>
    </div>
  )
}

function Plan({ name, price, year, lede, items, cta, featured }: { name: string; price: number; year: number; lede: string; items: string[]; cta: { href: string; label: string }; featured?: boolean }) {
  return (
    <article className={`pp-plan${featured ? ' pp-featured' : ''}`}>
      <h4>{name}</h4>
      <p className="pp-price"><b>{usd(price)}</b><span>a month</span></p>
      <p className="pp-year">or {usd(year)} a year</p>
      <p className="pp-lede">{lede}</p>
      <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
      <a className={`b ${featured ? 'b-dark' : 'b-line'}`} href={cta.href}>{cta.label}</a>
    </article>
  )
}
