// A small daily bar chart: one series, one ink, a baseline. The bars are SVG
// (stretched to the card's width); the labels are plain text beneath it, so
// they never stretch. Hovering a day shows its value (each column carries a
// <title>). No client JavaScript.

const W = 600
const H = 120

const short = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function DayBars({ days, values, label, format = (n) => new Intl.NumberFormat('en-US').format(n) }: { days: string[]; values: number[]; label: string; format?: (n: number) => string }) {
  const max = Math.max(0, ...values)
  const n = Math.max(1, values.length)
  const slot = W / n
  const gap = slot > 6 ? 2 : 0
  const bw = Math.max(1, slot - gap)
  const top = 4
  const plotH = H - top
  const peak = values.indexOf(max)
  return (
    <div className="daybars">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}, by day${max ? `; highest ${format(max)} on ${short(days[peak])}` : '; none yet'}`} preserveAspectRatio="none">
        {values.map((v, i) => {
          const h = max ? (v / max) * plotH : 0
          return (
            <g key={days[i]}>
              <rect x={i * slot} y={0} width={slot} height={H} className="db-hit">
                <title>{`${short(days[i])}: ${format(v)}`}</title>
              </rect>
              {v > 0 && <rect x={i * slot + gap / 2} y={H - Math.max(1, h)} width={bw} height={Math.max(1, h)} className="db-bar" />}
            </g>
          )
        })}
        <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} className="db-axis" />
      </svg>
      <div className="db-labels">
        <span>{days.length ? short(days[0]) : ''}</span>
        <span>{max ? `Highest ${format(max)}, ${short(days[peak])}` : 'None yet'}</span>
        <span>{days.length > 1 ? short(days[days.length - 1]) : ''}</span>
      </div>
    </div>
  )
}
