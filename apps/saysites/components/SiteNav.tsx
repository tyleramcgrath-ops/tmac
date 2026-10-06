// The main menu for saysites.com: the home page (light text over the dark
// hero) and every inner page (MarketingShell, dark text on paper). Sofie and
// self-serve sign-up lead; the industries dropdown is a <details>, so it
// works with no JavaScript.
export const INDUSTRY_LINKS: [string, string][] = [
  ['Law firms', '/websites-for/law-firms'],
  ['Medical practices', '/websites-for/medical-practices'],
  ['Med spas', '/websites-for/med-spas'],
  ['Dental practices', '/websites-for/dentists'],
  ['Plumbers', '/websites-for/plumbers'],
  ['Heating and air', '/websites-for/hvac-companies'],
  ['Roofers', '/websites-for/roofers'],
  ['Electricians', '/websites-for/electricians'],
  ['Every industry', '/websites-for'],
]

export function SiteNav({ home = false, light = false }: { home?: boolean; light?: boolean }) {
  return (
    <nav aria-label="Main">
      <a className="hide-sm" href={home ? '#sofie' : '/#sofie'}>Meet Sofie</a>
      <a className="hide-sm" href="/templates">Examples</a>
      <a className="hide-sm" href="/pricing">Pricing</a>
      <details className="ag-menu hide-sm">
        <summary>Who it’s for</summary>
        <div>
          {INDUSTRY_LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </div>
      </details>
      <a className="hide-sm" href="/blog">Blog</a>
      <a href="/login">Log in</a>
      <a className={`b ${home || light ? 'b-light' : 'b-dark'} b-sm`} href="/signup">Start free</a>
    </nav>
  )
}
