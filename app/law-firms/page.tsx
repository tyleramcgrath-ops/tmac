import { ContactForm } from './contact-form'
import { Logo, SiteNav } from './site-nav'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

export default function LawFirmsPage() {
  return (
    <main id="top" className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <BackgroundGlow />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3.5 py-1.5 text-xs font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Built exclusively for law firms
            </span>
            <h1
              className={`${serif} mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl`}
            >
              AI implementations made for the practice of law.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-400">
              We design, build, and deploy secure AI systems that fit how your firm
              actually works — accelerating review, research, and drafting without
              compromising confidentiality or judgment.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#contact"
                className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:w-auto"
              >
                Book a consultation
              </a>
              <a
                href="#services"
                className="w-full rounded-xl border border-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/5 sm:w-auto"
              >
                Explore what we build
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Confidentiality-first · No public model training on your data · SOC 2-aligned partners
            </p>
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

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { stat: '70%', label: 'less time on first-pass document review' },
            { stat: '3×', label: 'faster turnaround on routine drafting' },
            { stat: '100%', label: 'of data kept private to your firm' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center"
            >
              <div className={`${serif} text-5xl font-semibold text-amber-400`}>
                {s.stat}
              </div>
              <p className="mt-3 text-sm text-slate-400">{s.label}</p>
            </div>
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
            {services.map((s) => (
              <article
                key={s.title}
                className="group rounded-2xl border border-white/5 bg-slate-900/40 p-7 transition hover:border-amber-400/30 hover:bg-slate-900/70"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                  {s.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="How it works"
          title="A measured path from pilot to practice-wide"
          subtitle="We move deliberately — proving value on a contained workflow before
          rolling anything out to the wider firm."
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
            <a
              href="#contact"
              className="mt-8 inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Request our security overview
            </a>
          </div>
          <ul className="grid gap-4">
            {security.map((s) => (
              <li
                key={s.title}
                className="flex gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-6"
              >
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
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Logo className="mx-auto h-10 w-10" />
        <blockquote
          className={`${serif} mt-8 text-balance text-2xl font-medium leading-snug text-white sm:text-3xl`}
        >
          &ldquo;They understood privilege and our review standards before they
          wrote a line of code. The pilot paid for itself inside a quarter.&rdquo;
        </blockquote>
        <figcaption className="mt-6 text-sm text-slate-400">
          <span className="font-semibold text-white">Managing Partner</span> ·
          Mid-size litigation firm
          <span className="mt-1 block text-xs text-slate-600">
            Placeholder — replace with a real, approved client reference.
          </span>
        </figcaption>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions firms ask us first"
          />
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
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="relative overflow-hidden">
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

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold text-white">
              Firm<span className="text-amber-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FirmAI. AI implementations for law firms.
            Placeholder brand — rename when ready.
          </p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#services" className="hover:text-white">
              Services
            </a>
            <a href="#security" className="hover:text-white">
              Security
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
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
    <div className={alignment}>
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
    </div>
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

const process = [
  {
    title: 'Assess',
    body: 'We map your workflows and identify where AI saves the most time at the least risk.',
  },
  {
    title: 'Pilot',
    body: 'We build a focused proof of value on one workflow, with your data, in weeks.',
  },
  {
    title: 'Integrate',
    body: 'We connect it to your DMS, email, and practice tools — secured and access-controlled.',
  },
  {
    title: 'Train & scale',
    body: 'We onboard your team, measure outcomes, and expand to the rest of the firm.',
  },
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
