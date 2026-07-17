'use client'

// Forge chat dock — a persistent AI SEO strategist available anywhere in /app.
// Streams from /api/forge, grounded with a compact snapshot of the live audit.

import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

interface ForgeContext {
  domain: string
  siteScore?: number
  pages?: number
  critical?: number
  warnings?: number
  orphans?: number
  schemaPct?: number
  topIssues?: string[]
}

function buildContext(ctx: ForgeContext): string {
  if (ctx.siteScore == null) return ''
  return [
    `Site: ${ctx.domain || 'unknown'}`,
    `Overall SEO score: ${ctx.siteScore}/100`,
    `Pages crawled: ${ctx.pages}`,
    `Critical issues: ${ctx.critical} · Warnings: ${ctx.warnings}`,
    `Orphan pages: ${ctx.orphans} · Schema coverage: ${ctx.schemaPct}%`,
    ctx.topIssues && ctx.topIssues.length ? `Top issues: ${ctx.topIssues.join('; ')}` : '',
  ].filter(Boolean).join('\n')
}

const QUICK = [
  'What should I fix first?',
  'Explain my biggest issue',
  'Write a title & meta for my homepage',
  'How do I earn more AI citations?',
]

export function ForgeDock(props: ForgeContext) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, open])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/forge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: buildContext(props) }),
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        setMessages((m) => setLast(m, j?.error ?? 'Forge is unavailable right now.'))
        return
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = ''
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setMessages((m) => setLast(m, acc))
      }
      if (!acc) setMessages((m) => setLast(m, 'I could not generate a response. Make sure the AI Gateway is configured.'))
    } catch {
      setMessages((m) => setLast(m, 'Network error reaching Forge.'))
    } finally { setBusy(false) }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="rf-btn-primary fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_-12px_rgba(47,107,255,0.85)]">
          <Bot className="h-4.5 w-4.5" /> Ask Forge
        </button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-40 flex h-[560px] max-h-[85vh] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--rf-card-line-strong)] bg-[rgba(8,12,22,0.96)] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3">
            <span className="flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-violet)] via-[var(--rf-blue)] to-[var(--rf-cyan)]"><Bot className="h-4 w-4 text-white" /></span>
              <span><span className="block text-sm font-semibold text-white">Forge</span><span className="block text-[10px] text-[var(--rf-faint)]">your AI SEO strategist</span></span>
            </span>
            <button onClick={() => setOpen(false)} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center">
                <span className="rf-pulse mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Sparkles className="h-6 w-6" /></span>
                <p className="mt-3 text-sm font-medium text-white">{props.siteScore != null ? `I've reviewed ${props.domain || 'your site'}. Ask me anything.` : 'Run an audit and I can advise on your real site. Meanwhile, ask me anything SEO.'}</p>
                <div className="mt-4 space-y-2">{QUICK.map((q) => <button key={q} onClick={() => send(q)} className="rf-btn-ghost block w-full rounded-lg px-3 py-2 text-left text-xs">{q}</button>)}</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-[var(--rf-blue)]/25 text-white' : 'border border-[var(--rf-card-line)] bg-white/[0.03] text-[var(--rf-text)]'}`}>
                  {m.content || (busy && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin text-[var(--rf-faint)]" /> : '')}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2 border-t border-[var(--rf-card-line)] p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Forge…" className="rf-card flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" />
            <button type="submit" disabled={busy || !input.trim()} className="rf-btn-primary grid h-9 w-9 place-items-center rounded-xl disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </form>
        </div>
      )}
    </>
  )
}

function setLast(m: Msg[], content: string): Msg[] {
  if (m.length === 0) return m
  const copy = m.slice()
  copy[copy.length - 1] = { role: 'assistant', content }
  return copy
}
