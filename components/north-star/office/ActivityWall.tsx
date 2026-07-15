'use client'

import type { ActivityItem } from '@/lib/north-star-preview-data'

export function ActivityWall({
  activity,
  investigating = false,
  nearingEnd = false,
  onOpen,
}: {
  activity: ActivityItem[]
  investigating?: boolean
  nearingEnd?: boolean
  onOpen: () => void
}) {
  // While a check runs, the wall shows the work happening in the room — not a
  // status list. At rest it reflects the prepared work the office has done.
  const live = [
    { label: 'Scout reviewing evidence', brass: true },
    { label: 'Digital DNA strengthening', brass: true },
    { label: 'Compass reasoning', brass: true },
    { label: nearingEnd ? 'Preparing recommendation' : 'Measurement scheduled', brass: true },
  ]

  const resting = activity.slice(0, 4).map((item) => {
    if (item.status === 'finished') return { label: `${item.label} — done`, green: true }
    if (item.status === 'waiting-approval') return { label: 'Approval package assembled', brass: true }
    if (item.status === 'needs-attention') return { label: `${item.label} — needs attention`, red: true }
    if (item.status === 'waiting') return { label: `${item.label} — watching`, faint: true }
    return { label: `${item.label} — working`, faint: true }
  })

  const rows = investigating ? live : resting

  const dot = (r: { green?: boolean; red?: boolean; brass?: boolean; faint?: boolean }) =>
    r.red ? 'var(--rf-red)' : r.green ? 'var(--rf-green)' : r.brass ? 'var(--office-brass)' : 'var(--rf-faint)'

  return (
    <div className="office-wall office-wall-left" aria-labelledby="activity-wall-heading">
      <h3 id="activity-wall-heading">Work in the room</h3>
      {rows.map((r, i) => (
        <button key={i} className={`office-wall-item${investigating ? ' work-live' : ''}`} data-actionable="true" onClick={onOpen}>
          <span className="office-wall-dot" style={{ background: dot(r) }} />
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  )
}
