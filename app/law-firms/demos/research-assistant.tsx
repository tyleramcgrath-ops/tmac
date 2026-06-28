'use client'

import { useState } from 'react'

interface Entry {
  keywords: string[]
  answer: string
  citation: string
}

// A small, grounded "knowledge base". The assistant only answers from this set,
// and explicitly declines otherwise — demonstrating no-hallucination behavior.
const KB: Entry[] = [
  {
    keywords: ['summary judgment', 'standard'],
    answer:
      'Summary judgment is granted when there is no genuine dispute of material fact and the movant is entitled to judgment as a matter of law (Fed. R. Civ. P. 56(a)). The movant bears the initial burden of identifying the basis for the motion.',
    citation: 'Fed. R. Civ. P. 56(a); Celotex Corp. v. Catrett, 477 U.S. 317 (1986)',
  },
  {
    keywords: ['statute of limitations', 'breach of contract', 'limitations'],
    answer:
      'The limitations period for a written contract varies by state — commonly 4 to 6 years from the date of breach. Always confirm the controlling state statute and any tolling provisions.',
    citation: 'See your jurisdiction’s civil limitations statute (e.g., Cal. Civ. Proc. Code § 337)',
  },
  {
    keywords: ['non-compete', 'enforceab', 'noncompete'],
    answer:
      'Enforceability of non-compete agreements is highly state-specific. Many states require the restriction to be reasonable in scope, duration, and geography; some (e.g., California) void most non-competes entirely.',
    citation: 'Cal. Bus. & Prof. Code § 16600; state-specific authority',
  },
  {
    keywords: ['privilege', 'attorney-client', 'waiver'],
    answer:
      'The attorney-client privilege protects confidential communications made for the purpose of obtaining legal advice. It can be waived by voluntary disclosure to third parties, so handle distribution carefully.',
    citation: 'Upjohn Co. v. United States, 449 U.S. 383 (1981)',
  },
  {
    keywords: ['hearsay', 'exception', 'evidence'],
    answer:
      'Hearsay is an out-of-court statement offered for the truth of the matter asserted and is generally inadmissible unless an exception applies (e.g., business records, present sense impression).',
    citation: 'Fed. R. Evid. 801–803',
  },
]

const SUGGESTED = [
  'What is the summary judgment standard?',
  'Are non-competes enforceable?',
  'How does attorney-client privilege get waived?',
  'What is the statute of limitations for breach of contract?',
]

type Msg = { role: 'user' | 'ai'; text: string; citation?: string; declined?: boolean }

function answer(q: string): Msg {
  const lower = q.toLowerCase()
  let best: { entry: Entry; hits: number } | null = null
  for (const entry of KB) {
    const hits = entry.keywords.filter((k) => lower.includes(k)).length
    if (hits > 0 && (!best || hits > best.hits)) best = { entry, hits }
  }
  if (!best) {
    return {
      role: 'ai',
      declined: true,
      text: 'I don’t have a grounded source for that in this demo knowledge base, so I won’t guess. In production this would search your firm’s knowledge base and trusted authorities — and still decline rather than fabricate.',
    }
  }
  return { role: 'ai', text: best.entry.answer, citation: best.entry.citation }
}

export function ResearchAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text: 'Ask a legal research question. I only answer from grounded sources and cite them — and I decline when I don’t have one.',
    },
  ])
  const [input, setInput] = useState('')

  const ask = (q: string) => {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }, answer(q)])
    setInput('')
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5">
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-amber-400 text-slate-950'
                  : m.declined
                    ? 'rounded-bl-sm border border-amber-500/30 bg-amber-500/10 text-amber-100'
                    : 'rounded-bl-sm border border-white/10 bg-white/[0.03] text-slate-200'
              }`}
            >
              {m.text}
              {m.citation && (
                <div className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-300">
                  📎 {m.citation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a research question…"
          className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
