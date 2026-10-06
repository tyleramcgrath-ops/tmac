import { Logo } from './Logo'
import { SiteNav } from './SiteNav'
import { ClosingSay } from './SayBox'

// The nav and footer for saysites.com's inner pages (templates, legal), in
// the homepage's look: a dark nav and dark page hero (home.css, .home.inner),
// and the closing say box before the footer. The homepage draws its own nav
// over the hero photo and shares the footer.
export function MarketingShell({ children, closing = true }: { children: React.ReactNode; closing?: boolean }) {
  return (
    <div className="home inner">
      <header className="nav solid">
        <div className="wrap">
          <Logo />
          <SiteNav light />
        </div>
      </header>
      <main>
        {children}
        {closing && <ClosingSay />}
      </main>
      <SiteFooter />
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <Logo />
        <nav aria-label="Footer">
          <a href="/#sofie">Meet Sofie</a>
          <a href="/templates">Examples</a>
          <a href="/pricing">Pricing</a>
          <a href="/websites-for">Who it’s for</a>
          <a href="/redesign">Free redesign</a>
          <a href="/about">Why SaySites</a>
          <a href="/#talk">Let’s talk</a>
          <a href="/connect">Connect</a>
          <a href="/websites-for/law-firms">For law firms</a>
          <a href="/visibility-index">The Index</a>
          <a href="/google-guidelines">Google’s guidelines</a>
          <a href="/blog">Blog</a>
          <a href="/#faq">FAQ</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/login">Log in</a>
        </nav>
        <span>© {new Date().getFullYear()} SaySites</span>
      </div>
    </footer>
  )
}
