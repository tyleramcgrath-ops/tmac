'use client'

import { useState } from 'react'
import { Compass, ArrowUp, Sparkles } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'

const SUGGESTED = [
  'What should I focus on this week?',
  'Should I advertise right now?',
  'Do I need social media?',
  'Why are customers not calling?',
  'What changed since last week?',
  'What should I ignore?',
  'What is the easiest opportunity today?',
]

function answerFor(question: string, scenario: PreviewScenario): string {
  const q = question.toLowerCase()
  const opp = scenario.opportunity

  if (q.includes('focus this week') || q.includes('focus')) {
    if (opp) {
      return `Honestly? ${opp.headline} That's the one thing worth fixing this week — everything else can wait. Want me to walk you through it, or would you rather I prepare a draft for your review?`
    }
    return "Nothing urgent this week. Your business looks steady. I'd use the extra time on your team or your best customers rather than anything marketing-related."
  }

  if (q.includes('advertise')) {
    return "I don't have enough evidence yet about what's driving your customers today — no advertising accounts are connected. Before spending anything, I'd fix the contact-page issue I found. No point paying to send more people to a page they can't easily contact you from."
  }

  if (q.includes('social media')) {
    return "Not urgently. I haven't found evidence that social media is where your customers are coming from yet. I'd rather get your website's basics solid first, then revisit this once I understand your customers better."
  }

  if (q.includes('customers not calling') || q.includes('not calling')) {
    if (opp) {
      return `Here's what I found: your homepage and two other pages don't show a phone number before someone scrolls. If people can't find it fast, some of them give up. That's the most likely reason — I can't measure exactly how many calls this costs you, but it's an easy fix.`
    }
    return "I don't have evidence pointing to a specific cause right now. I'll keep watching your contact pages and let you know if something turns up."
  }

  if (q.includes('changed since') || q.includes('what changed')) {
    if (scenario.id === 'no-changes') return "Nothing important. Your site looks the same as your last check — no new issues, nothing to react to."
    if (scenario.id === 'check-failed') return "I couldn't check today — your site didn't respond. I'm using your last successful check from a few days ago and I'll try again automatically."
    if (scenario.id === 'waiting-approval') return "I found a mismatch between your website's holiday hours and your Google Business Profile, and prepared a fix. It's waiting for your approval above."
    return `Since your last check: ${opp ? opp.evidenceSummary : 'nothing material.'}`
  }

  if (q.includes('ignore')) {
    return "Ignore anything about rankings, keywords, or technical scores for now — none of that matters until your contact info is easy to find. Fix the fundamentals first."
  }

  if (q.includes('easiest opportunity')) {
    if (opp) return `${opp.guideSteps[0]?.title ?? opp.headline} — it takes about ${opp.guideSteps[0]?.timeEstimate ?? 'a few minutes'} and needs no technical skill.`
    return "Nothing stands out as urgent right now — that's a good sign."
  }

  return "I don't have enough evidence yet to answer that specifically. Here's what I'd focus on instead: " + (opp ? opp.headline : 'keeping an eye on your next check — nothing urgent today.')
}

export function AskCompass({ scenario }: { scenario: PreviewScenario }) {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([])
  const [pending, setPending] = useState<string | null>(null)

  const ask = (q: string) => {
    const text = q.trim()
    if (!text || pending) return
    setQuestion('')
    setPending(text)
    window.setTimeout(() => {
      setConversation((c) => [...c, { q: text, a: answerFor(text, scenario) }])
      setPending(null)
    }, 550)
  }

  const asked = new Set(conversation.map((c) => c.q))
  const remainingSuggestions = SUGGESTED.filter((s) => !asked.has(s))

  return (
    <section aria-labelledby="ask-compass-heading" className="ns-panel ns-fade-in p-5 sm:p-7">
      <div className="flex items-center gap-2.5">
        <Compass className="h-4 w-4 text-[var(--rf-violet)]" aria-hidden="true" />
        <h2 id="ask-compass-heading" className="text-lg font-semibold text-white">Ask Compass</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">Your business advisor, on call — ask in plain English.</p>

      {(conversation.length > 0 || pending) && (
        <div className="mt-5 space-y-4 border-b border-[var(--rf-card-line)] pb-5" role="log" aria-label="Conversation with Compass">
          {conversation.map((turn, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-white">{turn.q}</p>
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-blue-bright)]" />
                <p className="text-sm leading-relaxed text-[var(--rf-muted)]">{turn.a}</p>
              </div>
            </div>
          ))}
          {pending && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">{pending}</p>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--rf-blue-bright)]" />
                <span className="ns-thinking" role="status" aria-label="Compass is thinking">
                  <span /><span /><span />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(question)
        }}
        className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--rf-card-line)] bg-white/[0.015] p-2 pl-3.5 focus-within:border-[var(--rf-blue-bright)]/50"
      >
        <label htmlFor="ask-compass-input" className="sr-only">Ask Compass a question about your business</label>
        <input
          id="ask-compass-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!!pending}
          placeholder="What should I focus on this week?"
          className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!question.trim() || !!pending}
          aria-label="Ask Compass"
          className="ns-touch ns-lift flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--rf-blue-bright)] text-white disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {remainingSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={!!pending}
              className="ns-touch ns-lift rounded-full border border-[var(--rf-card-line)] px-3 py-1.5 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-card-line-strong)] hover:text-white disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
