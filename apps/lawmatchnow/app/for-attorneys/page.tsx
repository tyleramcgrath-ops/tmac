import type { Metadata } from 'next'
import Link from 'next/link'
import { CountUp } from '@/components/fx/CountUp'
import { ProfilePreview } from '@/components/fx/ProfilePreview'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { SimpleLeadForm } from '@/components/LeadForm'
import { Breadcrumbs, Faqs, JsonLd } from '@/components/ui'
import { searchAttorneys } from '@/lib/directory'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES, STATES } from '@/lib/geo'
import { SITE, faqLd } from '@/lib/site'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'For Attorneys: Get Found by Clients Who Need You',
  description: 'Claim your free LawMatchNow attorney profile and appear on the city and practice-area pages clients search, built for Google and AI assistants.',
  alternates: { canonical: '/for-attorneys' },
}

// Prices are set by the business; leave null to show "Request pricing".
const PLANS: { name: string; price: string | null; tagline: string; best?: boolean; cta: string }[] = [
  { name: 'Basic', price: 'Free', tagline: 'Be found. Forever free.', cta: 'Claim free profile' },
  { name: 'Gold', price: null, tagline: 'Stand out in your city.', best: true, cta: 'Request Gold pricing' },
  { name: 'Platinum', price: null, tagline: 'Lead your whole state.', cta: 'Request Platinum pricing' },
]

// Feature matrix: [feature, Basic, Gold, Platinum]
const MATRIX: [string, boolean | string, boolean | string, boolean | string][] = [
  ['Verified, editable profile', true, true, true],
  ['Listed on city and practice-area pages', true, true, true],
  ['Messages from potential clients', true, true, true],
  ['“Claimed profile” badge', true, true, true],
  ['Photo, video and website link', false, true, true],
  ['“Featured” placement', false, 'Your city', 'Your whole state'],
  ['Free case review requests in your practice area', false, true, 'Priority'],
  ['Monthly performance report', false, false, true],
]

const VALUE = [
  { icon: '🎯', h: 'Clients with intent', p: 'People arrive with a specific problem in a specific city. They’ve already decided they need a lawyer.' },
  { icon: '🤖', h: 'Built for AI search', p: 'Every page is real HTML with structured data, so Google, ChatGPT, Claude and Perplexity can read and cite it.' },
  { icon: '⚡', h: 'Fast everywhere', p: 'Server-rendered pages that load quickly on any phone, where most people search for a lawyer.' },
  { icon: '🛡️', h: 'Verified badge', p: 'We check your bar number before your profile is marked as claimed, so clients know it’s really you.' },
  { icon: '📚', h: 'Surrounded by trusted content', p: `Your listing sits next to plain-English guides covering ${PRACTICE_AREAS.length} practice areas, reviewed and dated.` },
  { icon: '🤝', h: 'Fair and ethical', p: 'Paid placements are always labeled. We never take a share of your legal fees.' },
]

const FAQS = [
  { q: 'Is a basic listing really free?', a: 'Yes. Any attorney in good standing can claim and maintain a basic profile at no cost, and it stays free.' },
  { q: 'How do you verify attorneys?', a: 'We check your bar number against your state bar’s public records before a profile is marked as claimed. We may also confirm by email or phone.' },
  { q: 'How long does it take to go live?', a: 'Most profiles are verified within two business days of your request. Once verified, your updates appear on the site right away.' },
  { q: 'Is a featured listing attorney advertising?', a: 'Yes. Paid placements are labeled “Featured” wherever they appear. You remain responsible for complying with your state’s rules on lawyer advertising.' },
  { q: 'Do you take a fee from my cases?', a: 'No. We never share in legal fees. Featured plans are flat subscriptions.' },
]

const Cell = ({ v }: { v: boolean | string }) =>
  v === true ? <span className="yes" aria-label="Included">✓</span> : v === false ? <span className="no" aria-label="Not included">–</span> : <span className="txt">{v}</span>

export default async function ForAttorneys() {
  const { total } = await searchAttorneys({ perPage: 1 })
  const cityOpts = [...CITIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.slug, label: c.name, state: c.state }))
  const practiceOpts = PRACTICE_AREAS.filter((p) => p.guide).map((p) => ({ value: p.slug, label: p.name, title: p.lawyerTitle }))
  const host = SITE.url.replace(/^https?:\/\//, '')
  const pages = CITIES.length * PRACTICE_AREAS.length + CITIES.length + STATES.length + PRACTICE_AREAS.length

  return (
    <>
      <RevealOnScroll />
      <JsonLd data={faqLd(FAQS)} />
      <section className="hero hero-x firm-hero">
        <div className="hero-orbs" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap">
          <div className="firm-hero-grid">
            <div className="rise">
              <Breadcrumbs crumbs={[{ name: 'For Attorneys', path: '/for-attorneys' }]} />
              <div className="eyebrow" style={{ marginTop: 22 }}>For law firms &amp; attorneys</div>
              <h1>Your next client is searching <em>right now.</em></h1>
              <p className="lede">
                Show up on the pages people read when they need a lawyer in your practice area and city. Claim your profile free in minutes, and upgrade when you want to stand out.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a className="btn btn-primary" href="#claim">Claim your free profile</a>
                <a className="btn btn-ghost" href="#preview">See your listing live</a>
              </div>
              <ul className="hero-ticks">
                <li>Free forever plan</li><li>Verified in ~2 business days</li><li>No fee-sharing, ever</li>
              </ul>
            </div>
            <div className="firm-hero-stats rise">
              <div className="glass-card stat-glass"><b><CountUp to={pages} suffix="+" /></b><span>city, state &amp; practice pages you can appear on</span></div>
              <div className="glass-card stat-glass"><b><CountUp to={PRACTICE_AREAS.length} /></b><span>practice areas</span></div>
              <div className="glass-card stat-glass"><b><CountUp to={STATES.length} /></b><span>states + D.C.</span></div>
              {total > 0 && <div className="glass-card stat-glass"><b><CountUp to={total} /></b><span>listings already on the directory</span></div>}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="preview">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">01 · See it before you sign up</div>
              <h2>Build your listing. <em>Watch it go live.</em></h2>
            </div>
            <p>Type your details and see exactly where you&apos;d appear: your city&apos;s practice page and the snippet people see in Google.</p>
          </div>
          <div className="reveal"><ProfilePreview cities={cityOpts} practices={practiceOpts} siteHost={host} /></div>
        </div>
      </section>

      <section className="section dark">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">02 · Why firms choose us</div>
              <h2>Built for how clients find lawyers <em>now.</em></h2>
            </div>
            <p className="muted">Search is changing fast: more people ask an AI assistant before they ever click a link. Our pages are built to be read by both.</p>
          </div>
          <div className="value-grid">
            {VALUE.map((v, i) => (
              <div key={v.h} className="value reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <span className="value-icon" aria-hidden="true">{v.icon}</span>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">03 · Three steps</div>
              <h2>Live in days, <em>not weeks.</em></h2>
            </div>
          </div>
          <div className="steps light reveal">
            <div className="step"><h3>Claim</h3><p>Tell us your name, bar number and firm. Two minutes, no card needed.</p></div>
            <div className="step"><h3>Verify</h3><p>We confirm your license with your state bar, usually within two business days.</p></div>
            <div className="step"><h3>Get found</h3><p>Your profile appears on your city and practice-area pages. Upgrade any time to feature it.</p></div>
          </div>
        </div>
      </section>

      <section className="section alt" id="plans">
        <div className="wrap">
          <div className="section-head reveal">
            <div><div className="eyebrow">04 · Plans</div><h2>Start free. <em>Upgrade when it pays.</em></h2></div>
            <p>Flat plans and never a share of your fees. Ask us for pricing in your market.</p>
          </div>
          <div className="plans reveal">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan${p.best ? ' best' : ''}`}>
                {p.best && <span className="plan-flag">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="price">{p.price ?? 'Pricing by market'}</p>
                <p className="plan-tag">{p.tagline}</p>
                <ul>{MATRIX.filter((m) => m[PLANS.indexOf(p) + 1] !== false).slice(0, 5).map((m) => <li key={m[0]}>{m[0]}{typeof m[PLANS.indexOf(p) + 1] === 'string' ? `: ${m[PLANS.indexOf(p) + 1]}` : ''}</li>)}</ul>
                <a className={`btn ${p.best ? 'btn-primary' : 'btn-ghost'}`} href="#claim">{p.cta}</a>
              </div>
            ))}
          </div>
          <div className="matrix-wrap reveal">
            <table className="matrix">
              <caption className="sr-only">Plan comparison</caption>
              <thead><tr><th scope="col">Compare plans</th>{PLANS.map((p) => <th key={p.name} scope="col" className={p.best ? 'best' : ''}>{p.name}</th>)}</tr></thead>
              <tbody>
                {MATRIX.map(([f, ...vals]) => (
                  <tr key={f}><th scope="row">{f}</th>{vals.map((v, i) => <td key={i} className={PLANS[i].best ? 'best' : ''}><Cell v={v} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="content-proof reveal">
            <div>
              <div className="eyebrow">05 · The neighborhood</div>
              <h2>Your profile, next to content clients <em>trust.</em></h2>
              <p className="muted">Clients read before they call. Every practice area has a reviewed guide with costs, questions to ask and FAQs, linking straight to attorneys like you.</p>
              <p><Link className="link-arrow" href="/guides">Browse the legal library</Link></p>
            </div>
            <ul className="proof-list">
              {GUIDES.slice(0, 5).map((g) => <li key={g.slug}><Link href={`/guide/${g.slug}`}>{g.title}</Link><span>{g.readMinutes} min</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section alt" id="claim">
        <div className="wrap layout">
          <div className="card claim-card reveal">
            <div className="eyebrow">Claim your profile</div>
            <h2 style={{ fontSize: '2.2rem' }}>Two minutes. Free. <em>No card.</em></h2>
            <p className="muted">Tell us who you are. We&apos;ll verify your license and send you access, usually within two business days. Mention Gold or Platinum in the notes for pricing.</p>
            <SimpleLeadForm kind="claim" submitLabel="Claim my free profile" />
          </div>
          <div className="reveal"><h2 style={{ fontSize: '1.9rem' }}>Questions from attorneys</h2><Faqs faqs={FAQS} schema={false} /></div>
        </div>
      </section>

      <a href="#claim" className="sticky-claim">Claim your free profile →</a>
    </>
  )
}
