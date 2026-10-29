// The owner's analytics (/dashboard/analytics, admins only): everything
// SaySites already records, in one place. Only real numbers: nothing is
// estimated or invented. Visitors to saysites.com itself are counted by
// Google Analytics, not here, so the page links there instead.

import { PRICES, type Billing, type Interval, type Plan } from './billing'

export type Metric = 'signups' | 'sites' | 'leads' | 'views' | 'calls' | 'previews' | 'talks' | 'aiMicros'
export type DayRow = { day: string } & Record<Metric, number>

export interface AnalyticsRaw {
  // Per day, only days with something in them.
  daily: ({ day: string } & Partial<Record<Metric, number>>)[]
  // Every account's billing record.
  billing: Billing[]
  totals: { users: number; sites: number; customDomains: number; members: number }
  // Sites with the most results in the range.
  topSites: { id: string; name: string; subdomain: string; views: number; leads: number; calls: number }[]
}

export const METRICS: Metric[] = ['signups', 'sites', 'leads', 'views', 'calls', 'previews', 'talks', 'aiMicros']

export function dayList(since: string, until: string): string[] {
  const out: string[] = []
  for (let t = Date.parse(`${since}T00:00:00Z`); t <= Date.parse(`${until}T00:00:00Z`); t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

// Every day in the range, zeros where nothing happened.
export function fillDays(raw: AnalyticsRaw['daily'], since: string, until: string): DayRow[] {
  const by = new Map(raw.map((r) => [r.day, r]))
  return dayList(since, until).map((day) => {
    const r = by.get(day) ?? {}
    return Object.fromEntries([['day', day], ...METRICS.map((m) => [m, (r as Partial<Record<Metric, number>>)[m] ?? 0])]) as DayRow
  })
}

export const sum = (rows: DayRow[], m: Metric) => rows.reduce((n, r) => n + r[m], 0)

// Subscriptions by plan, and monthly recurring revenue from list prices
// (yearly plans count as a twelfth). Comped and trial accounts pay nothing.
export function revenue(bills: Billing[]) {
  const paying = bills.filter((b) => b.status === 'active' || b.status === 'past_due')
  const plans = new Map<string, { plan: string; interval: string; count: number; mrr: number }>()
  let mrr = 0
  for (const b of paying) {
    const plan: Plan = b.plan ?? 'site'
    const interval: Interval = b.interval ?? 'month'
    const price = PRICES[plan]?.[interval] ?? 0
    const monthly = interval === 'year' ? price / 12 : price
    mrr += monthly
    const k = `${plan}|${interval}`
    const row = plans.get(k) ?? { plan, interval, count: 0, mrr: 0 }
    row.count++
    row.mrr += monthly
    plans.set(k, row)
  }
  const count = (s: string) => bills.filter((b) => b.status === s).length
  return {
    mrr: Math.round(mrr * 100) / 100,
    paying: paying.length,
    trial: count('trial'),
    pastDue: count('past_due'),
    canceled: count('canceled'),
    comp: count('comp'),
    plans: [...plans.values()].sort((a, b) => b.mrr - a.mrr),
  }
}
