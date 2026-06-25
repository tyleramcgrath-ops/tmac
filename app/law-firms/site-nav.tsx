'use client'

import { useState } from 'react'

const links = [
  { href: '#services', label: 'Services' },
  { href: '#showcase', label: 'Product' },
  { href: '#process', label: 'How it works' },
  { href: '/law-firms/demos', label: 'Demos' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#security', label: 'Security' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold tracking-tight text-white">
            Firm<span className="text-amber-400">AI</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#contact"
            className="text-sm font-semibold text-slate-200 transition hover:text-white"
          >
            Book a call
          </a>
          <a
            href="/law-firms/get-started"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Get started
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-200 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/law-firms/get-started"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-slate-950"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M5 7 2 14a4 4 0 0 0 6 0L5 7Z" />
        <path d="M19 7l-3 7a4 4 0 0 0 6 0l-3-7Z" />
        <path d="M8 21h8" />
      </svg>
    </span>
  )
}
