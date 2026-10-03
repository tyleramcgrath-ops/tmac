// Traffic decay: a real, meaningful decline in organic clicks between the
// two halves of the same already-fetched Search Console trend window (the
// last ~30 days) — no new fetch, no persisted history required. Splits the
// series in half by date order and compares total clicks in the recent half
// against the earlier half; flags a decline only when it's both a real drop
// AND large enough to not be ordinary day-to-day noise.

export interface GscDecayPoint {
  date: string
  clicks: number
}

export interface TrafficDecay {
  earlierClicks: number
  recentClicks: number
  changePct: number // negative = decline
}

const MIN_POINTS = 10 // need enough days on both sides to mean anything
const MIN_EARLIER_CLICKS = 10 // a near-zero baseline makes % change meaningless
const MIN_DECLINE_PCT = 20 // ignore ordinary week-to-week noise under this

export function detectTrafficDecay(points: GscDecayPoint[], minDeclinePct = MIN_DECLINE_PCT): TrafficDecay | null {
  if (points.length < MIN_POINTS) return null
  const sorted = points.slice().sort((a, b) => a.date.localeCompare(b.date))
  const mid = Math.floor(sorted.length / 2)
  const earlier = sorted.slice(0, mid)
  const recent = sorted.slice(mid)

  const earlierClicks = earlier.reduce((n, p) => n + p.clicks, 0)
  const recentClicks = recent.reduce((n, p) => n + p.clicks, 0)
  if (earlierClicks <= MIN_EARLIER_CLICKS) return null

  const changePct = ((recentClicks - earlierClicks) / earlierClicks) * 100
  if (changePct > -minDeclinePct) return null

  return { earlierClicks, recentClicks, changePct }
}
