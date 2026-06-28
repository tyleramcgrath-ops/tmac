import Link from 'next/link'
import { Wizard } from './wizard'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      {/* Header */}
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/get-started" className="flex items-center gap-2.5">
            <Spark />
            <span className="text-base font-semibold tracking-tight text-white">
              Ready<span className="text-amber-400">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-slate-500 sm:block">For any website</span>
            <Link href="/law-firms" className="text-slate-300 transition hover:text-white">
              For law firms →
            </Link>
          </div>
        </nav>
      </header>

      {/* Intro */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3.5 py-1.5 text-xs font-medium text-amber-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Free AI test · implement for $9.99
          </span>
          <h1 className={`${serif} mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Make any website AI-ready
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Test your site free and see exactly what it needs. Connect your CMS for a
            full plan, then deploy a chatbot, AI-readability, schema, search, and lead
            capture in one click.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Check /> Free AI-readiness test</span>
            <span className="flex items-center gap-1.5"><Check /> Works with any CMS</span>
            <span className="flex items-center gap-1.5"><Check /> One-click, $9.99 to implement</span>
          </div>
        </div>
      </section>

      {/* Wizard */}
      <section className="px-6 py-14">
        <Wizard />
      </section>

      {/* Reassurance */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-14 sm:grid-cols-3">
          {reassurance.map((r) => (
            <div key={r.title} className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">{r.icon}</div>
              <h3 className="mt-4 text-sm font-semibold text-white">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2.5">
            <Spark />
            <span className="text-sm font-semibold text-white">Ready<span className="text-amber-400">AI</span></span>
          </div>
          <p className="text-xs text-slate-500">Demo flow · no site is modified · placeholder brand</p>
        </div>
      </footer>
    </main>
  )
}

function Spark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 ${className}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </span>
  )
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function I({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const reassurance = [
  {
    title: 'Test before you pay',
    body: 'Run the full AI-readiness test and see your complete plan for free. You only pay $9.99 when you’re ready to implement.',
    icon: <I><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></I>,
  },
  {
    title: 'Credentials stay scoped',
    body: 'We use revocable application passwords and API keys — never your main login — encrypted and removable anytime.',
    icon: <I><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></I>,
  },
  {
    title: 'Nothing breaks',
    body: 'Tools are added non-destructively. Preview changes and roll back any deployment with one click.',
    icon: <I><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3" /><path d="M3 4v5h5" /></I>,
  },
]
