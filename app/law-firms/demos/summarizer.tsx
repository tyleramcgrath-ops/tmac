'use client'

import { useState } from 'react'
import { DemoLayout } from './contract-analyzer'

const SAMPLE = `On March 14, 2026, Acme Corporation entered into a settlement agreement with Globex LLC regarding the breach of a supply contract dated January 3, 2024. Acme agreed to pay $250,000 within 30 days. Globex agreed to release all claims and to deliver the outstanding equipment by April 30, 2026. The parties further agreed that any dispute would be resolved by arbitration in New York. Each party shall bear its own legal fees. The agreement is confidential and may not be disclosed except as required by law.`

const KEY_TERMS = [
  'agree', 'agreed', 'shall', 'must', 'settlement', 'release', 'breach',
  'pay', 'deliver', 'arbitration', 'confidential', 'dispute', 'terminate',
  'indemnif', 'warrant', 'liable', 'obligation',
]

function extract(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  const scored = sentences.map((s) => {
    const lower = s.toLowerCase()
    let score = KEY_TERMS.reduce((a, t) => a + (lower.includes(t) ? 1 : 0), 0)
    if (/\$[\d,]+/.test(s)) score += 2
    if (/\b\d{4}\b|\bJanuary|February|March|April|May|June|July|August|September|October|November|December\b/i.test(s)) score += 1
    return { s: s.trim(), score }
  })
  const keyPoints = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.s)

  const parties = Array.from(
    new Set(
      (text.match(/\b([A-Z][a-zA-Z]+(?: (?:Corporation|Corp|LLC|Inc|LLP|Ltd|Company|Group))?)\b/g) || [])
        .filter((p) => /(Corporation|Corp|LLC|Inc|LLP|Ltd|Company|Group)/.test(p))
    )
  )
  const dates = Array.from(
    new Set(
      text.match(
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g
      ) || []
    )
  )
  const amounts = Array.from(new Set(text.match(/\$[\d,]+(?:\.\d{2})?/g) || []))

  return { keyPoints, parties, dates, amounts }
}

export function Summarizer() {
  const [text, setText] = useState(SAMPLE)
  const [result, setResult] = useState(() => extract(SAMPLE))

  return (
    <DemoLayout
      input={
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-200 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            placeholder="Paste a document, memo, or email…"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setResult(extract(text))}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Summarize
            </button>
            <button
              onClick={() => {
                setText(SAMPLE)
                setResult(extract(SAMPLE))
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Reset sample
            </button>
          </div>
        </>
      }
      output={
        <div className="space-y-5">
          <div>
            <h4 className="text-xs uppercase tracking-wide text-amber-400">
              Key points
            </h4>
            <ul className="mt-2 space-y-2">
              {result.keyPoints.length === 0 && (
                <li className="text-sm text-slate-500">No key points detected.</li>
              )}
              {result.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Chips title="Parties" items={result.parties} />
            <Chips title="Key dates" items={result.dates} />
            <Chips title="Amounts" items={result.amounts} />
          </div>
        </div>
      }
    />
  )
}

function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-slate-600">—</span>
        ) : (
          items.map((it) => (
            <span
              key={it}
              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200"
            >
              {it}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
