'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Wordmark } from './primitives'

const LINKS = [
  { href: '/contact#how', label: 'How it works' },
  { href: '/contact#craft', label: 'The brief' },
  { href: '/contact#pricing', label: 'Pricing' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${lifted ? 'var(--line)' : 'transparent'}`,
        background: lifted ? 'rgba(247,243,234,0.86)' : 'transparent',
        backdropFilter: lifted ? 'saturate(180%) blur(12px)' : 'none',
        transition: 'background-color var(--d-2) var(--e-out), border-color var(--d-2) var(--e-out)',
      }}
    >
      <div
        className="ctc-wrap ctc-between"
        style={{ height: 68, gap: 'var(--s-5)' }}
      >
        <Link href="/contact" aria-label="Contact — home" style={{ textDecoration: 'none' }}>
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="ctc-row ctc-g5 ctc-nav-desktop">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="ctc-navlink"
              style={{
                fontSize: 'var(--t-sm)',
                color: 'var(--ink-muted)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ctc-row ctc-g2 ctc-nav-desktop">
          <Link href="/contact/signin" className="ctc-btn ctc-btn-ghost ctc-btn-sm">
            Sign in
          </Link>
          <Link href="/contact/signup" className="ctc-btn ctc-btn-primary ctc-btn-sm">
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="ctc-btn ctc-btn-quiet ctc-btn-sm ctc-nav-mobile"
          aria-expanded={open}
          aria-controls="ctc-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          <span className="ctc-sr">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open ? (
        <div
          id="ctc-mobile-menu"
          className="ctc-pop"
          style={{
            position: 'fixed',
            inset: '68px 0 0',
            background: 'var(--paper)',
            padding: 'var(--s-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--s-2)',
            zIndex: 49,
          }}
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--t-xl)',
                color: 'var(--ink)',
                textDecoration: 'none',
                padding: 'var(--s-3) 0',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div className="ctc-stack ctc-g3" style={{ marginTop: 'var(--s-4)' }}>
            <Link
              href="/contact/signin"
              className="ctc-btn ctc-btn-quiet ctc-btn-lg"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/contact/signup"
              className="ctc-btn ctc-btn-primary ctc-btn-lg"
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer
      className="ctc-on-ink"
      style={{ background: 'var(--ink)', color: 'var(--paper)', paddingBlock: 'var(--s-8)' }}
    >
      <div className="ctc-wrap">
        <div className="ctc-footer-grid">
          <div className="ctc-stack ctc-g3" style={{ maxWidth: 320 }}>
            <span style={{ color: 'var(--paper)' }}>
              <Wordmark onInk />
            </span>
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              The network you already have. Kept warm, on purpose.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              { href: '/contact#how', label: 'How it works' },
              { href: '/contact#craft', label: 'The brief' },
              { href: '/contact#pricing', label: 'Pricing' },
              { href: '/contact/app', label: 'Open workspace' },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { href: '/contact/signup', label: 'Create account' },
              { href: '/contact/signin', label: 'Sign in' },
            ]}
          />
          <FooterCol
            title="Elsewhere"
            links={[
              { href: '/contact#faq', label: 'Questions' },
              { href: '/contact#pricing', label: 'For teams' },
            ]}
          />
        </div>

        <div
          className="ctc-between ctc-wrapflex ctc-g3"
          style={{
            marginTop: 'var(--s-7)',
            paddingTop: 'var(--s-4)',
            borderTop: '1px solid var(--line-ink)',
          }}
        >
          <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
            © {new Date().getFullYear()} Contact. A design and engineering study.
          </p>
          <p className="ctc-faint ctc-num" style={{ fontSize: 'var(--t-2xs)', letterSpacing: '0.08em' }}>
            BRIEFS WRITTEN BY CLAUDE · REVIEW BEFORE SENDING
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div className="ctc-stack ctc-g3">
      <h2 className="ctc-eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>
        {title}
      </h2>
      <ul className="ctc-stack ctc-g2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              style={{
                fontSize: 'var(--t-sm)',
                color: 'rgba(247,243,234,0.72)',
                textDecoration: 'none',
              }}
              className="ctc-footlink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
