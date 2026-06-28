'use client'

import { useState } from 'react'

const tabs = [
  {
    id: 'review',
    label: 'Document review',
    headline: 'Read 1,000 pages in minutes — with citations.',
    bullets: [
      'Flags key clauses, deadlines, and unusual terms automatically',
      'Every finding links back to the exact source page',
      'Tuned to your firm’s review checklist and risk thresholds',
    ],
    chat: [
      { role: 'user', text: 'Summarize the indemnification risk in this MSA.' },
      {
        role: 'ai',
        text: 'Section 9.2 caps indemnity at fees paid (12 mo). No carve-out for IP infringement — flagged as above your risk threshold. [p. 14]',
      },
    ],
  },
  {
    id: 'research',
    label: 'Legal research',
    headline: 'Answers grounded in your sources, not guesses.',
    bullets: [
      'Searches your knowledge base and trusted authorities',
      'Cites every proposition; declines when unsure',
      'No hallucinated cases — ever',
    ],
    chat: [
      { role: 'user', text: 'Controlling standard for summary judgment in our jurisdiction?' },
      {
        role: 'ai',
        text: 'Rule 56(a): no genuine dispute of material fact. Movant bears initial burden (Celotex). See firm memo “SJ Standards 2024” §2. [internal]',
      },
    ],
  },
  {
    id: 'draft',
    label: 'Drafting',
    headline: 'First drafts from your own precedents.',
    bullets: [
      'Generates letters, memos, and standard agreements',
      'Matches your house style and clause library',
      'Attorney edits and approves — always',
    ],
    chat: [
      { role: 'user', text: 'Draft a demand letter from these intake notes.' },
      {
        role: 'ai',
        text: 'Draft ready using your “Demand — Tier 1” template. Pulled dates and amounts from intake. 3 fields need your review (highlighted).',
      },
    ],
  },
  {
    id: 'intake',
    label: 'Client intake',
    headline: 'Qualified matters, conflict-checked, on arrival.',
    bullets: [
      'Captures matter details and runs a conflicts pre-check',
      'Routes to the right practice group instantly',
      'Starts every file clean and complete',
    ],
    chat: [
      { role: 'user', text: 'New lead: commercial lease dispute, downtown.' },
      {
        role: 'ai',
        text: 'Intake complete. No conflicts found against current client list. Routed to Real Estate · Litigation. Summary sent to intake queue.',
      },
    ],
  },
]

export function Showcase() {
  const [active, setActive] = useState(tabs[0].id)
  const tab = tabs.find((t) => t.id === active)!

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === t.id
                ? 'bg-amber-400 text-slate-950'
                : 'border border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid items-center gap-10 rounded-3xl border border-white/5 bg-slate-900/40 p-8 sm:p-10 lg:grid-cols-2">
        <div>
          <h3 className="font-[Georgia,'Times_New_Roman',serif] text-2xl font-semibold text-white sm:text-3xl">
            {tab.headline}
          </h3>
          <ul className="mt-6 space-y-3">
            {tab.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1 text-amber-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Faux chat preview */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-2 text-xs text-slate-500">FirmAI · secure session</span>
          </div>
          <div className="space-y-3">
            {tab.chat.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-amber-400 text-slate-950'
                      : 'rounded-bl-sm border border-white/10 bg-white/[0.03] text-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
