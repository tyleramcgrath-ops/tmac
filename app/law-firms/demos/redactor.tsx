'use client'

import { useState } from 'react'
import { DemoLayout } from './contract-analyzer'

const SAMPLE = `Client: John A. Smith. SSN: 123-45-6789. Contact him at john.smith@example.com or (415) 555-0182. Card on file 4111 1111 1111 1111. DOB 04/12/1979. Mailing address provided separately.`

const PATTERNS: { label: string; re: RegExp }[] = [
  { label: 'SSN', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: 'Credit card', re: /\b(?:\d[ -]?){13,16}\b/g },
  { label: 'Email', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { label: 'Phone', re: /\(?\b\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g },
  { label: 'Date of birth', re: /\b\d{2}\/\d{2}\/\d{4}\b/g },
]

function redact(text: string) {
  let out = text
  const counts: Record<string, number> = {}
  for (const { label, re } of PATTERNS) {
    out = out.replace(re, (m) => {
      // skip if already redacted
      if (/^█+$/.test(m)) return m
      counts[label] = (counts[label] ?? 0) + 1
      return '█'.repeat(Math.max(4, Math.min(m.length, 12)))
    })
  }
  return { out, counts }
}

export function Redactor() {
  const [text, setText] = useState(SAMPLE)
  const [{ out, counts }, setResult] = useState(() => redact(SAMPLE))

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <DemoLayout
      input={
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-200 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            placeholder="Paste text containing sensitive data…"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setResult(redact(text))}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Redact PII
            </button>
            <button
              onClick={() => {
                setText(SAMPLE)
                setResult(redact(SAMPLE))
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Reset sample
            </button>
          </div>
        </>
      }
      output={
        <div className="space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wide text-amber-400">
              Redacted output
            </span>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-xs leading-relaxed text-slate-200">
              {out}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {total} item{total === 1 ? '' : 's'} redacted
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(counts).length === 0 ? (
                <span className="text-xs text-slate-600">No PII detected.</span>
              ) : (
                Object.entries(counts).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"
                  >
                    {k}: {v}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      }
    />
  )
}
