import Link from 'next/link'
import { CITIES, CITY_COORDS } from '@/lib/geo'

// A constellation of the city hubs we cover: each dot links to its city page.
// Projected onto a simple equirectangular grid; Honolulu sits in an inset.
const W = 1000
const H = 560
const project = ([lat, lng]: [number, number], slug: string) =>
  slug === 'honolulu' ? { x: 120, y: 500 } : { x: 40 + ((lng + 125) / 59) * 920, y: 30 + ((50 - lat) / 26) * 470 }

const BIG = new Set(['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'seattle', 'denver', 'atlanta', 'phoenix', 'boston', 'dallas', 'san-francisco'])

export function CityMap() {
  const pts = CITIES.filter((c) => CITY_COORDS[c.slug]).map((c) => ({ ...c, ...project(CITY_COORDS[c.slug], c.slug) }))
  const links = new Set<string>()
  const lines: [typeof pts[number], typeof pts[number]][] = []
  for (const p of pts) {
    if (p.slug === 'honolulu') continue
    const near = pts
      .filter((q) => q.slug !== p.slug && q.slug !== 'honolulu')
      .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    for (const { q, d } of near) {
      const key = [p.slug, q.slug].sort().join('|')
      if (d < 210 && !links.has(key)) { links.add(key); lines.push([p, q]) }
    }
  }
  return (
    <svg className="citymap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of the ${pts.length} cities with LawMatchNow city guides`}>
      <defs>
        <pattern id="dotgrid" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(201,167,107,0.16)" />
        </pattern>
        <radialGradient id="glow"><stop offset="0" stopColor="#e9cf9c" /><stop offset="1" stopColor="#c9a76b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#dotgrid)" rx="24" />
      <g className="citymap-lines">
        {lines.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ animationDelay: `${(i % 12) * 0.35}s` }} />
        ))}
      </g>
      <rect x="40" y="455" width="170" height="80" rx="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 6" />
      <text x="56" y="477" className="citymap-inset">HAWAII</text>
      {pts.map((p, i) => (
        <Link key={p.slug} href={`/${p.slug}`} className="citymap-city" aria-label={`Lawyers in ${p.name}, ${p.state}`}>
          <circle cx={p.x} cy={p.y} r={BIG.has(p.slug) ? 16 : 11} fill="url(#glow)" className="pulse" style={{ animationDelay: `${(i % 9) * 0.4}s` }} />
          <circle cx={p.x} cy={p.y} r={BIG.has(p.slug) ? 4.5 : 3.2} className="dot" />
          <text x={p.x + 9} y={p.y - 8} className={BIG.has(p.slug) ? 'lbl big' : 'lbl'}>{p.name}</text>
        </Link>
      ))}
    </svg>
  )
}
