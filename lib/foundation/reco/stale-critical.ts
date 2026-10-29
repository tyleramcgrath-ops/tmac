// Stale critical recommendations: a critical-severity fix that was accepted
// but never deployed is a real operational risk sitting in plain sight — the
// team agreed it mattered, then it fell through the cracks. Built entirely
// from the recommendation's own real status-transition history; the
// "accepted at" timestamp is the last real transition INTO 'accepted', never
// estimated. A recommendation that was accepted, then reopened, then
// re-accepted uses the most recent acceptance — the current wait, not a
// stale one from months ago.

export interface StaleCriticalInput {
  id: string
  title: string
  status: string
  severity: string
  createdAt: string
  history: { at: string; to: string }[]
}

export interface StaleCriticalRecommendation {
  id: string
  title: string
  acceptedAt: string
  daysStale: number
}

const MIN_DAYS_STALE = 14

function acceptedAtOf(rec: StaleCriticalInput): string {
  const acceptances = rec.history.filter((h) => h.to === 'accepted')
  return acceptances.length > 0 ? acceptances[acceptances.length - 1].at : rec.createdAt
}

export function findStaleCriticalRecommendations(
  recs: StaleCriticalInput[],
  nowMs: number,
  minDaysStale = MIN_DAYS_STALE
): StaleCriticalRecommendation[] {
  const stale: StaleCriticalRecommendation[] = []
  for (const rec of recs) {
    if (rec.status !== 'accepted' || rec.severity !== 'critical') continue
    const acceptedAt = acceptedAtOf(rec)
    const daysStale = (nowMs - Date.parse(acceptedAt)) / (24 * 60 * 60 * 1000)
    if (daysStale >= minDaysStale) {
      stale.push({ id: rec.id, title: rec.title, acceptedAt, daysStale })
    }
  }
  return stale.sort((a, b) => b.daysStale - a.daysStale)
}
