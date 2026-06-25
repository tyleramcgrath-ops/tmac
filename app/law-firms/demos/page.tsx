import Link from 'next/link'
import { Reveal } from '../reveal'
import { ScrollUi } from '../scroll-ui'
import { Logo } from '../site-nav'
import { ContractAnalyzer } from './contract-analyzer'
import { IntakeConflict } from './intake-conflict'
import { Redactor } from './redactor'
import { ResearchAssistant } from './research-assistant'
import { Summarizer } from './summarizer'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <ScrollUi />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/law-firms" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-base font-semibold tracking-tight text-white">
              Firm<span className="text-amber-400">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/law-firms"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              ← Back to site
            </Link>
            <Link
              href="/law-firms#contact"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Book a consultation
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3.5 py-1.5 text-xs font-medium text-amber-300">
            Interactive · runs in your browser
          </span>
          <h1 className={`${serif} mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Tools &amp; AI implementations for your firm
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            These are working, hands-on demos of the systems we implement —
            try each one below. Every implementation is explained in plain English:
            what it does, how it works, what it needs from you, and how we keep it
            secure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
            {implementations.map((im) => (
              <a
                key={im.id}
                href={`#${im.id}`}
                className="rounded-full border border-white/10 px-3.5 py-1.5 text-slate-300 transition hover:bg-white/5"
              >
                {im.short}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-slate-500">
            Demos use lightweight in-browser logic for illustration. Production
            systems use secure, firm-tuned models — and never train public models
            on your data.
          </p>
        </div>
      </section>

      {/* Implementations */}
      <div className="mx-auto max-w-5xl px-6">
        {implementations.map((im, idx) => (
          <section key={im.id} id={im.id} className="scroll-mt-24 border-b border-white/5 py-20">
            <Reveal>
              <div className="flex items-start gap-4">
                <span className={`${serif} text-3xl font-semibold text-amber-400/40`}>
                  0{idx + 1}
                </span>
                <div>
                  <h2 className={`${serif} text-2xl font-semibold text-white sm:text-3xl`}>
                    {im.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-slate-400">{im.tagline}</p>
                </div>
              </div>
            </Reveal>

            {/* Explanation */}
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Detail title="What it does" items={im.does} />
              <Detail title="How it works" items={im.how} />
              <Detail title="What we need from your firm" items={im.needs} />
              <Detail title="Security & guardrails" items={im.security} accent />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm">
              <Meta label="Impact" value={im.impact} />
              <Meta label="Typical rollout" value={im.rollout} />
              <Meta label="Best for" value={im.bestFor} />
            </div>

            {/* Live demo */}
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                  Try it — {im.short}
                </h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                {im.demo}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Roadmap */}
      <section className="border-b border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className={`${serif} text-2xl font-semibold text-white sm:text-3xl`}>
            What an implementation roadmap looks like
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            We don’t deploy everything at once. We sequence implementations by impact
            and risk, proving value before expanding.
          </p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((r, i) => (
              <div key={r.phase} className="bg-slate-950 p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  {r.phase}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.body}</p>
                <span className="mt-3 inline-block text-xs text-slate-500">{r.when}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Logo className="mx-auto h-10 w-10" />
        <h2 className={`${serif} mt-6 text-3xl font-semibold text-white`}>
          Want these built for your firm?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          We’ll scope a first pilot on the workflow where you’ll feel it fastest —
          tuned to your documents, your standards, and your security requirements.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/law-firms#contact"
            className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:w-auto"
          >
            Book a consultation
          </Link>
          <Link
            href="/law-firms#pricing"
            className="w-full rounded-xl border border-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/5 sm:w-auto"
          >
            See pricing
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold text-white">
              Firm<span className="text-amber-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Demos for illustration · Not legal advice · Placeholder brand
          </p>
        </div>
      </footer>
    </main>
  )
}

function Detail({
  title,
  items,
  accent = false,
}: {
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-white/5 bg-slate-900/40'
      }`}
    >
      <h4 className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-amber-400' : 'text-slate-300'}`}>
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-slate-400">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent ? 'bg-amber-400' : 'bg-slate-500'}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}: </span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  )
}

const implementations = [
  {
    id: 'contract-review',
    short: 'Contract review',
    title: 'Contract & document review',
    tagline:
      'Read long agreements in minutes, with every risk flagged and traced back to the source.',
    does: [
      'Scans contracts for risky or unusual clauses',
      'Assigns a severity and a plain-English explanation to each',
      'Produces an overall risk score for fast triage',
    ],
    how: [
      'A model tuned to your review checklist reads the document',
      'Findings link back to the exact clause, so attorneys verify quickly',
      'Thresholds and clause library are configured to your standards',
    ],
    needs: [
      'A sample of past contracts and your review checklist',
      'Your risk thresholds (what’s “high” vs “low” for you)',
    ],
    security: [
      'Documents never leave your secured environment',
      'No training of public models on your contracts',
      'Full audit trail of every analysis',
    ],
    impact: '~70% faster first-pass review',
    rollout: '4–6 weeks',
    bestFor: 'Corporate, M&A, real estate',
    demo: <ContractAnalyzer />,
  },
  {
    id: 'summarization',
    short: 'Summarization',
    title: 'Document summarization & extraction',
    tagline:
      'Turn dense documents into structured briefs — parties, dates, amounts, and key obligations.',
    does: [
      'Extracts the key points from long documents',
      'Pulls out parties, key dates, and monetary amounts',
      'Creates a consistent, skimmable summary',
    ],
    how: [
      'The system identifies salient sentences and named entities',
      'Output is structured into a repeatable brief format',
      'Tunable to the fields your matters care about',
    ],
    needs: [
      'Examples of the documents you summarize most',
      'Your preferred summary format / fields',
    ],
    security: [
      'Runs against your private data store only',
      'Outputs are reviewable and editable before use',
    ],
    impact: 'Hours saved per matter',
    rollout: '3–4 weeks',
    bestFor: 'Litigation, due diligence',
    demo: <Summarizer />,
  },
  {
    id: 'research',
    short: 'Legal research',
    title: 'Grounded legal research assistant',
    tagline:
      'Answers grounded in your knowledge base and trusted sources — with citations, and it declines when unsure.',
    does: [
      'Answers research questions from approved sources',
      'Cites every answer back to authority',
      'Declines rather than fabricating when it lacks a source',
    ],
    how: [
      'Retrieval over your knowledge base and trusted libraries',
      'The model only answers from retrieved, cited material',
      'Guardrails prevent confident-but-wrong “hallucinations”',
    ],
    needs: [
      'Access to your internal memos, briefs, and precedents',
      'Which external sources you consider authoritative',
    ],
    security: [
      'Source-grounded: no invented cases or citations',
      'Respects access controls — users only see what they should',
    ],
    impact: 'Faster, safer research',
    rollout: '4–8 weeks',
    bestFor: 'All practice areas',
    demo: <ResearchAssistant />,
  },
  {
    id: 'intake',
    short: 'Intake & conflicts',
    title: 'Client intake & conflict checks',
    tagline:
      'Qualify matters, run a conflicts pre-check, and route to the right group — automatically.',
    does: [
      'Captures structured matter details from intake',
      'Runs a conflicts pre-check against your roster',
      'Routes the matter to the right practice group',
    ],
    how: [
      'Intake data is normalized and checked against client/adverse lists',
      'Potential conflicts are surfaced for the conflicts committee',
      'A clean, complete matter summary is generated automatically',
    ],
    needs: [
      'Your current client and adverse-party lists',
      'Your routing rules by matter type',
    ],
    security: [
      'Conflict data stays inside your systems',
      'Human review required before opening any flagged matter',
    ],
    impact: 'Cleaner files, fewer missed conflicts',
    rollout: '3–5 weeks',
    bestFor: 'Firm-wide operations',
    demo: <IntakeConflict />,
  },
  {
    id: 'redaction',
    short: 'PII redaction',
    title: 'PII detection & redaction',
    tagline:
      'Automatically find and redact sensitive data before documents are shared or produced.',
    does: [
      'Detects SSNs, card numbers, emails, phones, and dates of birth',
      'Redacts them consistently across a document',
      'Reports exactly what was redacted and how much',
    ],
    how: [
      'Pattern and model-based detection of sensitive entities',
      'Configurable to the data types your matters handle',
      'Outputs a redaction log for your records',
    ],
    needs: [
      'The categories of sensitive data you must protect',
      'Your redaction and retention policies',
    ],
    security: [
      'Processing stays within your environment',
      'Designed to support — not replace — attorney review',
    ],
    impact: 'Lower disclosure risk',
    rollout: '2–4 weeks',
    bestFor: 'E-discovery, productions',
    demo: <Redactor />,
  },
]

const roadmap = [
  { phase: 'Phase 0', title: 'Discovery', body: 'Map workflows and pick the highest-impact, lowest-risk starting point.', when: 'Week 1' },
  { phase: 'Phase 1', title: 'Pilot', body: 'Build and prove one implementation on your data, in a secured environment.', when: 'Weeks 2–6' },
  { phase: 'Phase 2', title: 'Integrate', body: 'Connect to your DMS, email, and practice tools with access controls.', when: 'Weeks 6–10' },
  { phase: 'Phase 3', title: 'Scale', body: 'Roll out to more teams and add implementations as value is proven.', when: 'Ongoing' },
]
