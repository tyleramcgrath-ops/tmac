import Link from 'next/link'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { CITIES } from '@/lib/geo'
import { SITE } from '@/lib/site'

const NAV = [
  { href: '/find-a-lawyer', label: 'Find a Lawyer' },
  { href: '/practice-areas', label: 'Practice Areas' },
  { href: '/guides', label: 'Legal Guides' },
  { href: '/states', label: 'Locations' },
  { href: '/for-attorneys', label: 'For Attorneys' },
]

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="31" fill="#0e1726" />
        <circle cx="32" cy="32" r="26.5" fill="none" stroke="#c9a76b" strokeWidth="1.2" />
        <path d="M32 15v32M22 47h20M18 24h28" stroke="#c9a76b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 24l-6 12h12zM46 24l-6 12h12z" fill="none" stroke="#c9a76b" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span className="logo-word">
        LawMatch<i>Now</i>
      </span>
    </Link>
  )
}

export function Header() {
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <div className="topbar">
        <div className="wrap">
          <span>Free to use · All 50 states</span>
          <span>
            <span className="hide-sm">Are you an attorney? </span>
            <Link href="/for-attorneys#claim">Claim your free profile</Link>
          </span>
        </div>
      </div>
      <header className="header">
        <div className="wrap">
          <Logo />
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={n.href === '/for-attorneys' ? 'nav-firms' : undefined}>{n.label}</Link>
            ))}
          </nav>
          <Link href="/get-started" className="btn btn-dark btn-sm header-cta">Free case review</Link>
          <details className="menu-btn">
            <summary aria-label="Open menu">Menu</summary>
            <nav className="menu-panel" aria-label="Mobile">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>{n.label}</Link>
              ))}
              <Link href="/get-started" className="btn btn-primary">Free case review</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  )
}

export function Footer() {
  const top = PRACTICE_AREAS.filter((p) => p.guide).slice(0, 8)
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p style={{ marginTop: 16, maxWidth: 320 }}>
              A free attorney directory and plain-English legal library for people across the United States.
            </p>
            <Link href="/get-started" className="btn btn-primary btn-sm">Get a free case review</Link>
          </div>
          <div>
            <h4>Practice areas</h4>
            <ul>
              {top.map((p) => (
                <li key={p.slug}><Link href={`/practice-area/${p.slug}`}>{p.name}</Link></li>
              ))}
              <li><Link href="/practice-areas">All practice areas</Link></li>
            </ul>
          </div>
          <div>
            <h4>Top cities</h4>
            <ul>
              {CITIES.slice(0, 8).map((c) => (
                <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}</Link></li>
              ))}
              <li><Link href="/cities">All cities</Link></li>
            </ul>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li><Link href="/guides">Legal guides</Link></li>
              <li><Link href="/questions">Legal questions</Link></li>
              <li><Link href="/glossary">Legal dictionary</Link></li>
              <li><Link href="/emergency">Legal emergency help</Link></li>
              <li><Link href="/blog">Legal news</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/for-attorneys">For attorneys</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <p className="mb-0">
            {SITE.name} is not a law firm, lawyer referral service, or substitute for an attorney. Information on this site is
            general legal information, not legal advice, and using it does not create an attorney-client relationship.
            Attorney listings may be paid advertising; see our <Link href="/disclaimer">disclaimer</Link>.
          </p>
          <p className="mb-0">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
