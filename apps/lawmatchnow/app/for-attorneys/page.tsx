import type { Metadata } from 'next'
import { SimpleLeadForm } from '@/components/LeadForm'
import { Faqs, PageHero } from '@/components/ui'

export const metadata: Metadata = {
  title: 'For Attorneys: Claim Your Free Profile',
  description: 'Claim and update your free LawMatchNow attorney profile, or upgrade to a featured listing in your city and practice area.',
  alternates: { canonical: '/for-attorneys' },
}

// Prices are set by the business; leave null to show "Request pricing".
const PLANS: { name: string; price: string | null; best?: boolean; features: string[]; cta: string }[] = [
  { name: 'Basic', price: 'Free', cta: 'Claim free profile', features: ['Your profile, verified and editable', 'Practice areas, bio, education and languages', 'Messages from potential clients', 'Listed in city and practice-area pages'] },
  { name: 'Gold', price: null, best: true, cta: 'Request pricing', features: ['Everything in Basic', 'Featured placement in your city', 'Photo, video and website link', 'Case review requests in your practice area'] },
  { name: 'Platinum', price: null, cta: 'Request pricing', features: ['Everything in Gold', 'Top placement across your state', 'Priority case review requests', 'Monthly performance report'] },
]

const FAQS = [
  { q: 'Is a basic listing really free?', a: 'Yes. Any attorney in good standing can claim and maintain a basic profile at no cost, and it stays free.' },
  { q: 'How do you verify attorneys?', a: 'We check your bar number against your state bar’s public records before a profile is marked as claimed. We may also confirm by email or phone.' },
  { q: 'Is a featured listing attorney advertising?', a: 'Yes. Paid placements are labeled “Featured” wherever they appear. You remain responsible for complying with your state’s rules on lawyer advertising.' },
  { q: 'Do you charge per lead or take a fee from cases?', a: 'No. We don’t take a share of legal fees. Featured plans are flat subscriptions.' },
]

export default function ForAttorneys() {
  return (
    <>
      <PageHero crumbs={[{ name: 'For Attorneys', path: '/for-attorneys' }]} eyebrow="For attorneys" title={<>Be found by the clients <em>you</em> serve best.</>}
        lede="People come to LawMatchNow when they need a lawyer for a specific problem in a specific place. Make sure your profile tells them what you do.">
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="#claim">Claim your free profile</a>
          <a className="btn btn-ghost" href="#plans">See plans</a>
        </div>
      </PageHero>
      <section className="section" id="plans">
        <div className="wrap">
          <div className="section-head"><div><div className="eyebrow">Plans</div><h2>Start free. Upgrade when it pays.</h2></div></div>
          <div className="plans">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan${p.best ? ' best' : ''}`}>
                <h3>{p.name}</h3>
                <p className="price">{p.price ?? 'Pricing by market'}</p>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <a className={`btn ${p.best ? 'btn-primary' : 'btn-ghost'}`} href="#claim">{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section alt" id="claim">
        <div className="wrap layout">
          <div className="card">
            <h2 style={{ fontSize: '2rem' }}>Claim or request your profile</h2>
            <p className="muted">Tell us who you are. We&apos;ll verify your license and send you access, usually within two business days. Mention a plan in the notes if you&apos;d like pricing.</p>
            <SimpleLeadForm kind="claim" submitLabel="Submit for verification" />
          </div>
          <div><h2 style={{ fontSize: '1.9rem' }}>Questions from attorneys</h2><Faqs faqs={FAQS} /></div>
        </div>
      </section>
    </>
  )
}
