// The Visibility Score as a ticker: today's number, the move over the last
// seven days, and a line of the last thirty. Green when it's rising.

export function ScoreTicker({ history, score, label }: { history: { day: string; score: number }[]; score: number; label: string }) {
  const days = [...history].sort((a, b) => a.day.localeCompare(b.day)).slice(-30)
  if (days.length < 2) return null
  const weekAgo = days.length > 7 ? days[days.length - 8].score : days[0].score
  const move = score - weekAgo
  const lo = Math.min(...days.map((d) => d.score)) - 2
  const hi = Math.max(...days.map((d) => d.score)) + 2
  const x = (i: number) => (i / (days.length - 1)) * 100
  const y = (v: number) => 30 - ((v - lo) / Math.max(1, hi - lo)) * 28
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.score).toFixed(1)}`).join(' ')
  const dir = move > 0 ? 'up' : move < 0 ? 'down' : 'flat'
  return (
    <div className={`ticker is-${dir}`}>
      <div className="ticker-top">
        <span className="stat-label">{label}</span>
        <span className="ticker-move">{move > 0 ? '▲' : move < 0 ? '▼' : '—'} {Math.abs(move)} <small>7 days</small></span>
      </div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${line} L100 32 L0 32 Z`} className="ticker-fill" />
        <path d={line} className="ticker-line" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
