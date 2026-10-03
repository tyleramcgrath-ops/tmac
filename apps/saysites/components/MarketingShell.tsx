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
            <a className="hide-sm" href="/websites-for">Who we work with</a>
            <a className="hide-sm" href="/#work">Our work</a>
            <a className="hide-sm" href="/about">Why SaySites</a>
            <a className="hide-sm" href="/redesign">Free redesign</a>
            <a href="/login">Log in</a>
            <a className="b b-dark b-sm" href="/#talk">Let’s talk</a>
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
          <a href="/websites-for">Who we work with</a>
          <a href="/about">Why SaySites</a>
          <a href="/redesign">Free redesign</a>
          <a href="/templates">Our work</a>
          <a href="/connect">Connect</a>
          <a href="/websites-for/law-firms">For law firms</a>
          <a href="/visibility-index">The Index</a>
          <a href="/google-guidelines">Google’s guidelines</a>
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
