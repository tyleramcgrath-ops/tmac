import Link from 'next/link'
import { CITIES, STATES, citiesInState } from '@/lib/geo'
import { CITY_XY, US_BORDERS, US_STATE_PATHS } from '@/lib/us-map'

const LABELLED = new Set(['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'seattle', 'denver', 'atlanta', 'phoenix', 'boston', 'dallas', 'san-francisco', 'minneapolis', 'nashville', 'las-vegas', 'philadelphia'])
// Labels that would sit on top of a neighbour go to the left of their dot.
const LEFT = new Set(['los-angeles', 'boston', 'philadelphia', 'miami', 'houston'])

/**
 * US map: every state links to its state page, every pin to its city page.
 * `practice` sends pins to that city's practice page instead; `highlight`
 * marks one city (and its state) and labels only it.
 */
export function UsMap({ practice, highlight }: { practice?: string; highlight?: string }) {
  const byName = new Map(STATES.map((s) => [s.name, s]))
  const hiCity = highlight ? CITIES.find((c) => c.slug === highlight) : undefined
  return (
    <svg className={`usmap${hiCity ? ' focus' : ''}`} viewBox="0 0 975 610" role="img" aria-label="Map of the United States. Choose a state or city to find lawyers there.">
      <g className="usmap-states">
        {US_STATE_PATHS.map(({ name, d }) => {
          const s = byName.get(name)
          if (!s) return <path key={name} d={d} />
          const cls = [citiesInState(s.code).length > 0 ? 'has-city' : '', hiCity?.state === s.code ? 'hi' : ''].filter(Boolean).join(' ')
          return (
            <Link key={name} href={`/state/${s.slug}`} aria-label={`Lawyers in ${s.name}`}>
              <path d={d} className={cls || undefined}><title>{s.name}</title></path>
            </Link>
          )
        })}
      </g>
      <path d={US_BORDERS} className="usmap-borders" />
      <g className="usmap-cities">
        {CITIES.filter((c) => CITY_XY[c.slug]).map((c) => {
          const [x, y] = CITY_XY[c.slug]
          const isHi = c.slug === highlight
          const big = isHi || (!hiCity && LABELLED.has(c.slug))
          const left = LEFT.has(c.slug)
          return (
            <Link key={c.slug} href={practice ? `/${c.slug}/${practice}` : `/${c.slug}`} className={`pin${big ? ' big' : ''}${isHi ? ' hi' : ''}`} aria-label={`Lawyers in ${c.name}, ${c.state}`}>
              {isHi && <circle cx={x} cy={y} r={14} className="pin-pulse" />}
              <circle cx={x} cy={y} r={big ? 9 : 7} className="pin-halo" />
              <circle cx={x} cy={y} r={isHi ? 6 : big ? 4.6 : 3.4} className="pin-dot" />
              <text x={left ? x - 10 : x + 10} y={y + 4} textAnchor={left ? 'end' : 'start'} className="pin-label">{c.name}</text>
            </Link>
          )
        })}
      </g>
    </svg>
  )
}
