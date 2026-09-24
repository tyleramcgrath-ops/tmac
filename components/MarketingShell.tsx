import { Logo } from './Logo'

// The nav and footer for saysites.com's inner pages (templates, legal). The
// homepage draws its own nav over the hero photo.
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="home inner">
      <header className="nav solid">
        <div className="wrap">
          <Logo />
          <nav aria-label="Main">
            <a className="hide-sm" href="/#how">How it works</a>
            <a className="hide-sm" href="/templates">Templates</a>
            <a className="hide-sm" href="/#pricing">Pricing</a>
            <a href="/login">Log in</a>
            <a className="b b-dark b-sm" href="/signup">Start free</a>
          </nav>
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
          <a href="/templates">Templates</a>
          <a href="/#pricing">Pricing</a>
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
