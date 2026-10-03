// Traffic-channel concentration risk: when one GA4 channel accounts for the
// overwhelming majority of sessions, the site has a real single-point-of-
// failure — an algorithm update, ad account suspension, or social platform
// policy change could crater total traffic overnight. Built entirely from
// the already-fetched GA4 channel breakdown; nothing here is estimated.

export interface Ga4ChannelSessionsRow {
  channel: string
  sessions: number
}

export interface ChannelConcentration {
  channel: string
  sessions: number
  totalSessions: number
  share: number // 0-1
}

const MIN_TOTAL_SESSIONS = 50 // enough volume for a share to mean anything
const CONCENTRATION_THRESHOLD = 0.7 // flag at 70%+ of sessions from one channel

export function detectChannelConcentration(
  rows: Ga4ChannelSessionsRow[],
  threshold = CONCENTRATION_THRESHOLD
): ChannelConcentration | null {
  const totalSessions = rows.reduce((n, r) => n + r.sessions, 0)
  if (totalSessions < MIN_TOTAL_SESSIONS) return null

  const top = rows.slice().sort((a, b) => b.sessions - a.sessions)[0]
  if (!top) return null

  const share = top.sessions / totalSessions
  if (share < threshold) return null

  return { channel: top.channel, sessions: top.sessions, totalSessions, share }
}
