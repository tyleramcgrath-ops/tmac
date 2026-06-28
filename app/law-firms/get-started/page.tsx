import Link from 'next/link'
import { Logo } from '../site-nav'
import { Wizard } from './wizard'

const serif = '[font-family:Georgia,"Times_New_Roman",serif]'

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      {/* Header */}
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/law-firms" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-base font-semibold tracking-tight text-white">
              Firm<span className="text-amber-400">AI</span>
            </span>
          </Link>
          <Link
            href="/law-firms"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            ← Back to site
          </Link>
        </nav>
      </header>

      {/* Intro */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3.5 py-1.5 text-xs font-medium text-amber-300">
            Set up in minutes · one-click implement
          </span>
          <h1 className={`${serif} mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}>
            Make your firm’s website AI-ready
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Sign up, connect your site and CMS, choose your tools, and we deploy a
            chatbot, AI-readability, schema, search, and intake — in one click.
          </p>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                {r.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold text-white">
              Firm<span className="text-amber-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">Demo onboarding · no site is modified</p>
        </div>
      </footer>
    </main>
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
    title: 'Credentials stay scoped',
    body: 'We use revocable application passwords and API keys — never your main login — encrypted and removable anytime.',
    icon: (
      <I>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </I>
    ),
  },
  {
    title: 'Nothing breaks',
    body: 'Tools are added non-destructively. Preview changes, and roll back any deployment with one click.',
    icon: (
      <I>
        <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3" />
        <path d="M3 4v5h5" />
      </I>
    ),
  },
  {
    title: 'Built for legal',
    body: 'Schema, content, and the assistant are tuned for law firms — privacy-first, with attorney oversight.',
    icon: (
      <I>
        <path d="M12 3v18M5 7h14M5 7 2 14a4 4 0 0 0 6 0L5 7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7Z" />
      </I>
    ),
  },
]
