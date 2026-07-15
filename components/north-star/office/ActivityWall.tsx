'use client'

import type { ActivityItem } from '@/lib/north-star-preview-data'

export function ActivityWall({ activity, onOpen }: { activity: ActivityItem[]; onOpen: () => void }) {
  const dotColor = (status: ActivityItem['status']) => {
    if (status === 'finished') return 'var(--rf-green)'
    if (status === 'needs-attention') return 'var(--rf-red)'
    if (status === 'waiting-approval') return 'var(--office-brass)'
    if (status === 'checking' || status === 'understanding' || status === 'preparing') return 'var(--office-brass)'
    return 'var(--rf-faint)'
  }

  return (
    <div className="office-wall office-wall-left" aria-labelledby="activity-wall-heading">
      <h3 id="activity-wall-heading">Behind the scenes</h3>
      {activity.slice(0, 4).map((item) => (
        <button key={item.id} className="office-wall-item" data-actionable="true" onClick={onOpen}>
          <span className="office-wall-dot" style={{ background: dotColor(item.status) }} />
          <span>{item.label} — {item.status === 'finished' ? 'finished' : item.status === 'waiting' ? 'waiting' : item.status === 'needs-attention' ? 'needs attention' : item.status === 'waiting-approval' ? 'waiting for approval' : 'working'}</span>
        </button>
      ))}
    </div>
  )
}
