'use client'

import { useState } from 'react'

// Sample existing client / adverse-party roster the conflict check runs against.
const ROSTER = [
  'Acme Corporation',
  'Globex LLC',
  'Initech Inc',
  'Umbrella Group',
  'Wayne Enterprises',
  'Stark Industries',
]

const ROUTING: Record<string, string> = {
  litigation: 'Litigation',
  contract: 'Corporate / Commercial',
  realestate: 'Real Estate',
  employment: 'Employment & Labor',
  ip: 'Intellectual Property',
  estate: 'Trusts & Estates',
}

type Result = {
  conflict: string[]
  practice: string
  summary: string
} | null

export function IntakeConflict() {
  const [client, setClient] = useState('')
  const [adverse, setAdverse] = useState('')
  const [matter, setMatter] = useState('litigation')
  const [desc, setDesc] = useState('')
  const [result, setResult] = useState<Result>(null)

  const submit = () => {
    const names = [client, adverse].map((s) => s.trim().toLowerCase()).filter(Boolean)
    const conflict = ROSTER.filter((r) =>
      names.some((n) => n && r.toLowerCase().includes(n))
    )
    setResult({
      conflict,
      practice: ROUTING[matter] ?? 'General',
      summary: `${client || 'New client'} v. ${adverse || 'N/A'} — ${
        ROUTING[matter] ?? 'General'
      } matter.${desc ? ' ' + desc.trim() : ''}`,
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <Input label="Prospective client" value={client} onChange={setClient} placeholder="e.g. Hooli Inc" />
        <Input label="Opposing party" value={adverse} onChange={setAdverse} placeholder="e.g. Globex LLC" />
        <label className="block">
          <span className="mb-1.5 block text-xs text-slate-400">Matter type</span>
          <select
            value={matter}
            onChange={(e) => setMatter(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
          >
            <option value="litigation">Litigation / dispute</option>
            <option value="contract">Contract / commercial</option>
            <option value="realestate">Real estate</option>
            <option value="employment">Employment</option>
            <option value="ip">Intellectual property</option>
            <option value="estate">Estate planning</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-slate-400">Brief description</span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Short matter summary…"
            className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
          />
        </label>
        <button
          onClick={submit}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          Run intake &amp; conflict check
        </button>
        <p className="text-xs text-slate-600">
          Try “Globex” or “Acme” as the opposing party to trigger a conflict.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5">
        {!result ? (
          <p className="text-sm text-slate-500">
            Submit the form to see the conflict check and routing.
          </p>
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-lg border p-3 ${
                result.conflict.length
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-emerald-500/30 bg-emerald-500/10'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {result.conflict.length ? (
                  <span className="text-red-300">⚠ Potential conflict found</span>
                ) : (
                  <span className="text-emerald-300">✓ No conflicts detected</span>
                )}
              </div>
              {result.conflict.length > 0 && (
                <p className="mt-1.5 text-xs text-red-200">
                  Matches on existing roster: {result.conflict.join(', ')}. Escalate to
                  the conflicts committee before opening the matter.
                </p>
              )}
            </div>

            <Field label="Routed to practice group" value={result.practice} />
            <Field label="Auto-generated matter summary" value={result.summary} />
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
              Status: {result.conflict.length ? 'On hold — conflicts review' : 'Ready to open file'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
      />
    </label>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <p className="mt-1 text-sm text-slate-200">{value}</p>
    </div>
  )
}
