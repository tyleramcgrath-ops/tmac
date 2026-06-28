'use client'

import { useMemo, useState } from 'react'

type Severity = 'high' | 'medium' | 'low'

interface Rule {
  pattern: RegExp
  label: string
  severity: Severity
  note: string
}

const RULES: Rule[] = [
  { pattern: /\bunlimited liability\b/i, label: 'Unlimited liability', severity: 'high', note: 'No cap on damages — exposure is uncapped. Negotiate a liability cap.' },
  { pattern: /\bindemnif(y|ication|ies)\b/i, label: 'Indemnification', severity: 'high', note: 'Review scope and carve-outs (esp. IP and gross negligence).' },
  { pattern: /\bauto(?:matically)?[- ]?renew(?:s|al|ing)?\b/i, label: 'Auto-renewal', severity: 'medium', note: 'Confirm notice window to avoid an unwanted renewal term.' },
  { pattern: /\bexclusiv(e|ity)\b/i, label: 'Exclusivity', severity: 'medium', note: 'May restrict the client from working with others — confirm intent.' },
  { pattern: /\bperpetu(al|ity)\b/i, label: 'Perpetual term', severity: 'high', note: 'Obligation never ends — usually should be time-bounded.' },
  { pattern: /\bgovern(?:ed|ing) law\b|\bjurisdiction\b/i, label: 'Governing law / jurisdiction', severity: 'low', note: 'Confirm forum is acceptable to the client.' },
  { pattern: /\bnon[- ]?compete\b/i, label: 'Non-compete', severity: 'high', note: 'Enforceability varies by state — verify reasonableness.' },
  { pattern: /\btermination for convenience\b/i, label: 'Termination for convenience', severity: 'low', note: 'Either party may exit — confirm notice period and wind-down.' },
  { pattern: /\bliquidated damages\b/i, label: 'Liquidated damages', severity: 'medium', note: 'Check the amount is a reasonable estimate, not a penalty.' },
  { pattern: /\bconfidential(ity)?\b/i, label: 'Confidentiality', severity: 'low', note: 'Confirm duration and permitted disclosures.' },
  { pattern: /\bassign(ment|s|ed)?\b/i, label: 'Assignment', severity: 'low', note: 'Check whether consent is required to assign the agreement.' },
  { pattern: /\bwarrant(y|ies)\b/i, label: 'Warranty', severity: 'medium', note: 'Review what is warranted and any disclaimers.' },
]

const SAMPLE = `This Master Services Agreement automatically renews for successive one-year terms unless either party provides notice. Provider shall indemnify Client against all claims. The Provider accepts unlimited liability for any breach. Client grants Provider exclusivity within the territory for a perpetual term. This Agreement is governed by the laws of the State of Delaware. Provider agrees to a non-compete for 24 months following termination.`

const sevColor: Record<Severity, string> = {
  high: 'text-red-300 bg-red-500/10 border-red-500/30',
  medium: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  low: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
}

export function ContractAnalyzer() {
  const [text, setText] = useState(SAMPLE)
  const [analyzed, setAnalyzed] = useState(SAMPLE)

  const findings = useMemo(() => {
    const lines = analyzed.split(/(?<=\.)\s+/)
    const out: { rule: Rule; line: number; excerpt: string }[] = []
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        if (rule.pattern.test(line)) {
          out.push({ rule, line: i + 1, excerpt: line.trim() })
        }
      }
    })
    return out
  }, [analyzed])

  const score = useMemo(() => {
    const weight = { high: 25, medium: 12, low: 4 }
    const raw = findings.reduce((a, f) => a + weight[f.rule.severity], 0)
    return Math.min(100, raw)
  }, [findings])

  return (
    <DemoLayout
      input={
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 p-4 font-mono text-xs leading-relaxed text-slate-200 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            placeholder="Paste a contract or clause…"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setAnalyzed(text)}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Analyze
            </button>
            <button
              onClick={() => {
                setText(SAMPLE)
                setAnalyzed(SAMPLE)
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Reset sample
            </button>
          </div>
        </>
      }
      output={
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Risk profile
            </span>
            <span className="text-xs text-slate-400">
              {findings.length} item{findings.length === 1 ? '' : 's'} flagged
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  score > 60 ? 'bg-red-400' : score > 30 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-semibold text-white">
              {score}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {findings.length === 0 && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                No flagged clauses found in this text.
              </p>
            )}
            {findings.map((f, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${sevColor[f.rule.severity]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{f.rule.label}</span>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {f.rule.severity} · sentence {f.line}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">{f.rule.note}</p>
              </div>
            ))}
          </div>
        </>
      }
    />
  )
}

export function DemoLayout({
  input,
  output,
}: {
  input: React.ReactNode
  output: React.ReactNode
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>{input}</div>
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5">
        {output}
      </div>
    </div>
  )
}
