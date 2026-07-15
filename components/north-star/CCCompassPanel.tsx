'use client'

import { useState } from 'react'
import { Sparkles, ArrowUp } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'
import { answerFor, SUGGESTED_QUESTIONS, type CompassContext } from '@/lib/north-star-compass'
import { CCOverlayShell } from './CCOverlay'

const CONTEXT_LABEL: Record<Exclude<CompassContext, null>, string> = {
  'command-center': 'the Command Center',
  'digital-dna': 'Digital DNA',
  opportunity: 'this opportunity',
  approval: 'this approval',
}

export function CCCompassPanel({
  scenario,
  context,
  onClose,
}: {
  scenario: PreviewScenario
  context: CompassContext
  onClose: () => void
}) {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([])
  const [pending, setPending] = useState<string | null>(null)

  const ask = (q: string) => {
    const text = q.trim()
    if (!text || pending) return
    setQuestion('')
    setPending(text)
    window.setTimeout(() => {
      setConversation((c) => [...c, { q: text, a: answerFor(text, scenario, context) }])
      setPending(null)
    }, 500)
  }

  const asked = new Set(conversation.map((c) => c.q))
  const remaining = SUGGESTED_QUESTIONS.filter((s) => !asked.has(s))

  return (
    <CCOverlayShell
      title="Ask Compass"
      eyebrow={context ? `Looking at ${CONTEXT_LABEL[context]}` : 'Your business advisor'}
      onClose={onClose}
    >
      {(conversation.length > 0 || pending) && (
        <div className="mb-5 space-y-4 border-b border-[var(--rf-card-line)] pb-5" role="log" aria-label="Conversation with Compass">
          {conversation.map((turn, i) => (
            <div key={i} className="cc-compass-msg">
              <p className="text-sm font-medium text-white">{turn.q}</p>
              <div className="flex items-start gap-2.5 mt-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-blue-bright)]" />
                <p className="text-sm leading-relaxed text-[var(--rf-muted)]">{turn.a}</p>
              </div>
            </div>
          ))}
          {pending && (
            <div className="cc-compass-msg">
              <p className="text-sm font-medium text-white">{pending}</p>
              <div className="flex items-center gap-2.5 mt-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--rf-blue-bright)]" />
                <span className="ns-thinking" role="status" aria-label="Compass is thinking"><span /><span /><span /></span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(question) }} className="cc-compass-input-row">
        <label htmlFor="cc-compass-input" className="sr-only">Ask Compass a question</label>
        <input
          id="cc-compass-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!!pending}
          placeholder="What should I care about today?"
          className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none disabled:opacity-50"
        />
        <button type="submit" disabled={!question.trim() || !!pending} aria-label="Ask Compass" className="ns-touch flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--rf-blue-bright)] text-white disabled:opacity-30">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      {remaining.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {remaining.map((s) => (
            <button key={s} onClick={() => ask(s)} disabled={!!pending} className="cc-compass-suggestion ns-touch disabled:opacity-40">{s}</button>
          ))}
        </div>
      )}
    </CCOverlayShell>
  )
}
