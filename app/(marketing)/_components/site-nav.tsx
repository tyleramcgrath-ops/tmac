'use client'

// Real multi-page marketing nav (SEO): every item is an actual route, not an
// in-page anchor. Session-aware — shows "Log in" to visitors and "Client area"
// + "Log out" to signed-in users, and logging out returns to the homepage.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Zap, LogOut } from 'lucide-react'
import { api } from '../../lib/client'

const LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'WordPress', href: '/wordpress' },
  { label: 'Agency', href: '/agency' },
  { label: 'Pricing', href: '/pricing' },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let alive = true
    api.me().then((r) => alive && setSignedIn(!!r.user)).catch(() => alive && setSignedIn(false))
    return () => { alive = false }
  }, [])

  async function logout() {
    try { await api.logout() } catch { /* ignore */ }
    setSignedIn(false)
    router.push('/')
    router.refresh()
  }

  const linkCls = (href: string) =>
    `text-sm transition-colors hover:text-white ${pathname === href ? 'text-white' : 'text-[var(--rf-muted)]'}`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.82)] backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <>
              <Link href="/projects" className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white">Client area</Link>
              <button onClick={logout} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium"><LogOut className="h-4 w-4" /> Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white">Log in</Link>
              <Link href="/signup" className="rf-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">Start free</Link>
            </>
          )}
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
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[15px] text-[var(--rf-muted)] hover:bg-white/5 hover:text-white">{l.label}</Link>
            ))}
            {signedIn ? (
              <>
                <Link href="/projects" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[15px] text-[var(--rf-muted)] hover:bg-white/5 hover:text-white">Client area</Link>
                <button onClick={() => { setOpen(false); logout() }} className="rf-btn-ghost mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"><LogOut className="h-4 w-4" /> Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[15px] text-[var(--rf-muted)] hover:bg-white/5 hover:text-white">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rf-btn-primary mt-2 rounded-xl px-4 py-3 text-center text-sm font-semibold">Start free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
