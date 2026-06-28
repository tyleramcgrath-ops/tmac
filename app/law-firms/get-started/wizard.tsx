'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

/* ----------------------------- Types & data ----------------------------- */

type CmsType =
  | 'wordpress'
  | 'webflow'
  | 'squarespace'
  | 'wix'
  | 'shopify'
  | 'custom'

interface WizardData {
  name: string
  email: string
  firm: string
  website: string
  cms: CmsType | null
  cmsSiteUrl: string
  cmsUser: string
  cmsAppPassword: string
  tools: Record<string, boolean>
}

interface Tool {
  id: string
  name: string
  desc: string
  recommended?: boolean
}

const TOOLS: Tool[] = [
  {
    id: 'chatbot',
    name: 'AI site assistant (chatbot)',
    desc: 'A chat widget trained on your site that answers visitor questions and books consultations.',
    recommended: true,
  },
  {
    id: 'ai-readability',
    name: 'AI readability (llms.txt + crawler access)',
    desc: 'Publishes an llms.txt and opens safe access so AI assistants can find and cite your firm.',
    recommended: true,
  },
  {
    id: 'schema',
    name: 'Structured data / schema markup',
    desc: 'Adds JSON-LD (LegalService, FAQ, Attorney) so search and AI understand your pages.',
    recommended: true,
  },
  {
    id: 'search',
    name: 'Semantic site search',
    desc: 'Natural-language search across your practice areas, attorneys, and resources.',
  },
  {
    id: 'intake',
    name: 'AI intake & lead capture',
    desc: 'Qualifies visitors, collects matter details, and routes them to the right group.',
    recommended: true,
  },
  {
    id: 'content',
    name: 'AI-optimized FAQ & meta',
    desc: 'Generates answer-ready FAQ content and meta descriptions for each practice area.',
  },
]

const CMS_OPTIONS: { id: CmsType; label: string; note: string }[] = [
  { id: 'wordpress', label: 'WordPress', note: 'Application Password' },
  { id: 'webflow', label: 'Webflow', note: 'API token' },
  { id: 'squarespace', label: 'Squarespace', note: 'API key' },
  { id: 'wix', label: 'Wix', note: 'OAuth' },
  { id: 'shopify', label: 'Shopify', note: 'Admin API' },
  { id: 'custom', label: 'Custom / HTML', note: 'Snippet embed' },
]

const STEPS = ['Account', 'Your site', 'Connect CMS', 'Choose tools', 'Launch']

/* ------------------------------- Component ------------------------------ */

export function Wizard() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    name: '',
    email: '',
    firm: '',
    website: '',
    cms: null,
    cmsSiteUrl: '',
    cmsUser: '',
    cmsAppPassword: '',
    tools: { chatbot: true, 'ai-readability': true, schema: true, intake: true },
  })

  const set = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }))
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="mx-auto max-w-3xl">
      <Steps step={step} />

      <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-9">
        {step === 0 && <AccountStep data={data} set={set} onNext={next} />}
        {step === 1 && <WebsiteStep data={data} set={set} onNext={next} onBack={back} />}
        {step === 2 && <CmsStep data={data} set={set} onNext={next} onBack={back} />}
        {step === 3 && <ToolsStep data={data} set={set} onNext={next} onBack={back} />}
        {step === 4 && <LaunchStep data={data} onBack={back} />}
      </div>
    </div>
  )
}

/* -------------------------------- Steps UI ------------------------------ */

function Steps({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                active
                  ? 'bg-amber-400 text-slate-950'
                  : done
                    ? 'bg-amber-400/20 text-amber-300'
                    : 'border border-white/10 text-slate-500'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:block ${
                active ? 'text-white' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h2 className={`${serif} text-2xl font-semibold text-white`}>{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{sub}</p>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-600">{hint}</span>}
    </label>
  )
}

function NavRow({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
        </button>
      )}
    </div>
  )
}

/* ------------------------------ Step 1: Account ------------------------- */

function AccountStep({
  data,
  set,
  onNext,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  onNext: () => void
}) {
  const valid = data.name && /\S+@\S+\.\S+/.test(data.email) && data.firm
  return (
    <div>
      <StepHeader title="Create your account" sub="Start free — no card required." />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className={inputClass}
              value={data.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Jane Counsel"
              autoComplete="name"
            />
          </Field>
          <Field label="Work email">
            <input
              className={inputClass}
              value={data.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="jane@firm.com"
              type="email"
              autoComplete="email"
            />
          </Field>
        </div>
        <Field label="Firm name">
          <input
            className={inputClass}
            value={data.firm}
            onChange={(e) => set({ firm: e.target.value })}
            placeholder="Firm &amp; Partners LLP"
          />
        </Field>
      </div>
      <NavRow onNext={onNext} nextDisabled={!valid} nextLabel="Create account" />
      <p className="mt-4 text-center text-xs text-slate-600">
        Already have an account?{' '}
        <Link href="/law-firms" className="text-amber-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

/* ------------------------------ Step 2: Website ------------------------- */

type Check = { label: string; status: 'pass' | 'warn' | 'fail'; note: string }

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function scanSite(url: string): { score: number; checks: Check[] } {
  const seed = hashString(url || 'x')
  const pick = (i: number): Check['status'] => {
    const v = (seed >> (i * 2)) % 3
    return v === 0 ? 'fail' : v === 1 ? 'warn' : 'pass'
  }
  const checks: Check[] = [
    { label: 'llms.txt for AI assistants', status: pick(0), note: 'Lets AI tools discover and cite your firm.' },
    { label: 'Structured data (schema.org)', status: pick(1), note: 'LegalService / FAQ / Attorney markup.' },
    { label: 'Semantic, accessible HTML', status: pick(2), note: 'Clean headings and landmarks for parsers.' },
    { label: 'AI crawler access (robots)', status: pick(3), note: 'Allows reputable AI crawlers to read public pages.' },
    { label: 'Sitemap & metadata', status: pick(4), note: 'Complete titles and descriptions per page.' },
    { label: 'FAQ / answer-ready content', status: pick(5), note: 'Content AI can quote directly.' },
  ]
  const weight = { pass: 100, warn: 55, fail: 10 }
  const score = Math.round(
    checks.reduce((a, c) => a + weight[c.status], 0) / checks.length
  )
  return { score, checks }
}

function WebsiteStep({
  data,
  set,
  onNext,
  onBack,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ score: number; checks: Check[] } | null>(null)

  const runScan = () => {
    if (!data.website) return
    setScanning(true)
    setResult(null)
    setTimeout(() => {
      setResult(scanSite(data.website))
      setScanning(false)
    }, 1100)
  }

  const statusColor: Record<Check['status'], string> = {
    pass: 'text-emerald-300',
    warn: 'text-amber-300',
    fail: 'text-red-300',
  }
  const statusIcon: Record<Check['status'], string> = { pass: '✓', warn: '!', fail: '✕' }

  return (
    <div>
      <StepHeader
        title="Add your website"
        sub="We’ll scan it for AI-readiness and show you exactly what to fix."
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          value={data.website}
          onChange={(e) => set({ website: e.target.value })}
          placeholder="https://www.yourfirm.com"
          inputMode="url"
        />
        <button
          onClick={runScan}
          disabled={!data.website || scanning}
          className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-40"
        >
          {scanning ? 'Scanning…' : 'Scan my site'}
        </button>
      </div>

      {scanning && (
        <div className="mt-6 animate-pulse text-sm text-slate-400">
          Analyzing AI-readiness…
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray={`${(result.score / 100) * 94} 94`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white">{result.score}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI-readiness score</p>
              <p className="text-sm text-slate-400">
                We can fix the gaps below automatically in the next steps.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {result.checks.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${statusColor[c.status]}`}>
                    {statusIcon[c.status]}
                  </span>
                  <div>
                    <p className="text-sm text-slate-200">{c.label}</p>
                    <p className="text-xs text-slate-500">{c.note}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold uppercase ${statusColor[c.status]}`}>
                  {c.status === 'pass' ? 'Ready' : c.status === 'warn' ? 'Improve' : 'Missing'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.website} />
    </div>
  )
}

/* ------------------------------ Step 3: CMS ----------------------------- */

function CmsStep({
  data,
  set,
  onNext,
  onBack,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState(false)

  const isWp = data.cms === 'wordpress'
  const needsCreds = data.cms && data.cms !== 'custom'
  const canConnect =
    !needsCreds || (data.cmsSiteUrl && data.cmsUser && data.cmsAppPassword)

  const testConnection = () => {
    setTesting(true)
    setConnected(false)
    // NOTE: nothing is transmitted in this demo. A real integration would send
    // credentials over TLS to a backend that stores them encrypted.
    setTimeout(() => {
      setTesting(false)
      setConnected(true)
    }, 1200)
  }

  return (
    <div>
      <StepHeader
        title="Connect your CMS"
        sub="Pick your platform so we can deploy the tools directly to your site."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CMS_OPTIONS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              set({ cms: c.id })
              setConnected(false)
            }}
            className={`rounded-xl border p-4 text-left transition ${
              data.cms === c.id
                ? 'border-amber-400/50 bg-amber-400/10'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
            }`}
          >
            <span className="block text-sm font-semibold text-white">{c.label}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{c.note}</span>
          </button>
        ))}
      </div>

      {needsCreds && (
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
            <span className="mt-0.5 text-amber-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <p className="text-xs leading-relaxed text-amber-100/90">
              {isWp ? (
                <>
                  Use a <strong>WordPress Application Password</strong>, not your
                  admin password. Create one under{' '}
                  <span className="text-amber-200">Users → Profile → Application Passwords</span>{' '}
                  — it’s scoped and revocable anytime.
                </>
              ) : (
                <>
                  Use a scoped <strong>API key / token</strong> from your platform,
                  never your account password. You can revoke it at any time.
                </>
              )}{' '}
              In this demo, nothing you type is transmitted or stored.
            </p>
          </div>

          <Field label="Site URL">
            <input
              className={inputClass}
              value={data.cmsSiteUrl}
              onChange={(e) => set({ cmsSiteUrl: e.target.value })}
              placeholder="https://www.yourfirm.com"
              autoComplete="off"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username / account email">
              <input
                className={inputClass}
                value={data.cmsUser}
                onChange={(e) => set({ cmsUser: e.target.value })}
                placeholder="admin"
                autoComplete="off"
              />
            </Field>
            <Field
              label={isWp ? 'Application Password' : 'API key / token'}
              hint="Scoped & revocable — not your main password."
            >
              <input
                className={inputClass}
                value={data.cmsAppPassword}
                onChange={(e) => set({ cmsAppPassword: e.target.value })}
                placeholder="xxxx xxxx xxxx xxxx"
                type="password"
                autoComplete="off"
              />
            </Field>
          </div>

          <button
            onClick={testConnection}
            disabled={!canConnect || testing}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-40"
          >
            {testing ? 'Testing connection…' : 'Test connection'}
          </button>
          {connected && (
            <p className="text-sm font-medium text-emerald-300">
              ✓ Connected to {data.cms}. We can deploy to this site.
            </p>
          )}
        </div>
      )}

      {data.cms === 'custom' && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
          No login needed — for custom sites we’ll give you a one-line embed snippet
          on the final step that you paste before <code className="text-amber-300">&lt;/body&gt;</code>.
        </div>
      )}

      <NavRow
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!data.cms || (Boolean(needsCreds) && !connected)}
      />
    </div>
  )
}

/* ----------------------------- Step 4: Tools ---------------------------- */

function ToolsStep({
  data,
  set,
  onNext,
  onBack,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggle = (id: string) =>
    set({ tools: { ...data.tools, [id]: !data.tools[id] } })
  const count = Object.values(data.tools).filter(Boolean).length

  return (
    <div>
      <StepHeader
        title="Choose what to implement"
        sub="Toggle the AI tools to deploy. You can add or remove these anytime."
      />
      <div className="space-y-3">
        {TOOLS.map((t) => {
          const on = !!data.tools[t.id]
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                on ? 'border-amber-400/40 bg-amber-400/[0.06]' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${
                  on ? 'bg-amber-400' : 'bg-white/15'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-slate-950 transition-all ${
                    on ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{t.name}</span>
                  {t.recommended && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
      <NavRow
        onBack={onBack}
        onNext={onNext}
        nextLabel={`Review ${count} tool${count === 1 ? '' : 's'}`}
        nextDisabled={count === 0}
      />
    </div>
  )
}

/* ----------------------------- Step 5: Launch --------------------------- */

function LaunchStep({ data, onBack }: { data: WizardData; onBack: () => void }) {
  const selected = TOOLS.filter((t) => data.tools[t.id])
  const tasks = useMemo(
    () => [
      'Authenticating with your CMS',
      ...selected.map((t) => `Deploying: ${t.name}`),
      'Publishing AI-readability files',
      'Verifying installation',
    ],
    [selected]
  )

  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [doneCount, setDoneCount] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const run = () => {
    setPhase('running')
    setDoneCount(0)
    timer.current = setInterval(() => {
      setDoneCount((c) => {
        const nextC = c + 1
        if (nextC >= tasks.length && timer.current) {
          clearInterval(timer.current)
          setTimeout(() => setPhase('done'), 500)
        }
        return nextC
      })
    }, 700)
  }

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  if (phase === 'done') {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className={`${serif} mt-5 text-2xl font-semibold text-white`}>
          {data.firm || 'Your firm'} is now AI-ready 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          We deployed {selected.length} tool{selected.length === 1 ? '' : 's'} to{' '}
          {data.website || 'your site'}. Here’s what went live:
        </p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
          {selected.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-200">
              <span className="text-emerald-300">✓</span> {t.name}
            </li>
          ))}
        </ul>

        {data.cms === 'custom' && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-white/10 bg-slate-950/60 p-4 text-left">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Paste before &lt;/body&gt;
            </p>
            <code className="block overflow-x-auto whitespace-pre rounded-lg bg-black/40 p-3 text-xs text-amber-200">
              {`<script src="https://cdn.firmai.example/widget.js"\n  data-firm="${(data.firm || 'your-firm').toLowerCase().replace(/\s+/g, '-')}"\n  defer></script>`}
            </code>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/law-firms#contact"
            className="w-full rounded-xl bg-amber-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:w-auto"
          >
            Talk to our team
          </Link>
          <Link
            href="/law-firms/demos"
            className="w-full rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/5 sm:w-auto"
          >
            Explore the tools
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-600">
          Demo flow — no site was modified and no credentials were sent. Wire this to
          a secure backend to make it real.
        </p>
      </div>
    )
  }

  return (
    <div>
      <StepHeader
        title="Review & launch"
        sub="One click deploys everything to your connected site."
      />
      <dl className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm">
        <Row label="Firm" value={data.firm || '—'} />
        <Row label="Website" value={data.website || '—'} />
        <Row label="CMS" value={data.cms ? data.cms : '—'} />
        <Row label="Tools" value={`${selected.length} selected`} />
      </dl>

      {phase === 'idle' ? (
        <>
          <button
            onClick={run}
            className="mt-6 w-full rounded-xl bg-amber-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
          >
            ⚡ Implement everything with one click
          </button>
          <div className="mt-6">
            <NavRow onBack={onBack} />
          </div>
        </>
      ) : (
        <ul className="mt-6 space-y-2">
          {tasks.map((t, i) => {
            const isDone = i < doneCount
            const isActive = i === doneCount
            return (
              <li
                key={t}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  isDone
                    ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-slate-200'
                    : isActive
                      ? 'border-amber-400/30 bg-amber-400/[0.06] text-white'
                      : 'border-white/5 bg-white/[0.02] text-slate-500'
                }`}
              >
                <span className="w-4">
                  {isDone ? (
                    <span className="text-emerald-300">✓</span>
                  ) : isActive ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  ) : (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />
                  )}
                </span>
                {t}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  )
}
