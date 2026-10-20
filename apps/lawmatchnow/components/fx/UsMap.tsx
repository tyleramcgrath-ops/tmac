import Link from 'next/link'
import { CITIES, STATES, citiesInState } from '@/lib/geo'
import { CITY_XY, US_BORDERS, US_STATE_PATHS } from '@/lib/us-map'

const LABELLED = new Set(['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'seattle', 'denver', 'atlanta', 'phoenix', 'boston', 'dallas', 'san-francisco', 'minneapolis', 'nashville', 'las-vegas', 'philadelphia'])
// Labels that would sit on top of a neighbour go to the left of their dot.
const LEFT = new Set(['los-angeles', 'boston', 'philadelphia', 'miami', 'houston'])

/** US map: every state links to its state page, every pin to its city page. */
export function UsMap() {
  const byName = new Map(STATES.map((s) => [s.name, s]))
  return (
    <svg className="usmap" viewBox="0 0 975 610" role="img" aria-label="Map of the United States. Choose a state or city to find lawyers there.">
      <g className="usmap-states">
        {US_STATE_PATHS.map(({ name, d }) => {
          const s = byName.get(name)
          if (!s) return <path key={name} d={d} />
          const covered = citiesInState(s.code).length > 0
          return (
            <Link key={name} href={`/state/${s.slug}`} aria-label={`Lawyers in ${s.name}`}>
              <path d={d} className={covered ? 'has-city' : undefined}><title>{s.name}</title></path>
            </Link>
          )
        })}
      </g>
      <path d={US_BORDERS} className="usmap-borders" />
      <g className="usmap-cities">
        {CITIES.filter((c) => CITY_XY[c.slug]).map((c) => {
          const [x, y] = CITY_XY[c.slug]
          const big = LABELLED.has(c.slug)
          const left = LEFT.has(c.slug)
          return (
            <Link key={c.slug} href={`/${c.slug}`} className={`pin${big ? ' big' : ''}`} aria-label={`Lawyers in ${c.name}, ${c.state}`}>
              <circle cx={x} cy={y} r={big ? 9 : 7} className="pin-halo" />
              <circle cx={x} cy={y} r={big ? 4.6 : 3.4} className="pin-dot" />
              <text x={left ? x - 9 : x + 9} y={y + 4} textAnchor={left ? 'end' : 'start'} className="pin-label">{c.name}</text>
            </Link>
          )
        })}
      </g>
    </svg>
  )
}
