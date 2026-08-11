import type { Person, Urgency } from './types'

const DAY = 86_400_000

/** Whole days between an ISO date and now, floored at 0. */
export function daysSince(iso: string, now: number = Date.now()): number {
  const then = Date.parse(`${iso}T12:00:00Z`)
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((now - then) / DAY))
}

/** "12 days ago", "5 months ago" — short enough for a table cell. */
export function sinceLabel(iso: string, now: number = Date.now()): string {
  const d = daysSince(iso, now)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  const months = Math.round(d / 30.4)
  if (months < 18) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  return `${Math.round(d / 365)} years ago`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * A local, deterministic warmth estimate used for the people table and for
 * the loading skeletons. The AI brief returns its own reasoned warmth score;
 * this is only the at-rest view of a relationship: how recently you spoke,
 * weighted by which circle they sit in.
 */
export function baseWarmth(person: Person, now: number = Date.now()): number {
  const d = daysSince(person.lastContact, now)
  const halfLife = person.circle === 'inner' ? 150 : person.circle === 'active' ? 90 : 60
  const decayed = 100 * Math.pow(0.5, d / halfLife)
  const floor = person.circle === 'inner' ? 22 : person.circle === 'active' ? 12 : 4
  return Math.round(Math.min(99, Math.max(floor, decayed)))
}

export function warmthTone(warmth: number): 'moss' | 'gold' | 'rust' {
  if (warmth >= 66) return 'moss'
  if (warmth >= 33) return 'gold'
  return 'rust'
}

export function warmthWord(warmth: number): string {
  if (warmth >= 80) return 'Alive'
  if (warmth >= 66) return 'Warm'
  if (warmth >= 45) return 'Cooling'
  if (warmth >= 25) return 'Cold'
  return 'Fading'
}

export const URGENCY_TONE: Record<Urgency, 'ember' | 'gold' | 'default'> = {
  now: 'ember',
  'this-week': 'gold',
  soon: 'default',
}

export function shortDate(iso: string): string {
  const t = Date.parse(`${iso}T12:00:00Z`)
  if (Number.isNaN(t)) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(t)
}

export function timeAgoFromMs(ms: number, now: number = Date.now()): string {
  const mins = Math.round((now - ms) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
