// Sums up page-view counts for the dashboard.

import type { Visit } from './store'

export interface VisitSummary {
  // One entry per day, oldest first, including days with no views.
  days: { day: string; views: number }[]
  total: number
  // The same number of days just before, for "up 20%".
  previous: number
  today: number
  pages: { path: string; views: number }[]
}

export function dayString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function daysBefore(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return dayString(d)
}

// `visits` should reach back 2 * span days so the comparison has data.
export function summarizeVisits(visits: readonly Visit[], today: string, span = 30): VisitSummary {
  const start = daysBefore(today, span - 1)
  const prevStart = daysBefore(today, span * 2 - 1)
  const perDay = new Map<string, number>()
  const perPage = new Map<string, number>()
  let previous = 0
  for (const v of visits) {
    if (v.day > today) continue
    if (v.day >= start) {
      perDay.set(v.day, (perDay.get(v.day) ?? 0) + v.views)
      perPage.set(v.path, (perPage.get(v.path) ?? 0) + v.views)
    } else if (v.day >= prevStart) {
      previous += v.views
    }
  }
  const days = Array.from({ length: span }, (_, i) => {
    const day = daysBefore(today, span - 1 - i)
    return { day, views: perDay.get(day) ?? 0 }
  })
  const pages = [...perPage].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
  return { days, total: days.reduce((n, d) => n + d.views, 0), previous, today: perDay.get(today) ?? 0, pages }
}

// "Up 24%" / "Down 8%" / "" when there's nothing to compare with.
export function changeLabel(now: number, before: number): string {
  if (!before) return ''
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return 'Same as the 30 days before'
  return `${pct > 0 ? 'Up' : 'Down'} ${Math.abs(pct)}% on the 30 days before`
}
