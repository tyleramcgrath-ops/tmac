'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Wordmark } from './primitives'

const LINKS = [
  { href: '/contact#results', label: 'Results' },
  { href: '/contact#services', label: 'Services' },
  { href: '/contact/app', label: 'LLM SEO tool' },
  { href: '/contact#process', label: 'Process' },
  { href: '/contact#testimonials', label: 'Testimonials' },
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
    <header className={`ctc-nav ${lifted ? 'ctc-nav-lifted' : ''}`}>
      <div className="ctc-wrap ctc-between" style={{ height: 72, gap: 'var(--s-5)' }}>
        <Link href="/contact" aria-label="Contact Studios — home" style={{ textDecoration: 'none' }}>
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="ctc-row ctc-g5 ctc-nav-desktop">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="ctc-navlink">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ctc-row ctc-g2 ctc-nav-desktop">
          <Link href="/contact/signin" className="ctc-btn ctc-btn-ghost ctc-btn-sm">
            Client login
          </Link>
          <Link href="/contact#book" className="ctc-btn ctc-btn-ember ctc-btn-sm">
            Let&rsquo;s talk
          </Link>
        </div>

        <button
          type="button"
          className="ctc-btn ctc-btn-quiet ctc-btn-sm ctc-nav-mobile"
          aria-expanded={open}
          aria-controls="ctc-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          <span className="ctc-sr">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open ? (
        <div id="ctc-mobile-menu" className="ctc-mobile-menu ctc-pop">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="ctc-mobile-link">
              {link.label}
            </Link>
          ))}
          <div className="ctc-stack ctc-g3" style={{ marginTop: 'var(--s-4)' }}>
            <Link href="/contact/signin" className="ctc-btn ctc-btn-quiet ctc-btn-lg" onClick={() => setOpen(false)}>
              Client login
            </Link>
            <Link href="/contact#book" className="ctc-btn ctc-btn-ember ctc-btn-lg" onClick={() => setOpen(false)}>
              Let&rsquo;s talk
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="ctc-footer">
      <div className="ctc-wrap">
        <div className="ctc-footer-grid">
          <div className="ctc-stack ctc-g3" style={{ maxWidth: 320 }}>
            <Wordmark />
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              The search agency built for what&rsquo;s next.
            </p>
          </div>

          <FooterCol
            title="Navigation"
            links={[
              { href: '/contact#results', label: 'Results' },
              { href: '/contact#services', label: 'Services' },
              { href: '/contact#process', label: 'Process' },
              { href: '/contact#book', label: 'Book a call' },
            ]}
          />
          <FooterCol
            title="Tools"
            links={[
              { href: '/contact/app', label: 'LLM visibility scan' },
              { href: '/contact/signin', label: 'Client login' },
              { href: '/contact/signup', label: 'Create account' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: '/contact#testimonials', label: 'Testimonials' },
              { href: '/contact#book', label: 'Careers' },
            ]}
          />
        </div>

        <div className="ctc-footer-base">
          <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
            © {new Date().getFullYear()} Contact Studios Inc. A design and engineering study.
          </p>
          <p className="ctc-faint ctc-num" style={{ fontSize: 'var(--t-2xs)', letterSpacing: '0.08em' }}>
            SCANS RUN LIVE ON CLAUDE
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="ctc-stack ctc-g3">
      <h2 className="ctc-eyebrow">{title}</h2>
      <ul className="ctc-stack ctc-g2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="ctc-footlink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
