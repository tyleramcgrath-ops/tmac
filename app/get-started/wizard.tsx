'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'
const PRICE = '9.99'

/* ----------------------------- Types & data ----------------------------- */

type CmsType = 'wordpress' | 'webflow' | 'squarespace' | 'wix' | 'shopify' | 'custom'

interface WizardData {
  name: string
  email: string
  website: string
  cms: CmsType | null
  cmsSiteUrl: string
  cmsUser: string
  cmsKey: string
  tools: Record<string, boolean>
}

interface Tool {
  id: string
  name: string
  desc: string
  change: string
  recommended?: boolean
}

const TOOLS: Tool[] = [
  {
    id: 'chatbot',
    name: 'AI site assistant (chatbot)',
    desc: 'A chat widget trained on your content that answers visitor questions 24/7 and captures leads.',
    change: 'Adds a lightweight chat widget script and indexes your public pages.',
    recommended: true,
  },
  {
    id: 'ai-readability',
    name: 'AI readability (llms.txt + crawler access)',
    desc: 'Lets AI assistants like ChatGPT and Claude discover, understand, and cite your site.',
    change: 'Publishes /llms.txt and adjusts robots rules to allow reputable AI crawlers.',
    recommended: true,
  },
  {
    id: 'schema',
    name: 'Structured data (schema.org)',
    desc: 'Machine-readable markup so search engines and AI understand your pages.',
    change: 'Injects JSON-LD (Organization, FAQ, Article/Product) into your page head.',
    recommended: true,
  },
  {
    id: 'search',
    name: 'Semantic site search',
    desc: 'Natural-language search across everything on your site.',
    change: 'Builds a vector index of your content and adds a search endpoint.',
  },
  {
    id: 'leadbot',
    name: 'AI lead capture',
    desc: 'Qualifies visitors, collects their details, and routes them to you.',
    change: 'Connects the assistant to a lead form / your inbox or CRM.',
    recommended: true,
  },
  {
    id: 'content',
    name: 'AI content & meta optimization',
    desc: 'Answer-ready FAQ content and optimized meta descriptions per page.',
    change: 'Generates draft FAQ blocks and meta tags for your review.',
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

const STEPS = ['Account', 'Test', 'Connect', 'Plan', 'Pay', 'Launch']

/* ------------------------------- Component ------------------------------ */

export function Wizard() {
  const [step, setStep] = useState(0)
  const [paid, setPaid] = useState(false)
  const [data, setData] = useState<WizardData>({
    name: '',
    email: '',
    website: '',
    cms: null,
    cmsSiteUrl: '',
    cmsUser: '',
    cmsKey: '',
    tools: { chatbot: true, 'ai-readability': true, schema: true, leadbot: true },
  })
  const [scan, setScan] = useState<ScanResult | null>(null)

  const set = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }))
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="mx-auto max-w-3xl">
      <Steps step={step} />
      <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-9">
        {step === 0 && <AccountStep data={data} set={set} onNext={next} />}
        {step === 1 && (
          <TestStep data={data} set={set} scan={scan} setScan={setScan} onNext={next} onBack={back} />
        )}
        {step === 2 && <ConnectStep data={data} set={set} onNext={next} onBack={back} />}
        {step === 3 && <PlanStep data={data} set={set} scan={scan} onNext={next} onBack={back} />}
        {step === 4 && (
          <PayStep data={data} paid={paid} onPaid={() => setPaid(true)} onNext={next} onBack={back} />
        )}
        {step === 5 && <LaunchStep data={data} paid={paid} onBack={back} />}
      </div>
    </div>
  )
}

/* -------------------------------- Shared UI ----------------------------- */

function Steps({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5">
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
            <span className={`hidden text-xs font-medium sm:block ${active ? 'text-white' : 'text-slate-500'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/10" aria-hidden="true" />}
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

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
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
        <button onClick={onBack} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5">
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

/* ------------------------------ Step: Account --------------------------- */

function AccountStep({
  data,
  set,
  onNext,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  onNext: () => void
}) {
  const valid = data.name && /\S+@\S+\.\S+/.test(data.email)
  return (
    <div>
      <StepHeader title="Create your account" sub="Free to test any site. You only pay to implement." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputClass} value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="Alex Rivera" autoComplete="name" />
        </Field>
        <Field label="Email">
          <input className={inputClass} value={data.email} onChange={(e) => set({ email: e.target.value })} placeholder="alex@company.com" type="email" autoComplete="email" />
        </Field>
      </div>
      <NavRow onNext={onNext} nextDisabled={!valid} nextLabel="Create account" />
    </div>
  )
}

/* ------------------------------ Step: Test ------------------------------ */

type Check = { label: string; status: 'pass' | 'warn' | 'fail'; note: string }
type ScanResult = { score: number; checks: Check[]; pages: number }

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function scanSite(url: string): ScanResult {
  const seed = hashString(url || 'x')
  const pick = (i: number): Check['status'] => {
    const v = (seed >> (i * 2)) % 3
    return v === 0 ? 'fail' : v === 1 ? 'warn' : 'pass'
  }
  const checks: Check[] = [
    { label: 'llms.txt for AI assistants', status: pick(0), note: 'Lets AI tools discover and cite your site.' },
    { label: 'Structured data (schema.org)', status: pick(1), note: 'Organization / FAQ / Article markup.' },
    { label: 'Semantic, accessible HTML', status: pick(2), note: 'Clean headings and landmarks for parsers.' },
    { label: 'AI crawler access (robots)', status: pick(3), note: 'Allows reputable AI crawlers to read public pages.' },
    { label: 'Sitemap & metadata', status: pick(4), note: 'Complete titles and descriptions per page.' },
    { label: 'Answer-ready content', status: pick(5), note: 'Content AI can quote directly.' },
  ]
  const weight = { pass: 100, warn: 55, fail: 10 }
  const score = Math.round(checks.reduce((a, c) => a + weight[c.status], 0) / checks.length)
  const pages = 8 + (seed % 240)
  return { score, checks, pages }
}

const statusColor: Record<Check['status'], string> = {
  pass: 'text-emerald-300',
  warn: 'text-amber-300',
  fail: 'text-red-300',
}
const statusIcon: Record<Check['status'], string> = { pass: '✓', warn: '!', fail: '✕' }

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray={`${(score / 100) * 94} 94`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold text-white">{score}</span>
    </div>
  )
}

function TestStep({
  data,
  set,
  scan,
  setScan,
  onNext,
  onBack,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  scan: ScanResult | null
  setScan: (s: ScanResult) => void
  onNext: () => void
  onBack: () => void
}) {
  const [scanning, setScanning] = useState(false)
  const run = () => {
    if (!data.website) return
    setScanning(true)
    setTimeout(() => {
      setScan(scanSite(data.website))
      setScanning(false)
    }, 1100)
  }

  return (
    <div>
      <StepHeader title="Test any website for AI" sub="Enter any URL. We’ll grade its AI-readiness and tell you exactly what it needs." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className={inputClass} value={data.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://www.example.com" inputMode="url" />
        <button onClick={run} disabled={!data.website || scanning} className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-40">
          {scanning ? 'Testing…' : 'Run AI test'}
        </button>
      </div>

      {scanning && <p className="mt-6 animate-pulse text-sm text-slate-400">Analyzing AI-readiness…</p>}

      {scan && (
        <div className="mt-6">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <ScoreRing score={scan.score} />
            <div>
              <p className="text-sm font-semibold text-white">
                AI-readiness score — {scan.score < 50 ? 'needs work' : scan.score < 80 ? 'decent, fixable' : 'strong'}
              </p>
              <p className="text-sm text-slate-400">Scanned ~{scan.pages} pages. Here’s what you need:</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {scan.checks.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${statusColor[c.status]}`}>{statusIcon[c.status]}</span>
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
          <p className="mt-4 text-center text-sm text-amber-300">
            Connect your site next — we’ll fix all of this for you.
          </p>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!scan} nextLabel="Connect my site" />
    </div>
  )
}

/* ------------------------------ Step: Connect --------------------------- */

function ConnectStep({
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
  const canConnect = !needsCreds || (data.cmsSiteUrl && data.cmsUser && data.cmsKey)

  const testConnection = () => {
    setTesting(true)
    setConnected(false)
    // NOTE: demo only — nothing is transmitted. A real integration sends
    // credentials over TLS to a backend that stores them encrypted.
    setTimeout(() => {
      setTesting(false)
      setConnected(true)
    }, 1200)
  }

  return (
    <div>
      <StepHeader title="Connect your CMS" sub="Tell us where your site lives so we can read it and deploy your tools." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CMS_OPTIONS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              set({ cms: c.id })
              setConnected(false)
            }}
            className={`rounded-xl border p-4 text-left transition ${
              data.cms === c.id ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
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
                  Use a <strong>WordPress Application Password</strong> (Users → Profile → Application Passwords),
                  not your admin password — it’s scoped and revocable anytime.
                </>
              ) : (
                <>
                  Use a scoped <strong>API key / token</strong>, never your account password. Revoke it anytime.
                </>
              )}{' '}
              In this demo nothing you type is transmitted or stored.
            </p>
          </div>
          <Field label="Site URL">
            <input className={inputClass} value={data.cmsSiteUrl} onChange={(e) => set({ cmsSiteUrl: e.target.value })} placeholder="https://www.example.com" autoComplete="off" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username / account email">
              <input className={inputClass} value={data.cmsUser} onChange={(e) => set({ cmsUser: e.target.value })} placeholder="admin" autoComplete="off" />
            </Field>
            <Field label={isWp ? 'Application Password' : 'API key / token'} hint="Scoped & revocable — not your main password.">
              <input className={inputClass} value={data.cmsKey} onChange={(e) => set({ cmsKey: e.target.value })} placeholder="xxxx xxxx xxxx xxxx" type="password" autoComplete="off" />
            </Field>
          </div>
          <button onClick={testConnection} disabled={!canConnect || testing} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-40">
            {testing ? 'Connecting…' : 'Connect & analyze'}
          </button>
          {connected && <p className="text-sm font-medium text-emerald-300">✓ Connected to {data.cms}. Full analysis ready on the next step.</p>}
        </div>
      )}

      {data.cms === 'custom' && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
          No login needed — for custom sites you’ll get a one-line embed snippet after checkout.
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.cms || (Boolean(needsCreds) && !connected)} nextLabel="See my plan" />
    </div>
  )
}

/* ------------------------------ Step: Plan ------------------------------ */

function PlanStep({
  data,
  set,
  scan,
  onNext,
  onBack,
}: {
  data: WizardData
  set: (p: Partial<WizardData>) => void
  scan: ScanResult | null
  onNext: () => void
  onBack: () => void
}) {
  const toggle = (id: string) => set({ tools: { ...data.tools, [id]: !data.tools[id] } })
  const count = Object.values(data.tools).filter(Boolean).length

  return (
    <div>
      <StepHeader
        title="Your AI implementation plan"
        sub={`Based on ${data.cms ?? 'your site'}${scan ? ` (~${scan.pages} pages, score ${scan.score})` : ''}, here’s everything we’ll do. Toggle anything off you don’t want.`}
      />

      {scan && (
        <div className="mb-6 flex flex-wrap gap-2">
          {scan.checks.filter((c) => c.status !== 'pass').map((c) => (
            <span key={c.label} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200">
              Fix: {c.label}
            </span>
          ))}
          {scan.checks.every((c) => c.status === 'pass') && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              Looking good — we’ll add tools on top
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {TOOLS.map((t) => {
          const on = !!data.tools[t.id]
          return (
            <div
              key={t.id}
              className={`rounded-xl border p-4 transition ${on ? 'border-amber-400/40 bg-amber-400/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
            >
              <div className="flex items-start gap-4">
                <button onClick={() => toggle(t.id)} aria-label={`Toggle ${t.name}`} className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${on ? 'bg-amber-400' : 'bg-white/15'}`}>
                  <span className={`h-5 w-5 rounded-full bg-slate-950 transition-all ${on ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{t.name}</span>
                    {t.recommended && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">Recommended</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-400">What we change:</span> {t.change}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={count === 0} nextLabel={`Unlock implementation — $${PRICE}`} />
    </div>
  )
}

/* ------------------------------- Step: Pay ------------------------------ */

function PayStep({
  data,
  paid,
  onPaid,
  onNext,
  onBack,
}: {
  data: WizardData
  paid: boolean
  onPaid: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [card, setCard] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [processing, setProcessing] = useState(false)

  const valid = card.replace(/\s/g, '').length >= 12 && /\d\d\/\d\d/.test(exp) && cvc.length >= 3

  const pay = () => {
    setProcessing(true)
    // DEMO ONLY — do not collect real card data here. In production, redirect to
    // Stripe Checkout (PCI-compliant) and unlock on the webhook/confirmation.
    setTimeout(() => {
      setProcessing(false)
      onPaid()
    }, 1400)
  }

  if (paid) {
    return (
      <div>
        <StepHeader title="Payment confirmed" sub="You’re all set — implementation is unlocked." />
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
          ✓ ${PRICE} paid. Continue to launch your AI tools.
        </div>
        <NavRow onBack={onBack} onNext={onNext} nextLabel="Go to launch" />
      </div>
    )
  }

  return (
    <div>
      <StepHeader title={`Unlock implementation — $${PRICE}`} sub="One-time charge to deploy everything to your site. Test free; pay to implement." />

      <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">One-click implementation</span>
          <span className="text-sm font-semibold text-white">${PRICE}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-sm font-semibold text-white">Total due today</span>
          <span className={`${serif} text-2xl font-semibold text-amber-400`}>${PRICE}</span>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Card number">
          <input
            className={inputClass}
            value={card}
            onChange={(e) => setCard(formatCard(e.target.value))}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry">
            <input className={inputClass} value={exp} onChange={(e) => setExp(formatExp(e.target.value))} placeholder="MM/YY" inputMode="numeric" autoComplete="off" />
          </Field>
          <Field label="CVC">
            <input className={inputClass} value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" autoComplete="off" />
          </Field>
        </div>

        <button
          onClick={pay}
          disabled={!valid || processing}
          className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {processing ? 'Processing…' : `Pay $${PRICE} & unlock`}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Test mode — no real charge. Integrate Stripe Checkout to go live.
        </p>
      </div>

      <div className="mt-6">
        <NavRow onBack={onBack} />
      </div>
    </div>
  )
}

function formatCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

/* ------------------------------ Step: Launch ---------------------------- */

function LaunchStep({ data, paid, onBack }: { data: WizardData; paid: boolean; onBack: () => void }) {
  const selected = TOOLS.filter((t) => data.tools[t.id])
  const tasks = useMemo(
    () => ['Authenticating with your CMS', ...selected.map((t) => `Deploying: ${t.name}`), 'Publishing AI-readability files', 'Verifying installation'],
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
        const n = c + 1
        if (n >= tasks.length && timer.current) {
          clearInterval(timer.current)
          setTimeout(() => setPhase('done'), 500)
        }
        return n
      })
    }, 650)
  }
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  if (!paid) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className={`${serif} mt-4 text-xl font-semibold text-white`}>Implementation is locked</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">Complete the $9.99 payment to deploy your tools.</p>
        <button onClick={onBack} className="mt-6 rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          Back to payment
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className={`${serif} mt-5 text-2xl font-semibold text-white`}>Your site is now AI-ready 🎉</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          We deployed {selected.length} tool{selected.length === 1 ? '' : 's'} to {data.website || 'your site'}:
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
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Paste before &lt;/body&gt;</p>
            <code className="block overflow-x-auto whitespace-pre rounded-lg bg-black/40 p-3 text-xs text-amber-200">
              {`<script src="https://cdn.readyai.example/widget.js"\n  data-site="${(data.website || 'your-site').replace(/^https?:\/\//, '').replace(/\/.*/, '')}"\n  defer></script>`}
            </code>
          </div>
        )}
        <p className="mt-6 text-xs text-slate-600">Demo flow — no site was modified, no card was charged, no credentials were sent.</p>
      </div>
    )
  }

  return (
    <div>
      <StepHeader title="Launch" sub="One click deploys everything to your connected site." />
      {phase === 'idle' ? (
        <>
          <button onClick={run} className="w-full rounded-xl bg-amber-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300">
            ⚡ Implement everything with one click
          </button>
          <div className="mt-6">
            <NavRow onBack={onBack} />
          </div>
        </>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t, i) => {
            const isDone = i < doneCount
            const isActive = i === doneCount
            return (
              <li key={t} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${isDone ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-slate-200' : isActive ? 'border-amber-400/30 bg-amber-400/[0.06] text-white' : 'border-white/5 bg-white/[0.02] text-slate-500'}`}>
                <span className="w-4">
                  {isDone ? <span className="text-emerald-300">✓</span> : isActive ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /> : <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />}
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
