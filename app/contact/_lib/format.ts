import type { Probe, Sentiment } from './types'

export function timeAgoFromMs(ms: number, now: number = Date.now()): string {
  const mins = Math.round((now - ms) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function sentimentTone(sentiment: Sentiment | undefined): 'win' | 'warn' | 'miss' {
  if (sentiment === 'positive') return 'win'
  if (sentiment === 'neutral') return 'warn'
  return 'miss'
}

export function probeTone(probe: Probe): 'win' | 'warn' | 'miss' {
  if (!probe.mentioned) return 'miss'
  if ((probe.position ?? 9) <= 2 && probe.sentiment === 'positive') return 'win'
  return 'warn'
}

/** "1st", "2nd", "3rd" — used wherever a placement is shown. */
export function ordinal(n: number): string {
  const rem10 = n % 10
  const rem100 = n % 100
  if (rem10 === 1 && rem100 !== 11) return `${n}st`
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`
  return `${n}th`
}
