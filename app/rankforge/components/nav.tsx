'use client'

import { useEffect, useState } from 'react'
import { Menu, X, Zap, Play } from 'lucide-react'
import { useDemo } from './demo'

const LINKS = [
  { label: 'Platform', href: '#command-center' },
  { label: 'War Room', href: '#war-room' },
  { label: 'AI Readiness', href: '#ai-search' },
  { label: 'Agency', href: '#agency' },
  { label: 'Pricing', href: '#pricing' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const demo = useDemo()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.82)] backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => demo.open()}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--rf-muted)] transition-colors hover:text-white"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch Demo
          </button>
          <a
            href="/projects"
            className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white"
          >
            Open App
          </a>
          <a
            href="#scan"
            className="rf-btn-primary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Start Free Scan
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rf-btn-ghost grid h-10 w-10 place-items-center rounded-xl md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.96)] px-5 py-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] text-[var(--rf-muted)] hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                demo.open()
              }}
              className="rf-btn-ghost mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </button>
            <a
              href="#scan"
              onClick={() => setOpen(false)}
              className="rf-btn-primary mt-2 rounded-xl px-4 py-3 text-center text-sm font-semibold"
            >
              Start Free SEO Scan
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
