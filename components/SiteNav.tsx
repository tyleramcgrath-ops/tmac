// The main menu for saysites.com: the home page (light text over the dark
// hero) and every inner page (MarketingShell, dark text on paper). The
// industries dropdown is a <details>, so it works with no JavaScript.
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

export function SiteNav({ home = false }: { home?: boolean }) {
  return (
    <nav aria-label="Main">
      <details className="ag-menu hide-sm">
        <summary>Who we work with</summary>
        <div>
          {INDUSTRY_LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </div>
      </details>
      <a className="hide-sm" href={home ? '#work' : '/#work'}>Our work</a>
      <a className="hide-sm" href="/about">Why SaySites</a>
      <a className="hide-sm" href="/redesign">Free redesign</a>
      <a href="/login">Log in</a>
      <a className={`b ${home ? 'b-light' : 'b-dark'} b-sm`} href={home ? '#talk' : '/#talk'}>Let’s talk</a>
    </nav>
  )
}
