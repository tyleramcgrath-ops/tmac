// Weekly standings: every site on SaySites is grouped with others in its
// trade and ranked each week by momentum (how much its Visibility Score rose
// and how much its traffic grew), not by size, so a small practice that does
// the work can outrank a large one. Comparison is reciprocal: only owners who
// share their own standing see the others, and visitor numbers are never
// shown to anyone.

import { daysBefore } from './visits'
import type { Site } from './schema'

export interface LeagueSite {
  site: Site
  // Daily Visibility Score snapshots, any order.
  scores: { day: string; score: number }[]
  // Page views per day, any order.
  visits: { day: string; views: number }[]
}

export interface Standing {
  siteId: string
  rank: number
  // The name shown to other owners: the business name only if public.
  label: string
  isPublic: boolean
  score: number
  gain: number
  growth: number
  momentum: number
  titles: string[]
  streak: number
}

export interface League {
  // e.g. "Bakery"; "All trades" when a trade is too small to stand alone.
  name: string
  trade: string | null
  week: { start: string; end: string }
  standings: Standing[]
}

// With fewer sites than this in a trade, it joins the all-trades standings.
export const MIN_LEAGUE = 5

// Monday (UTC) of the week `day` is in.
export function weekStart(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay()
  return daysBefore(day, (dow + 6) % 7)
}

export function tradeLabel(schemaType: string): string {
  return schemaType === 'LocalBusiness' ? 'Local business' : schemaType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^(.)(.*)$/, (_, a: string, b: string) => a + b.toLowerCase())
}

function plural(label: string): string {
  const l = label.toLowerCase()
  if (/(s|x|ch|sh)$/.test(l)) return `${l}es`
  if (/[^aeiou]y$/.test(l)) return `${l.slice(0, -1)}ies`
  return `${l}s`
}
export const tradePlural = (schemaType: string) => plural(tradeLabel(schemaType))

// The score a site held at the end of `day`: its latest snapshot on or before it.
function scoreAt(scores: LeagueSite['scores'], day: string): number | null {
  let best: { day: string; score: number } | null = null
  for (const s of scores) if (s.day <= day && (!best || s.day > best.day)) best = s
  return best?.score ?? null
}

function views(visits: LeagueSite['visits'], from: string, to: string): number {
  return visits.reduce((n, v) => (v.day >= from && v.day <= to ? n + v.views : n), 0)
}

// Momentum for one site over the week starting `start`, up to `upTo`.
export function momentum(s: LeagueSite, start: string, upTo: string) {
  const end = daysBefore(start, -6) < upTo ? daysBefore(start, -6) : upTo
  const before = scoreAt(s.scores, daysBefore(start, 1))
  // A site that joined this week starts from its first score, so it only
  // earns what it improves after joining.
  const first = [...s.scores].filter((x) => x.day >= start && x.day <= end).sort((a, b) => a.day.localeCompare(b.day))[0]
  const from = before ?? first?.score ?? null
  const now = scoreAt(s.scores, end)
  const gain = from === null || now === null ? 0 : Math.max(0, now - from)
  const thisWeek = views(s.visits, start, end)
  const lastWeek = views(s.visits, daysBefore(start, 7), daysBefore(start, 1))
  // Doubling visits is worth 10, the same as 5 Visibility points. Capped so
  // one viral day can't decide a league.
  const growth = thisWeek === 0 ? 0 : Math.min(20, Math.max(0, Math.round(10 * Math.log2((thisWeek + 1) / (lastWeek + 1)))))
  return { score: now ?? 0, gain, growth, momentum: gain * 2 + growth, active: now !== null }
}

function display(site: Site): { label: string; isPublic: boolean } {
  if (site.league?.public) return { label: site.business.name, isPublic: true }
  const where = site.business.address?.city ?? site.business.area?.split(',')[0].trim()
  const t = tradeLabel(site.business.schemaType).toLowerCase()
  return { label: `A ${t}${where ? ` in ${where}` : ''}`, isPublic: false }
}

// Weeks in a row, ending with the week before `start`, that the site gained momentum.
function streak(s: LeagueSite, start: string, upTo: string): number {
  let n = 0
  for (let w = 1; w <= 12; w++) {
    const ws = daysBefore(start, 7 * w)
    if (momentum(s, ws, upTo).momentum > 0) n++
    else break
  }
  // This week counts too once it has something on the board.
  return momentum(s, start, upTo).momentum > 0 ? n + 1 : n
}

// Every league for the week starting `start`, as of `today`.
export function leagues(all: LeagueSite[], start: string, today: string): League[] {
  const week = { start, end: daysBefore(start, -6) }
  const rows = all
    .map((s) => ({ s, m: momentum(s, start, today) }))
    .filter((r) => r.m.active)
  const byTrade = new Map<string, typeof rows>()
  for (const r of rows) {
    const t = r.s.site.business.schemaType
    byTrade.set(t, [...(byTrade.get(t) ?? []), r])
  }
  const open: typeof rows = []
  const out: League[] = []
  const build = (name: string, trade: string | null, members: typeof rows): League => {
    const sorted = [...members].sort((a, b) => b.m.momentum - a.m.momentum || b.m.score - a.m.score || a.s.site.business.name.localeCompare(b.s.site.business.name))
    const topScore = Math.max(...sorted.map((r) => r.m.score))
    const topGrowth = Math.max(...sorted.map((r) => r.m.growth))
    const standings = sorted.map((r, i): Standing => {
      const titles: string[] = []
      if (i === 0 && r.m.momentum > 0) titles.push('Greatest gain')
      if (r.m.score === topScore && sorted.length > 1) titles.push('Highest visibility')
      if (r.m.growth === topGrowth && topGrowth > 0) titles.push('Fastest growth')
      return { siteId: r.s.site.id, rank: i + 1, ...display(r.s.site), score: r.m.score, gain: r.m.gain, growth: r.m.growth, momentum: r.m.momentum, titles, streak: streak(r.s, start, today) }
    })
    // Ties share a rank.
    for (let i = 1; i < standings.length; i++) {
      if (standings[i].momentum === standings[i - 1].momentum && standings[i].score === standings[i - 1].score) standings[i].rank = standings[i - 1].rank
    }
    return { name, trade, week, standings }
  }
  for (const [trade, members] of byTrade) {
    if (members.length >= MIN_LEAGUE && trade !== 'LocalBusiness') out.push(build(tradeLabel(trade), trade, members))
    else open.push(...members)
  }
  if (open.length) out.push(build('All trades', null, open))
  return out.sort((a, b) => b.standings.length - a.standings.length)
}

export function leagueFor(all: League[], siteId: string): { league: League; me: Standing } | null {
  for (const league of all) {
    const me = league.standings.find((s) => s.siteId === siteId)
    if (me) return { league, me }
  }
  return null
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return `${n}${s}`
}

// How far the site is from the place above, in Visibility points: each
// point of score is worth 2 momentum, so a quest worth more than half the
// gap moves you up.
export function pointsToClimb(league: League, me: Standing): number | null {
  const above = [...league.standings].reverse().find((s) => s.rank < me.rank)
  if (!above) return null
  return Math.floor((above.momentum - me.momentum) / 2) + 1
}
