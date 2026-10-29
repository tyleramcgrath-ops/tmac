// The team's directory (admin only, /dashboard/directory): every account and
// every site, who made it, where the business is, how it started, and what
// it has done since. Each row gets a "next step" so the team knows who to
// talk to first: a trial about to end, a site that was never published, a
// paying customer whose site brings in leads (a case study to ask for).
//
// The store gathers the raw numbers (Store.directory); everything here is
// pure, so it is the same with Postgres and in tests.

import { BUSINESS_TYPES } from './starter'
import { PLAN_NAMES, accessFor, type Billing } from './billing'
import type { Site } from './schema'

export interface DirectoryUser {
  id: string
  email: string
  name: string
  createdAt: string
  billing: Billing | null
}

export interface DirectorySite {
  id: string
  ownerId: string
  createdAt: string
  updatedAt: string
  site: Site
  pages: number
  published: number
  // In the chosen range: page views, taps on the phone number, form leads.
  views: number
  calls: number
  leads: number
  leadsAll: number
  lastLead?: string
  lastView?: string
  // Sofie: all-time spend (millionths of a dollar), chats, and last day used.
  aiMicros: number
  chats: number
  lastSofie?: string
  members: number
}

export interface DirectoryRaw {
  users: DirectoryUser[]
  sites: DirectorySite[]
}

export const STARTED_VIA = {
  questions: 'Answered the questions',
  google: 'From their Google listing',
  redesign: 'Redesign of their old site',
  outreach: 'From our outreach email',
  team: 'Built by the team',
  template: 'Picked a design',
} as const
export type StartedVia = keyof typeof STARTED_VIA

// Sites made before startedVia was recorded: worked out from what they kept.
export function startedVia(site: Site): StartedVia {
  if (site.startedVia) return site.startedVia
  if (site.handoff) return 'team'
  if (site.ownership) return 'redesign'
  if (site.business.reviewUrl?.includes('placeid=')) return 'google'
  return 'questions'
}

export const NEXT = {
  failed: 'Payment failed: help them fix the card',
  ending: 'Trial ends soon: offer help to finish',
  ended: 'Trial ended, not paying: win back',
  unpublished: 'Nothing published: offer to finish it',
  proof: 'Waiting to prove ownership: nudge',
  quiet: 'No visits yet: help them share it',
  star: 'Getting leads: ask for a review or case study',
  nosite: 'Signed up, no site: offer to build it',
  canceled: 'Canceled: ask why',
  fine: 'All good',
} as const
export type Next = keyof typeof NEXT

export interface DirectoryRow {
  siteId: string
  business: string
  type: string
  city: string
  state: string
  phone: string
  businessEmail: string
  address: string
  createdAt: string
  updatedAt: string
  startedVia: StartedVia
  language: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  signedUp: string
  plan: string
  status: string
  trialDaysLeft: number | null
  promo: string
  pages: number
  published: number
  views: number
  calls: number
  leads: number
  leadsAll: number
  lastLead: string
  lastView: string
  sofieSpend: number
  sofieChats: number
  lastSofie: string
  staff: number
  ownership: string
  next: Next
  // Higher first: who the team should look at today.
  priority: number
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(Object.values(BUSINESS_TYPES).map((t) => [t.schemaType, t.label]))
export const typeLabel = (schemaType: string) => TYPE_LABEL[schemaType] ?? schemaType.replace(/([a-z])([A-Z])/g, '$1 $2')

// "Rivertown, OH" (the starter's area) or the full address.
export function placeOf(site: Site): { city: string; state: string } {
  const a = site.business.address
  if (a) return { city: a.city, state: a.region.toUpperCase().slice(0, 20) }
  const area = site.business.area ?? ''
  const i = area.lastIndexOf(',')
  return i > 0 ? { city: area.slice(0, i).trim(), state: area.slice(i + 1).trim().toUpperCase() } : { city: area.trim(), state: '' }
}

const STATUS: Record<string, string> = { trial: 'Free trial', active: 'Paying', past_due: 'Payment failed', canceled: 'Canceled', comp: 'Comped' }

function account(u: DirectoryUser, now: number) {
  const a = accessFor({ ...u, passwordHash: '' }, u.billing, now)
  const ended = a.status === 'trial' && a.daysLeft === 0
  return {
    plan: u.billing?.plan ? `${PLAN_NAMES[u.billing.plan]}${u.billing.interval === 'year' ? ', yearly' : ''}` : '',
    status: ended ? 'Trial ended' : STATUS[a.status] ?? a.status,
    trialDaysLeft: a.status === 'trial' ? a.daysLeft : null,
    promo: u.billing?.promo ?? '',
    a,
    ended,
  }
}

function nextFor(acct: ReturnType<typeof account>, s?: DirectorySite): { next: Next; priority: number } {
  const st = acct.a.status
  if (st === 'past_due') return { next: 'failed', priority: 100 }
  if (st === 'trial' && !acct.ended && acct.a.daysLeft <= 3) return { next: 'ending', priority: 90 + (3 - acct.a.daysLeft) }
  if (acct.ended) return { next: 'ended', priority: 70 }
  if (st === 'canceled') return { next: 'canceled', priority: 40 }
  if (!s) return { next: 'nosite', priority: 60 }
  if (s.site.ownership && !s.site.ownership.verified) return { next: 'proof', priority: 65 }
  if (s.published === 0) return { next: 'unpublished', priority: 55 }
  if (s.leads > 0 || s.calls > 0) return { next: 'star', priority: 50 + Math.min(9, s.leads + s.calls) }
  if (s.views === 0) return { next: 'quiet', priority: 45 }
  return { next: 'fine', priority: 0 }
}

export function directoryRows(raw: DirectoryRaw, now = Date.now()): { sites: DirectoryRow[]; noSite: (DirectoryUser & { status: string; trialDaysLeft: number | null; promo: string; next: Next; priority: number })[] } {
  const users = new Map(raw.users.map((u) => [u.id, u]))
  const withSites = new Set(raw.sites.map((s) => s.ownerId))
  const sites = raw.sites.map((s): DirectoryRow => {
    const u = users.get(s.ownerId) ?? { id: s.ownerId, email: '', name: '(no account)', createdAt: s.createdAt, billing: null }
    const acct = account(u, now)
    const b = s.site.business
    const { city, state } = placeOf(s.site)
    const a = b.address
    const own = s.site.ownership
    return {
      siteId: s.id,
      business: b.name,
      type: typeLabel(b.schemaType),
      city,
      state,
      phone: b.phone ?? '',
      businessEmail: b.email ?? '',
      address: a ? `${a.street}, ${a.city}, ${a.region} ${a.postalCode}` : '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      startedVia: startedVia(s.site),
      language: s.site.language,
      ownerId: u.id,
      ownerName: u.name,
      ownerEmail: u.email,
      signedUp: u.createdAt,
      plan: acct.plan,
      status: acct.status,
      trialDaysLeft: acct.trialDaysLeft,
      promo: acct.promo,
      pages: s.pages,
      published: s.published,
      views: s.views,
      calls: s.calls,
      leads: s.leads,
      leadsAll: s.leadsAll,
      lastLead: s.lastLead ?? '',
      lastView: s.lastView ?? '',
      sofieSpend: Math.round(s.aiMicros / 10_000) / 100,
      sofieChats: s.chats,
      lastSofie: s.lastSofie ?? '',
      staff: s.members,
      ownership: own ? (own.verified ? `Proved${own.how ? ` (${own.how})` : ''}` : 'Not proved yet') : '',
      ...nextFor(acct, s),
    }
  })
  const noSite = raw.users
    .filter((u) => !withSites.has(u.id))
    .map((u) => {
      const acct = account(u, now)
      return { ...u, status: acct.status, trialDaysLeft: acct.trialDaysLeft, promo: acct.promo, ...nextFor(acct) }
    })
  return { sites, noSite }
}

export interface DirectoryFilter {
  q?: string
  type?: string
  state?: string
  via?: string
  next?: string
  status?: string
}

export function filterRows(rows: DirectoryRow[], f: DirectoryFilter): DirectoryRow[] {
  const q = f.q?.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (!f.type || r.type === f.type) &&
      (!f.state || r.state === f.state) &&
      (!f.via || r.startedVia === f.via) &&
      (!f.next || r.next === f.next) &&
      (!f.status || r.status === f.status) &&
      (!q || [r.business, r.ownerName, r.ownerEmail, r.businessEmail, r.city, r.phone, r.type].some((x) => x.toLowerCase().includes(q))),
  )
}

// Tallies for the top of the page, most first.
export function tally<T>(rows: T[], key: (r: T) => string): { key: string; n: number }[] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = key(r)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m].map(([k, n]) => ({ key: k, n })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key))
}

// Spreadsheet-safe: a leading = + - @ becomes text.
export function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function directoryCsv(rows: (DirectoryRow & { web: string })[]): string {
  const cols: [string, (r: DirectoryRow & { web: string }) => string | number | null][] = [
    ['business', (r) => r.business],
    ['type', (r) => r.type],
    ['city', (r) => r.city],
    ['state', (r) => r.state],
    ['address', (r) => r.address],
    ['business_phone', (r) => r.phone],
    ['business_email', (r) => r.businessEmail],
    ['website', (r) => r.web],
    ['site_created', (r) => r.createdAt.slice(0, 10)],
    ['last_edited', (r) => r.updatedAt.slice(0, 10)],
    ['started_via', (r) => STARTED_VIA[r.startedVia]],
    ['language', (r) => r.language],
    ['owner_name', (r) => r.ownerName],
    ['owner_email', (r) => r.ownerEmail],
    ['signed_up', (r) => r.signedUp.slice(0, 10)],
    ['status', (r) => r.status],
    ['plan', (r) => r.plan],
    ['trial_days_left', (r) => r.trialDaysLeft],
    ['promo', (r) => r.promo],
    ['pages', (r) => r.pages],
    ['published_pages', (r) => r.published],
    ['views', (r) => r.views],
    ['calls', (r) => r.calls],
    ['leads', (r) => r.leads],
    ['leads_all_time', (r) => r.leadsAll],
    ['last_lead', (r) => r.lastLead.slice(0, 10)],
    ['last_visit', (r) => r.lastView.slice(0, 10)],
    ['sofie_spend_usd', (r) => r.sofieSpend.toFixed(2)],
    ['sofie_chats', (r) => r.sofieChats],
    ['last_sofie', (r) => r.lastSofie.slice(0, 10)],
    ['staff', (r) => r.staff],
    ['ownership', (r) => r.ownership],
    ['next_step', (r) => NEXT[r.next]],
  ]
  return [cols.map((c) => c[0]).join(','), ...rows.map((r) => cols.map((c) => csvCell(c[1](r))).join(','))].join('\n') + '\n'
}

export const DIRECTORY_RANGES = [
  { key: '7', label: '7 days', days: 6 },
  { key: '30', label: '30 days', days: 29 },
  { key: '90', label: '90 days', days: 89 },
  { key: 'all', label: 'All time', days: 36_500 },
] as const

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v.slice(0, 80) : '')

export function readDirectoryParams(p: Params) {
  const range = DIRECTORY_RANGES.find((r) => r.key === one(p.range)) ?? DIRECTORY_RANGES[1]
  const filter: DirectoryFilter = { q: one(p.q), type: one(p.type), state: one(p.state), via: one(p.via), next: one(p.next), status: one(p.status) }
  return { range, filter }
}
