import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Clock3,
  Feather,
  History,
  Radar,
  Sparkles,
  Users,
} from 'lucide-react'
import { SiteFooter, SiteNav } from './_components/site-chrome'
import { BriefPreview } from './_components/brief-preview'
import { Reveal } from './_components/primitives'

export default function ContactLanding() {
  return (
    <>
      <a href="#main" className="ctc-skip">
        Skip to content
      </a>
      <SiteNav />

      <main id="main">
        {/* ---------------------------------------------------------- HERO */}
        <section className="ctc-hero ctc-grain">
          <div className="ctc-wrap">
            <div className="ctc-hero-grid">
              <div className="ctc-stack ctc-g5">
                <Reveal delay={0}>
                  <span className="ctc-eyebrow">
                    Relationship intelligence · Powered by Claude
                  </span>
                </Reveal>

                <Reveal delay={90}>
                  <h1 className="ctc-display">
                    You already know
                    <br />
                    <span
                      className="ctc-serif-italic"
                      style={{ color: 'var(--ember)', marginRight: '0.14em' }}
                    >
                      everyone
                    </span>
                    you need.
                  </h1>
                </Reveal>

                <Reveal delay={180}>
                  <p className="ctc-lead" style={{ maxWidth: '46ch' }}>
                    Contact holds every person you have met — the context, the promises, the
                    half-forgotten details — and each week tells you exactly who to reach out to,
                    why now, and what to say.
                  </p>
                </Reveal>

                <Reveal delay={260}>
                  <div className="ctc-row ctc-g3 ctc-wrapflex">
                    <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                      Open the workspace
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <Link href="/contact/signup" className="ctc-btn ctc-btn-quiet ctc-btn-lg">
                      Create an account
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={340}>
                  <div className="ctc-row ctc-g4 ctc-wrapflex" style={{ marginTop: 'var(--s-2)' }}>
                    <Stat value="24" label="people seeded" />
                    <Divider />
                    <Stat value="1" label="brief per week" />
                    <Divider />
                    <Stat value="0" label="cold outreach" />
                  </div>
                </Reveal>
              </div>

              <Reveal delay={200} className="ctc-hero-visual">
                <BriefPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- CREDIBILITY */}
        <section aria-label="Who uses Contact" style={{ paddingBlock: 'var(--s-5)' }}>
          <div className="ctc-wrap">
            <div
              className="ctc-row ctc-g5 ctc-wrapflex"
              style={{
                justifyContent: 'space-between',
                borderTop: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                paddingBlock: 'var(--s-4)',
              }}
            >
              <span className="ctc-eyebrow">Built for people who trade in relationships</span>
              <div className="ctc-row ctc-g5 ctc-wrapflex">
                {['Founders', 'Investors', 'Recruiters', 'Sellers', 'Operators'].map((role) => (
                  <span
                    key={role}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--t-md)',
                      color: 'var(--ink-faint)',
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ PROBLEM */}
        <section className="ctc-section" aria-labelledby="problem-title">
          <div className="ctc-wrap">
            <div className="ctc-two-col">
              <Reveal>
                <div className="ctc-stack ctc-g4" style={{ maxWidth: '30ch' }}>
                  <span className="ctc-eyebrow ctc-eyebrow-ember">The quiet problem</span>
                  <h2 id="problem-title" className="ctc-h2">
                    A network does not fail loudly.
                  </h2>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="ctc-stack ctc-g5" style={{ maxWidth: '52ch' }}>
                  <p className="ctc-lead">
                    It fades. The investor who asked for a quarterly update. The engineer who said
                    <span className="ctc-serif-italic"> ask me again in a year</span>. The customer
                    whose budget unfroze in July. Nothing goes wrong — you simply stop being the
                    person who remembered.
                  </p>
                  <p className="ctc-lead">
                    A CRM will not save you here. CRMs record what already happened. Contact reads
                    the record and tells you what to do about it on Monday morning.
                  </p>

                  <div className="ctc-decay-card ctc-card">
                    <div className="ctc-between" style={{ marginBottom: 'var(--s-3)' }}>
                      <span className="ctc-eyebrow">Warmth over time, untouched</span>
                      <span className="ctc-chip ctc-chip-rust ctc-chip-mono">−64%</span>
                    </div>
                    <DecayChart />
                    <div className="ctc-between" style={{ marginTop: 'var(--s-2)' }}>
                      {['Met', '3 mo', '6 mo', '9 mo', '1 yr'].map((t) => (
                        <span key={t} className="ctc-num ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- HOW IT WORKS */}
        <section id="how" className="ctc-section" aria-labelledby="how-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-stack ctc-g3" style={{ marginBottom: 'var(--s-7)', maxWidth: '34ch' }}>
                <span className="ctc-eyebrow">How it works</span>
                <h2 id="how-title" className="ctc-h2">
                  Three steps, once a week.
                </h2>
              </div>
            </Reveal>

            <ol className="ctc-steps">
              {[
                {
                  n: '01',
                  icon: Users,
                  title: 'Bring your people',
                  body: 'Start with the 24 already in your workspace, or add your own — the name, how you know them, and the detail you would otherwise forget.',
                },
                {
                  n: '02',
                  icon: Feather,
                  title: 'Say what you are doing',
                  body: 'Hiring a designer. Warming a room before a raise. Reviving what stalled in spring. Or nothing at all, and let it find who is slipping away.',
                },
                {
                  n: '03',
                  icon: Sparkles,
                  title: 'Get the brief',
                  body: 'A ranked shortlist with a reason for each name, the channel to use, and an opening line worth sending — written from your own notes.',
                },
              ].map((step, i) => (
                <Reveal as="li" key={step.n} delay={i * 110} className="ctc-step">
                  <span className="ctc-num ctc-step-num">{step.n}</span>
                  <step.icon size={20} className="ctc-step-icon" aria-hidden="true" />
                  <h3 className="ctc-h3" style={{ fontSize: 'var(--t-lg)' }}>
                    {step.title}
                  </h3>
                  <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.6 }}>
                    {step.body}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------- CRAFT */}
        <section id="craft" className="ctc-section ctc-ink-band ctc-on-ink" aria-labelledby="craft-title">
          <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="ctc-two-col">
              <Reveal>
                <div className="ctc-stack ctc-g4">
                  <span className="ctc-eyebrow">The brief</span>
                  <h2 id="craft-title" className="ctc-h2" style={{ maxWidth: '18ch' }}>
                    It reads the note you wrote and forgot.
                  </h2>
                  <p className="ctc-lead" style={{ maxWidth: '44ch' }}>
                    Every pick is argued. Contact cites the specific line in your own record that
                    makes this the moment — the offer never taken up, the vest date in November,
                    the freeze that lifted. Then it drafts the message and gets out of the way.
                  </p>
                  <div className="ctc-row ctc-g3 ctc-wrapflex" style={{ marginTop: 'var(--s-2)' }}>
                    <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                      Run a real brief
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <ul className="ctc-stack ctc-g3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[
                    {
                      icon: Radar,
                      title: 'Warmth, scored honestly',
                      body: 'Recency weighted by closeness. Seven bars, one number, no vanity metrics.',
                    },
                    {
                      icon: Clock3,
                      title: 'Timing over volume',
                      body: 'Five names, not fifty. The ones where there is an honest reason to write today.',
                    },
                    {
                      icon: Feather,
                      title: 'Drafts in your voice',
                      body: 'Four tones, five channels, streamed as it writes. No placeholders, ever.',
                    },
                    {
                      icon: History,
                      title: 'Memory that compounds',
                      body: 'Send a note and the record updates. Next week the brief already knows.',
                    },
                  ].map((item) => (
                    <li key={item.title} className="ctc-ink-row">
                      <item.icon size={18} aria-hidden="true" style={{ color: 'var(--ember-bright)', flex: 'none' }} />
                      <div className="ctc-stack" style={{ gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--t-base)' }}>{item.title}</span>
                        <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>{item.body}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- QUOTE */}
        <section className="ctc-section" aria-label="Customer quote">
          <div className="ctc-wrap">
            <Reveal>
              <figure className="ctc-quote">
                <blockquote>
                  <p className="ctc-quote-text">
                    I did not need more contacts. I needed to be told that Kwame said{' '}
                    <span className="ctc-serif-italic">ask me again in a year</span> — and that the
                    year was up.
                  </p>
                </blockquote>
                <figcaption className="ctc-row ctc-g3" style={{ marginTop: 'var(--s-5)' }}>
                  <span className="ctc-avatar">RA</span>
                  <span className="ctc-stack" style={{ gap: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Rosa Almeida</span>
                    <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
                      Founder, Tessellate · illustrative
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------------------ PRICING */}
        <section id="pricing" className="ctc-section" aria-labelledby="pricing-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-stack ctc-g3" style={{ marginBottom: 'var(--s-6)', maxWidth: '36ch' }}>
                <span className="ctc-eyebrow">Pricing</span>
                <h2 id="pricing-title" className="ctc-h2">
                  Cheaper than the intro you missed.
                </h2>
              </div>
            </Reveal>

            <div className="ctc-pricing">
              {[
                {
                  name: 'Personal',
                  price: '£0',
                  cadence: 'forever',
                  blurb: 'Your own network, one brief a week.',
                  features: ['Up to 150 people', 'Weekly brief', 'Message drafts', 'Local-first storage'],
                  cta: 'Start free',
                  featured: false,
                },
                {
                  name: 'Operator',
                  price: '£14',
                  cadence: 'per month',
                  blurb: 'For people whose job is other people.',
                  features: [
                    'Unlimited people',
                    'Briefs on demand',
                    'All four tones, five channels',
                    'Intent presets & history',
                    'Nudges before things cool',
                  ],
                  cta: 'Start 14-day trial',
                  featured: true,
                },
                {
                  name: 'Studio',
                  price: '£39',
                  cadence: 'per seat / month',
                  blurb: 'Shared memory for a small team.',
                  features: ['Everything in Operator', 'Shared network', 'Who-knows-who routing', 'Team digest'],
                  cta: 'Talk to us',
                  featured: false,
                },
              ].map((tier, i) => (
                <Reveal key={tier.name} delay={i * 100}>
                  <div className={`ctc-price-card ${tier.featured ? 'ctc-price-card-featured' : ''}`}>
                    {tier.featured ? (
                      <span className="ctc-chip ctc-chip-ember ctc-chip-mono ctc-price-flag">
                        Most chosen
                      </span>
                    ) : null}
                    <span className="ctc-eyebrow">{tier.name}</span>
                    <div className="ctc-row ctc-g2" style={{ alignItems: 'baseline', marginTop: 'var(--s-2)' }}>
                      <span
                        className="ctc-num"
                        style={{ fontSize: 'var(--t-2xl)', letterSpacing: '-0.04em' }}
                      >
                        {tier.price}
                      </span>
                      <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
                        {tier.cadence}
                      </span>
                    </div>
                    <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)' }}>
                      {tier.blurb}
                    </p>
                    <ul className="ctc-stack ctc-g2 ctc-price-list">
                      {tier.features.map((f) => (
                        <li key={f} className="ctc-row ctc-g2" style={{ alignItems: 'flex-start' }}>
                          <Check
                            size={14}
                            aria-hidden="true"
                            style={{ color: 'var(--moss)', flex: 'none', marginTop: 3 }}
                          />
                          <span style={{ fontSize: 'var(--t-sm)' }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact/signup"
                      className={`ctc-btn ${tier.featured ? 'ctc-btn-ember' : 'ctc-btn-quiet'}`}
                      style={{ width: '100%', marginTop: 'var(--s-5)' }}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- FAQ */}
        <section id="faq" className="ctc-section" aria-labelledby="faq-title">
          <div className="ctc-wrap">
            <div className="ctc-two-col">
              <Reveal>
                <div className="ctc-stack ctc-g3" style={{ maxWidth: '24ch' }}>
                  <span className="ctc-eyebrow">Questions</span>
                  <h2 id="faq-title" className="ctc-h2">
                    The honest answers.
                  </h2>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div className="ctc-stack" style={{ maxWidth: '58ch' }}>
                  {[
                    {
                      q: 'Is the brief actually generated?',
                      a: 'Yes. Your network and your intent go to Claude on every run, and the ranking, the reasoning and the drafts all come back from the model. Nothing on the brief screen is canned.',
                    },
                    {
                      q: 'Where does my network live?',
                      a: 'On your device. This build keeps people, briefs and drafts in local storage — the only thing that leaves the browser is the payload for a brief or a draft.',
                    },
                    {
                      q: 'Will it write things I would never say?',
                      a: 'It is instructed against the usual crimes — no "hope this finds you well", no exclamation marks, no bracketed placeholders. You still read every draft before it goes. Nothing sends itself.',
                    },
                    {
                      q: 'What if I have no goal this week?',
                      a: 'Leave the intent empty. The brief switches to decay mode and surfaces the relationships you are quietly losing.',
                    },
                  ].map((item) => (
                    <details key={item.q} className="ctc-faq">
                      <summary>
                        <span>{item.q}</span>
                        <span className="ctc-faq-mark" aria-hidden="true" />
                      </summary>
                      <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.65 }}>
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- CTA */}
        <section className="ctc-ink-band ctc-on-ink ctc-grain" style={{ paddingBlock: 'var(--s-9)' }}>
          <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="ctc-stack ctc-g5" style={{ alignItems: 'center', textAlign: 'center' }}>
              <Reveal>
                <h2 className="ctc-h2" style={{ maxWidth: '20ch' }}>
                  Somebody is waiting to hear from you.
                </h2>
              </Reveal>
              <Reveal delay={90}>
                <p className="ctc-lead" style={{ maxWidth: '44ch' }}>
                  Open the workspace. It is already full of people.
                </p>
              </Reveal>
              <Reveal delay={160}>
                <div className="ctc-row ctc-g3 ctc-wrapflex" style={{ justifyContent: 'center' }}>
                  <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                    Open the workspace
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/contact/signup" className="ctc-btn ctc-btn-lg">
                    Create an account
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="ctc-stack" style={{ gap: 0 }}>
      <span className="ctc-num" style={{ fontSize: 'var(--t-lg)', letterSpacing: '-0.03em' }}>
        {value}
      </span>
      <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </span>
  )
}

function Divider() {
  return <span aria-hidden="true" style={{ width: 1, height: 26, background: 'var(--line)' }} />
}

/** Relationship decay, drawn rather than described. */
function DecayChart() {
  const points = [96, 78, 58, 44, 34]
  const width = 100
  const step = width / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${100 - p}`)
    .join(' ')
  const area = `${path} L ${width} 100 L 0 100 Z`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 96 }} aria-hidden="true">
      <defs>
        <linearGradient id="ctc-decay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--line)" strokeWidth="0.4" />
      ))}
      <path d={area} fill="url(#ctc-decay)" />
      <path
        d={path}
        fill="none"
        stroke="var(--ember)"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={i * step} cy={100 - p} r="1.4" fill="var(--paper-raised)" stroke="var(--ember)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
