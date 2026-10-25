import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, Quote } from 'lucide-react'
import { SiteFooter, SiteNav } from './_components/site-chrome'
import { Reveal } from './_components/primitives'
import { ScanTeaser } from './_components/scan-teaser'
import { CASE_STUDIES, CLIENT_LOGOS, PROCESS, SERVICES, TESTIMONIALS } from './_lib/seed'

export default function ContactLanding() {
  const [hero, ...rest] = CASE_STUDIES

  return (
    <>
      <a href="#main" className="ctc-skip">
        Skip to content
      </a>
      <SiteNav />

      <main id="main">
        {/* ---------------------------------------------------------- HERO */}
        <section className="ctc-hero ctc-grain">
          <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="ctc-hero-inner">
              <Reveal delay={0}>
                <span className="ctc-eyebrow ctc-eyebrow-ember">
                  Google · AI Overviews · ChatGPT
                </span>
              </Reveal>

              <Reveal delay={90}>
                <h1 className="ctc-display">
                  The search agency
                  <br />
                  built for{' '}
                  <span className="ctc-serif-italic" style={{ color: 'var(--ember)' }}>
                    what&rsquo;s next.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={180}>
                <p className="ctc-lead ctc-hero-lead">
                  Search changed. So did we. Your buyers now ask a model instead of typing a query —
                  and it answers with somebody&rsquo;s brand. We make sure it is yours, everywhere
                  the searching happens.
                </p>
              </Reveal>

              <Reveal delay={260}>
                <div className="ctc-row ctc-g3 ctc-wrapflex">
                  <Link href="#book" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                    Let&rsquo;s talk
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/contact/app" className="ctc-btn ctc-btn-quiet ctc-btn-lg">
                    Scan your brand free
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={340}>
                <dl className="ctc-hero-stats">
                  {[
                    { value: '$7.5M+', label: 'Client revenue generated' },
                    { value: '24M+', label: 'Views produced' },
                    { value: '1,470+', label: '#1 rankings held' },
                  ].map((stat) => (
                    <div key={stat.label} className="ctc-hero-stat">
                      <dt className="ctc-eyebrow">{stat.label}</dt>
                      <dd className="ctc-stat" style={{ fontSize: 'var(--t-xl)', margin: 0 }}>
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- LOGO RAIL */}
        <section aria-label="Clients" className="ctc-marquee-wrap">
          <div className="ctc-wrap">
            <span className="ctc-eyebrow" style={{ display: 'block', marginBottom: 'var(--s-3)' }}>
              Trusted by
            </span>
          </div>
          <div className="ctc-marquee">
            <div className="ctc-marquee-track">
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((name, index) => (
                <span key={`${name}-${index}`} className="ctc-marquee-item" aria-hidden={index >= CLIENT_LOGOS.length}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- RESULTS */}
        <section id="results" className="ctc-section" aria-labelledby="results-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-section-head">
                <span className="ctc-eyebrow">Our work</span>
                <h2 id="results-title" className="ctc-h2">
                  The results speak first.
                </h2>
                <p className="ctc-lead" style={{ maxWidth: '46ch' }}>
                  Every number below is a client outcome, not an impression count we rounded up.
                </p>
              </div>
            </Reveal>

            {/* Hero case study gets the weight; the rest support it. */}
            <Reveal delay={80}>
              <article className="ctc-case ctc-case-hero">
                <div className="ctc-stack ctc-g3 ctc-grow">
                  <span className="ctc-eyebrow ctc-eyebrow-ember">{hero.client}</span>
                  <span className="ctc-case-figure">{hero.headline.value}</span>
                  <span className="ctc-lead" style={{ fontSize: 'var(--t-md)' }}>
                    {hero.headline.label}
                  </span>
                  <div className="ctc-row ctc-g2 ctc-wrapflex" style={{ marginTop: 'var(--s-2)' }}>
                    {hero.services.map((service) => (
                      <span key={service} className="ctc-chip">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ctc-case-support">
                  {hero.support.map((item) => (
                    <div key={item.label} className="ctc-stack ctc-g1">
                      <span className="ctc-stat" style={{ fontSize: 'var(--t-xl)' }}>
                        {item.value}
                      </span>
                      <span className="ctc-eyebrow">{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>

            <div className="ctc-case-grid">
              {rest.map((study, index) => (
                <Reveal key={study.client} delay={index * 60}>
                  <article className={`ctc-case ${study.size === 'wide' ? 'ctc-case-wide' : ''}`}>
                    <div className="ctc-between ctc-g3" style={{ alignItems: 'flex-start' }}>
                      <span className="ctc-eyebrow">{study.client}</span>
                      <ArrowUpRight size={15} aria-hidden="true" className="ctc-case-arrow" />
                    </div>
                    <div className="ctc-stack ctc-g1" style={{ marginTop: 'var(--s-4)' }}>
                      <span className="ctc-stat">{study.headline.value}</span>
                      <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
                        {study.headline.label}
                      </span>
                    </div>
                    <div className="ctc-case-row">
                      {study.support.map((item) => (
                        <div key={item.label} className="ctc-stack" style={{ gap: 1 }}>
                          <span className="ctc-num" style={{ fontSize: 'var(--t-base)' }}>
                            {item.value}
                          </span>
                          <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- SERVICES */}
        <section id="services" className="ctc-section" aria-labelledby="services-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-section-head">
                <span className="ctc-eyebrow">SEO services</span>
                <h2 id="services-title" className="ctc-h2">
                  How we grow brands in search.
                </h2>
              </div>
            </Reveal>

            <ol className="ctc-services">
              {SERVICES.map((service, index) => (
                <Reveal as="li" key={service.name} delay={index * 50} className="ctc-service">
                  <span className="ctc-num ctc-service-num">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="ctc-service-name">{service.name}</h3>
                  <p className="ctc-muted ctc-service-body">{service.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ----------------------------------------------------- THE TOOL */}
        <section id="tool" className="ctc-section ctc-tool-band" aria-labelledby="tool-title">
          <div className="ctc-wrap">
            <div className="ctc-tool-grid">
              <Reveal>
                <div className="ctc-stack ctc-g4">
                  <span className="ctc-eyebrow ctc-eyebrow-ember">Free tool</span>
                  <h2 id="tool-title" className="ctc-h2" style={{ maxWidth: '16ch' }}>
                    See how your brand ranks across LLMs.
                  </h2>
                  <p className="ctc-lead" style={{ maxWidth: '46ch' }}>
                    We write the questions your buyers actually ask, put them to the model cold, and
                    show you who it recommends instead of you. No guessing — real answers, generated
                    while you watch.
                  </p>
                  <ul className="ctc-ticks">
                    {[
                      'Six buyer questions, written for your category',
                      'Every answer read back for placement and framing',
                      'Share of voice against the brands beating you',
                      'A prioritised plan for closing the gap',
                    ].map((line) => (
                      <li key={line}>
                        <Check size={14} aria-hidden="true" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <div className="ctc-row ctc-g3 ctc-wrapflex" style={{ marginTop: 'var(--s-2)' }}>
                    <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                      Try it yourself
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <Link href="/contact/compare" className="ctc-btn ctc-btn-quiet ctc-btn-lg">
                      Compare the alternatives
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <ScanTeaser />
              </Reveal>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- PROCESS */}
        <section id="process" className="ctc-section" aria-labelledby="process-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-section-head">
                <span className="ctc-eyebrow">Process</span>
                <h2 id="process-title" className="ctc-h2">
                  Tech-enabled, so working together is easy.
                </h2>
              </div>
            </Reveal>

            <div className="ctc-process">
              {PROCESS.map((step, index) => (
                <Reveal key={step.title} delay={index * 70}>
                  <div className="ctc-process-card">
                    <span className="ctc-num ctc-process-num">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="ctc-h3" style={{ fontSize: 'var(--t-lg)' }}>
                      {step.title}
                    </h3>
                    <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- TESTIMONIALS */}
        <section id="testimonials" className="ctc-section" aria-labelledby="testimonials-title">
          <div className="ctc-wrap">
            <Reveal>
              <div className="ctc-section-head">
                <span className="ctc-eyebrow">Testimonials</span>
                <h2 id="testimonials-title" className="ctc-h2">
                  Top brands like working with us.
                </h2>
              </div>
            </Reveal>

            <div className="ctc-quotes">
              {TESTIMONIALS.map((testimonial, index) => (
                <Reveal key={testimonial.name} delay={index * 60}>
                  <figure className="ctc-quote-card">
                    <Quote size={16} aria-hidden="true" style={{ color: 'var(--ember)' }} />
                    <blockquote>
                      <p className="ctc-quote-text">{testimonial.quote}</p>
                    </blockquote>
                    <figcaption className="ctc-stack" style={{ gap: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{testimonial.name}</span>
                      <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
                        {testimonial.role}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA */}
        <section id="book" className="ctc-section ctc-invert ctc-grain" aria-labelledby="book-title">
          <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="ctc-book">
              <div className="ctc-stack ctc-g4">
                <span className="ctc-eyebrow">Let&rsquo;s talk</span>
                <h2 id="book-title" className="ctc-h2" style={{ maxWidth: '15ch' }}>
                  Grow your sales with &ldquo;new&rdquo; SEO.
                </h2>
                <p className="ctc-lead" style={{ maxWidth: '42ch' }}>
                  Book a call and we will walk you through the roadmap to more organic traffic and
                  revenue — in Google and in the models.
                </p>
                <div className="ctc-row ctc-g3 ctc-wrapflex">
                  <Link href="/contact/signup" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                    Book a call
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/contact/app" className="ctc-btn ctc-btn-solid ctc-btn-lg">
                    Scan my brand first
                  </Link>
                </div>
              </div>

              <ol className="ctc-steps">
                {[
                  {
                    title: 'Book a call',
                    body: 'We discuss your brand and goals, then recommend the right growth plan.',
                  },
                  {
                    title: 'SEO & content strategy',
                    body: 'We build the custom strategy for your category and your buyers.',
                  },
                  {
                    title: 'Production',
                    body: 'Technical fixes ship, content publishes, and we optimise for algorithms and LLMs.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="ctc-step">
                    <span className="ctc-num ctc-step-num">{index + 1}</span>
                    <div className="ctc-stack ctc-g1">
                      <span style={{ fontWeight: 600 }}>{step.title}</span>
                      <span style={{ fontSize: 'var(--t-sm)', color: '#5f574c' }}>{step.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
