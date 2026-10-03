// The monthly results email: on the 1st, each owner gets last month in one
// page (leads, calls, visitors, how fast they answered, clients won, where
// leads came from, SEO score and tracked searches). Every number comes from
// what SaySites recorded; a month with nothing to report isn't sent.

import { DIRECT } from './lead-source'
import type { CrmState } from './leads'
import type { Site } from './schema'
import { loadSeoState } from './seo-intel'
import type { Store } from './store'
import { liveUrl } from './urls'

export interface MonthReport {
  month: string
  label: string
  leads: number
  calls: number
  visitors: number
  responseMins: number | null
  won: number
  booked: number
  sources: [string, number][]
  seoScore: number | null
  keywords: { keyword: string; position: number | null }[]
  topPages: [string, number][]
}

export const monthLabel = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function previousMonth(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return d.toISOString().slice(0, 7)
}

const nextMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7)
}

const inMonth = (iso: string | undefined, month: string) => !!iso && iso.slice(0, 7) === month

export async function buildReport(store: Store, site: Site, state: CrmState, month: string): Promise<MonthReport> {
  const start = `${month}-01`
  const end = `${nextMonth(month)}-01`
  const [messages, visits, seo] = await Promise.all([store.messagesForSite(site.id, 1000), store.visitsSince(site.id, start), loadSeoState(store, site.id)])
  const leads = messages.filter((m) => inMonth(m.createdAt, month))
  const days = visits.filter((v) => v.day >= start && v.day < end)
  const calls = days.filter((v) => v.path === '#call').reduce((n, v) => n + v.views, 0)
  const pages = new Map<string, number>()
  for (const v of days) if (!v.path.startsWith('#')) pages.set(v.path, (pages.get(v.path) ?? 0) + v.views)
  const metas = Object.values(state.leads)
  const waits = leads
    .map((m) => state.leads[m.id]?.contactedAt)
    .map((c, i) => (c ? (Date.parse(c) - Date.parse(leads[i].createdAt)) / 60_000 : null))
    .filter((x): x is number => x !== null)
    .sort((a, b) => a - b)
  const sources = new Map<string, number>()
  for (const m of leads) {
    const label = state.leads[m.id]?.source?.label ?? DIRECT
    sources.set(label, (sources.get(label) ?? 0) + 1)
  }
  return {
    month,
    label: monthLabel(month),
    leads: leads.length,
    calls,
    visitors: [...pages.values()].reduce((a, b) => a + b, 0),
    responseMins: waits.length ? Math.max(0, Math.round(waits[Math.floor(waits.length / 2)])) : null,
    won: metas.filter((x) => inMonth(x.wonAt, month)).length,
    booked: leads.filter((m) => state.leads[m.id]?.stage === 'booked').length,
    sources: [...sources].sort((a, b) => b[1] - a[1]),
    seoScore: seo.audit?.siteScore ?? null,
    keywords: seo.keywords.map((k) => ({ keyword: k.keyword, position: k.checks.at(-1)?.position ?? null })).filter((k, i) => i < 5),
    topPages: [...pages].sort((a, b) => b[1] - a[1]).slice(0, 3),
  }
}

export const reportHasNews = (r: MonthReport) => r.leads > 0 || r.calls > 0 || r.visitors > 0

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const wait = (mins: number) => (mins < 60 ? `${mins} minutes` : mins < 48 * 60 ? `${Math.round(mins / 60)} hours` : `${Math.round(mins / 1440)} days`)

export function reportText(site: Site, r: MonthReport): string {
  const lines = [
    `${site.business.name}: your website in ${r.label}`,
    '',
    `Leads: ${r.leads}`,
    `Phone taps: ${r.calls}`,
    `Page views: ${r.visitors}`,
  ]
  if (r.responseMins !== null) lines.push(`Typical time to answer a lead: ${wait(r.responseMins)}`)
  if (r.won) lines.push(`New clients marked won: ${r.won}`)
  if (r.sources.length) lines.push('', 'Where leads came from:', ...r.sources.map(([k, n]) => `  ${k}: ${n}`))
  if (r.topPages.length) lines.push('', 'Most-read pages:', ...r.topPages.map(([p, n]) => `  ${p === '/' ? 'Home' : p}: ${plural(n, 'view')}`))
  if (r.seoScore !== null) lines.push('', `SEO score: ${r.seoScore} out of 100`)
  if (r.keywords.length) lines.push('', 'Your Google searches:', ...r.keywords.map((k) => `  ${k.keyword}: ${k.position ? `position ${k.position}` : 'not in the top 100 yet'}`))
  lines.push('', `See every lead: https://saysites.com/dashboard/sites/${site.id}/leads`, `Your website: ${liveUrl(site)}`, '', 'You get this on the 1st of each month. Turn it off under Leads, then Automations.')
  return lines.join('\n')
}
