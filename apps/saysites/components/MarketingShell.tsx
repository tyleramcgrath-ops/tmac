import { Logo } from './Logo'
import { SiteNav } from './SiteNav'

// The nav and footer for saysites.com's inner pages (templates, legal). The
// homepage draws its own nav over the hero photo and shares the footer.
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="home inner">
      <header className="nav solid">
        <div className="wrap">
          <Logo />
          <SiteNav />
        </div>
      </header>
      <main>{children}</main>
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
