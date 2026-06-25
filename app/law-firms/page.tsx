import { ContactForm } from './contact-form'
import { Pricing } from './pricing'
import { Counter, Reveal } from './reveal'
import { RoiCalculator } from './roi-calculator'
import { ScrollUi } from './scroll-ui'
import { Showcase } from './showcase'
import { Logo, SiteNav } from './site-nav'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

export default function LawFirmsPage() {
  return (
    <main id="top" className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <ScrollUi />

      {/* Announcement bar */}
      <div className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-slate-950 sm:text-sm">
        New: our 2026 guide to safe AI adoption for law firms —{' '}
        <a href="#resources" className="underline underline-offset-2">
          read it free
        </a>
      </div>

      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <BackgroundGlow />
        <GridPattern />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3.5 py-1.5 text-xs font-medium text-amber-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                Built exclusively for law firms
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1
                className={`${serif} mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl`}
              >
                AI implementations made for the practice of law.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-400">
                We design, build, and deploy secure AI systems that fit how your
                firm actually works — accelerating review, research, and drafting
                without compromising confidentiality or judgment.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 sm:w-auto"
                >
                  Book a consultation
                </a>
                <a
                  href="/law-firms/demos"
                  className="w-full rounded-xl border border-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/5 sm:w-auto"
                >
                  Try the live demos
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-6 text-xs text-slate-500">
                Confidentiality-first · No public model training on your data ·
                SOC 2-aligned partners
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">
            Practice areas we support
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
            {[
              'Litigation',
              'Corporate / M&A',
              'Real Estate',
              'Employment',
              'IP & Patent',
              'Estate Planning',
              'Compliance',
            ].map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats (animated) */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { node: <Counter to={70} suffix="%" />, label: 'less time on first-pass document review' },
            { node: <Counter to={3} suffix="×" />, label: 'faster turnaround on routine drafting' },
            { node: <Counter to={100} suffix="%" />, label: 'of data kept private to your firm' },
          ].map((s, i) => (
            <Reveal as="div" delay={i * 100} key={s.label}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                <div className={`${serif} text-5xl font-semibold text-amber-400`}>
                  {s.node}
                </div>
                <p className="mt-3 text-sm text-slate-400">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          Illustrative outcomes from comparable engagements. Results vary by matter
          type and workflow.
        </p>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="What we build"
            title="AI systems for every corner of the firm"
            subtitle="We don't sell generic chatbots. Each engagement is scoped to your
            matters, your documents, and your standards of care."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal as="article" delay={(i % 3) * 80} key={s.title}>
                <article className="group h-full rounded-2xl border border-white/5 bg-slate-900/40 p-7 transition hover:-translate-y-1 hover:border-amber-400/30 hover:bg-slate-900/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition group-hover:bg-amber-400/20">
                    {s.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section id="showcase" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Product"
          title="See what your team would actually use"
          subtitle="Every output is cited, reviewable, and grounded in your firm’s own
          knowledge. Explore a few of the workflows we deliver."
        />
        <div className="mt-14">
          <Showcase />
        </div>
        <div className="mt-10 text-center">
          <a
            href="/law-firms/demos"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Try the interactive demos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading
            eyebrow="Why specialized"
            title="A generic AI tool isn’t built for legal"
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="p-5 font-medium text-slate-400">Capability</th>
                  <th className="p-5 font-medium text-slate-400">Off-the-shelf AI</th>
                  <th className="p-5 font-semibold text-amber-400">FirmAI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparison.map((row) => (
                  <tr key={row.label}>
                    <td className="p-5 text-slate-200">{row.label}</td>
                    <td className="p-5 text-slate-500">{row.generic}</td>
                    <td className="p-5 text-white">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-amber-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                        {row.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI calculator */}
      <section id="roi" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="ROI calculator"
          title="Estimate what AI could give back to your firm"
          subtitle="Move the sliders to see the hours and billable value your team
          could reclaim from routine work."
        />
        <div className="mt-12 rounded-3xl border border-white/5 bg-slate-900/30 p-8 sm:p-10">
          <RoiCalculator />
        </div>
      </section>

      {/* Process */}
      <section id="process" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="How it works"
            title="A measured path from pilot to practice-wide"
            subtitle="We move deliberately — proving value on a contained workflow
            before rolling anything out to the wider firm."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <div key={p.title} className="bg-slate-950 p-7">
                <div className={`${serif} text-3xl font-semibold text-amber-400/40`}>
                  0{i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Integrations"
          title="Works inside the tools your firm already runs on"
          subtitle="We meet your team where they are — in their document management
          system, inbox, and practice platform."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {integrations.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-6 text-sm font-medium text-slate-300 transition hover:border-amber-400/20 hover:text-white"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400/60" />
              {name}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Don’t see yours? We build custom integrations on request.
        </p>
      </section>

      {/* Security */}
      <section id="security" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Security & ethics"
              title="Confidentiality is the requirement, not a feature"
              subtitle="Everything we deploy is built around the duties you already owe
              your clients — privilege, competence, and supervision."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {['SOC 2-aligned', 'Encrypted in transit & at rest', 'Private deployment', 'Full audit logs'].map(
                (b) => (
                  <span
                    key={b}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {b}
                  </span>
                )
              )}
            </div>
            <a
              href="#contact"
              className="mt-8 inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Request our security overview
            </a>
          </div>
          <ul className="grid gap-4">
            {security.map((s, i) => (
              <Reveal as="li" delay={i * 80} key={s.title}>
                <li className="flex gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                    {s.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {s.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Trusted by firms"
          title="What managing partners tell us"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="article" delay={i * 100} key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-7">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="m12 2 3 6.9 7.6.6-5.8 4.9 1.8 7.4L12 18l-6.4 3.8 1.8-7.4L1.6 9.5 9.2 9z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="block text-xs text-slate-500">{t.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          Placeholder references — replace with real, approved client quotes.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple engagements, scoped to your firm"
            subtitle="Start with a contained pilot and expand as the value proves out.
            No long lock-ins to get going."
          />
          <div className="mt-14">
            <Pricing />
          </div>
        </div>
      </section>

      {/* Resources */}
      <section id="resources" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Insights"
          title="Resources for AI-curious firms"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {resources.map((r, i) => (
            <Reveal as="article" delay={i * 90} key={r.title}>
              <a
                href="#contact"
                className="group flex h-full flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-7 transition hover:-translate-y-1 hover:border-amber-400/30"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  {r.tag}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">{r.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {r.body}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400">
                  Read more
                  <svg className="transition group-hover:translate-x-1" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <SectionHeading eyebrow="FAQ" title="Questions firms ask us first" />
          <div className="mt-12 divide-y divide-white/5 border-y border-white/5">
            {faq.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-white">
                  {f.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-amber-400 transition group-open:rotate-45">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="relative overflow-hidden border-t border-white/5">
        <BackgroundGlow />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Get started"
              title="Book a confidential consultation"
              subtitle="Tell us where your team loses the most hours. We'll come back
              with a focused, no-obligation plan for a first AI pilot."
            />
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              {[
                'A 30-minute call with a senior engineer, not a salesperson',
                'A written assessment of 1–2 high-impact workflows',
                'Clear scope, timeline, and pricing before any commitment',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 text-amber-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-7 sm:p-9">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
          <h3 className={`${serif} text-2xl font-semibold text-white`}>
            Stay ahead of legal AI
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            One concise email a month on practical, ethical AI for law firms. No spam.
          </p>
          <form
            className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            action="#"
          >
            <input
              type="email"
              required
              placeholder="you@firm.com"
              aria-label="Email address"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-sm font-semibold text-white">
                  Firm<span className="text-amber-400">AI</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Secure AI implementations built exclusively for law firms.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} FirmAI. Placeholder brand — rename when ready.
            </p>
            <p className="text-xs text-slate-600">
              Not a law firm and does not provide legal advice.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ---------- Small presentational helpers ---------- */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
}) {
  const alignment =
    align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl text-left'
  return (
    <Reveal className={alignment}>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
        {eyebrow}
      </span>
      <h2
        className={`${serif} mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-400">
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_70%)]" />
    </div>
  )
}

function GridPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }}
    />
  )
}

/* ---------- Content ---------- */

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const services = [
  {
    title: 'Document & contract review',
    body: 'Surface key clauses, anomalies, and risk across thousands of pages — with citations back to the source so attorneys stay in control.',
    icon: (
      <Icon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </Icon>
    ),
  },
  {
    title: 'Private legal research',
    body: 'A research assistant grounded in your firm’s knowledge base and trusted sources — answers with authority, not hallucination.',
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </Icon>
    ),
  },
  {
    title: 'Drafting & automation',
    body: 'Generate first drafts of routine correspondence, memos, and standard agreements from your own templates and prior work product.',
    icon: (
      <Icon>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </Icon>
    ),
  },
  {
    title: 'Client intake automation',
    body: 'Qualify leads, collect matter details, and route conflicts checks automatically — so your team starts with a clean, complete file.',
    icon: (
      <Icon>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </Icon>
    ),
  },
  {
    title: 'E-discovery & review support',
    body: 'Accelerate early case assessment and privilege review with models tuned to your protocols, fully auditable end to end.',
    icon: (
      <Icon>
        <path d="M3 3h18v4H3zM3 10h18v11H3z" />
        <path d="M7 14h10M7 18h6" />
      </Icon>
    ),
  },
  {
    title: 'Custom firm copilots',
    body: 'A secure assistant trained on your precedents and playbooks, available to every attorney and paralegal — inside the tools they already use.',
    icon: (
      <Icon>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M12 7V3M8 21v-4M16 21v-4" />
        <circle cx="9" cy="16" r="1" />
        <circle cx="15" cy="16" r="1" />
      </Icon>
    ),
  },
]

const comparison = [
  { label: 'Trained on your precedents', generic: 'Generic web data', us: 'Your firm’s knowledge' },
  { label: 'Citations to source', generic: 'Often missing', us: 'Every answer' },
  { label: 'Client data privacy', generic: 'May train shared models', us: 'Never trains public models' },
  { label: 'Privilege & conflict awareness', generic: 'None', us: 'Built in' },
  { label: 'DMS / practice-tool integration', generic: 'Limited', us: 'First-class' },
  { label: 'Support', generic: 'Help center', us: 'Dedicated engineers' },
]

const process = [
  { title: 'Assess', body: 'We map your workflows and identify where AI saves the most time at the least risk.' },
  { title: 'Pilot', body: 'We build a focused proof of value on one workflow, with your data, in weeks.' },
  { title: 'Integrate', body: 'We connect it to your DMS, email, and practice tools — secured and access-controlled.' },
  { title: 'Train & scale', body: 'We onboard your team, measure outcomes, and expand to the rest of the firm.' },
]

const integrations = [
  'iManage',
  'NetDocuments',
  'Clio',
  'Microsoft 365',
  'SharePoint',
  'Google Workspace',
  'Relativity',
  'Outlook',
]

const security = [
  {
    title: 'Your data stays yours',
    body: 'Client data is never used to train public models. Private deployment and data-isolation options available.',
    icon: (
      <Icon>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </Icon>
    ),
  },
  {
    title: 'Privilege-aware by design',
    body: 'Access controls, retention rules, and audit logs mapped to your confidentiality obligations.',
    icon: (
      <Icon>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </Icon>
    ),
  },
  {
    title: 'Human in the loop',
    body: 'Outputs are cited and reviewable. Attorneys always make the final call — competence and supervision built in.',
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
      </Icon>
    ),
  },
  {
    title: 'Built on trusted infrastructure',
    body: 'We deploy on SOC 2-aligned, enterprise-grade platforms with encryption in transit and at rest.',
    icon: (
      <Icon>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </Icon>
    ),
  },
]

const testimonials = [
  {
    quote: 'They understood privilege and our review standards before they wrote a line of code. The pilot paid for itself inside a quarter.',
    name: 'Managing Partner',
    role: 'Mid-size litigation firm',
  },
  {
    quote: 'Our associates get their evenings back. First-pass review that took a day now takes an hour — and everything is cited.',
    name: 'Director of Practice Innovation',
    role: 'Corporate / M&A practice',
  },
  {
    quote: 'The fact that nothing trains a public model was non-negotiable for us. They built around it from day one.',
    name: 'General Counsel',
    role: 'Regional full-service firm',
  },
]

const resources = [
  {
    tag: 'Guide',
    title: 'Safe AI adoption for law firms in 2026',
    body: 'A practical framework for evaluating, piloting, and governing AI without compromising your duties.',
  },
  {
    tag: 'Checklist',
    title: 'Vendor due-diligence for legal AI',
    body: 'The questions to ask any AI vendor about data handling, privilege, and model training.',
  },
  {
    tag: 'Case note',
    title: 'Cutting review time by 70%',
    body: 'How a litigation team restructured first-pass review around a cited, auditable AI workflow.',
  },
]

const faq = [
  {
    q: 'Do you only work with law firms?',
    a: 'Yes. We focus exclusively on legal practices, which means our tooling, security posture, and workflows are tuned to the realities of legal work rather than retrofitted from a generic product.',
  },
  {
    q: 'Will our client data be used to train AI models?',
    a: 'No. Your data is never used to train public or shared models. Depending on your requirements, we can deploy in isolated or private environments so your information never leaves your control.',
  },
  {
    q: 'How long does a first pilot take?',
    a: 'Most initial pilots run a few weeks from kickoff to a working proof of value on a single, well-scoped workflow. We deliberately start small so you can evaluate results before committing further.',
  },
  {
    q: 'Does AI replace our attorneys?',
    a: 'No. Everything we build keeps a human in the loop. AI handles the repetitive first pass; your attorneys review, exercise judgment, and remain fully responsible for the work product.',
  },
  {
    q: 'Can it integrate with our existing systems?',
    a: 'Typically yes — we integrate with common document management systems, email, and practice management tools so AI works inside the software your team already uses.',
  },
]

const footerCols = [
  {
    title: 'Product',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Live demos', href: '/law-firms/demos' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Security', href: '#security' },
      { label: 'Resources', href: '#resources' },
      { label: 'ROI calculator', href: '#roi' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Book a consultation', href: '#contact' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
]
