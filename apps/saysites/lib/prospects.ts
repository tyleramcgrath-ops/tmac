// Outreach (run automatically by lib/outreach): each business gets its own
// free redesign preview and a personal link to it. Nothing
// is ever published for a business that hasn't claimed its site: previews are
// private (noindex) and expire after 30 days (ss_previews). Emails go out from
// a separate outreach mailbox (lib/outreach), or from the team's own tool via
// the CSV export, never from saysites.com. Every row carries an unsubscribe link, and an unsubscribed
// address or website is never added again.
//
// Claiming through a personal link starts the account with a free first
// month (`withFreeMonth`), then the normal plan prices.
//
// The same measurements feed the city reports (`buildReport`): published
// under SaySites' own name, with aggregate numbers for everyone and names only
// for the lightest sites (good news people share). Never a list of who did
// worst.

import { randomBytes } from 'crypto'
import type { Audit } from './audit'
import type { Billing } from './billing'

export const PROSPECT_TOKEN = /^[a-f0-9]{20}$/
export const CAMPAIGN_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/
// Each batch builds this many previews; each reads up to 16 pages.
export const BATCH_MAX = 25
export const FREE_MONTH_DAYS = 30
// A report needs enough sites to say something true about a city.
export const REPORT_MIN_SITES = 10
export const REPORT_NAMED = 10

export interface Prospect {
  id: string
  campaign: string
  url: string
  name?: string
  email?: string
  createdAt: string
  previewId?: string
  error?: string
  // Their homepage as measured, and ours rebuilt.
  before?: Audit
  after?: { kb: number; scripts: number }
  // The site asks not to be sent unsolicited email: never emailed.
  noEmail?: boolean
  views?: number
  viewedAt?: string
  claimedAt?: string
  unsubscribedAt?: string
}

export interface ProspectLine {
  url: string
  email?: string
  name?: string
}

export const newToken = () => randomBytes(10).toString('hex')

export function cleanCampaign(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function hostOf(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[a-z]{2,}$/i

// One business per line: a website, and optionally an email and a name, in
// any order, separated by commas or tabs (a pasted spreadsheet works).
export function parseProspectLines(text: string): { lines: ProspectLine[]; skipped: string[] } {
  const lines: ProspectLine[] = []
  const skipped: string[] = []
  const seen = new Set<string>()
  for (const raw of text.split(/\r?\n/)) {
    const row = raw.trim()
    if (!row) continue
    const parts = row.split(/\t|,/).map((p) => p.trim().replace(/^"|"$/g, '')).filter(Boolean)
    const email = parts.find((p) => EMAIL.test(p))
    const site = parts.find((p) => p !== email && /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(p))
    const name = parts.find((p) => p !== email && p !== site)
    const host = site ? hostOf(site) : ''
    if (!host) {
      skipped.push(row.slice(0, 120))
      continue
    }
    if (seen.has(host)) continue
    seen.add(host)
    lines.push({ url: /^https?:\/\//i.test(site!) ? site! : `https://${site}`, ...(email ? { email: email.toLowerCase() } : {}), ...(name ? { name: name.slice(0, 120) } : {}) })
  }
  return { lines, skipped }
}

// Never contact a business again once it said no, by address or website.
export function blockedBy(line: ProspectLine, all: Prospect[]): boolean {
  const host = hostOf(line.url)
  return all.some((p) => p.unsubscribedAt && (hostOf(p.url) === host || (!!line.email && p.email === line.email)))
}

// Claiming from a personal link: the trial runs a month from today (or
// longer, if it already does).
export function withFreeMonth(b: Billing, now = Date.now()): Billing | null {
  if (b.status !== 'trial') return null
  const until = Math.max(Date.parse(b.trialEndsAt), now + FREE_MONTH_DAYS * 86_400_000)
  return { ...b, trialEndsAt: new Date(until).toISOString() }
}

// The CSV the team loads into their own sending tool. One row per business
// that has a preview and an email, hasn't unsubscribed or claimed, and
// doesn't ask not to be emailed. `wording` adds the subject and body.
export function outreachCsv(prospects: Prospect[], origin: string, wording?: (p: Prospect, followUp: boolean) => { subject: string; text: string }): string {
  const cell = (v: string | number | undefined) => {
    const s = String(v ?? '')
    // Spreadsheet formula injection: a leading = + - @ becomes text.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const head = ['name', 'email', 'website', 'preview_link', 'unsubscribe_link', 'their_page_kb', 'rebuilt_page_kb', 'their_scripts', ...(wording ? ['subject', 'body', 'follow_up_subject', 'follow_up_body'] : [])]
  const rows = prospects
    .filter((p) => p.previewId && p.email && !p.noEmail && !p.unsubscribedAt && !p.claimedAt)
    .map((p) => {
      const words = wording ? [wording(p, false), wording(p, true)].flatMap((m) => [m.subject, m.text]) : []
      return [p.name ?? '', p.email, hostOf(p.url), `${origin}/r/${p.id}`, `${origin}/unsubscribe/${p.id}`, p.before?.kb, p.after?.kb, p.before?.scripts, ...words].map(cell).join(',')
    })
  return [head.join(','), ...rows].join('\n') + '\n'
}

// ---------------------------------------------------------------------------
// City reports
// ---------------------------------------------------------------------------

const LOCAL = /LocalBusiness|LegalService|Attorney|Plumber|Electrician|HVACBusiness|RoofingContractor|LandscapingBusiness|HousekeepingService|AutoRepair|Dentist|MedicalBusiness|Physician|HairSalon|BeautySalon|DaySpa|Restaurant|Bakery|CafeOrCoffeeShop|Store/

export interface ReportRow {
  name: string
  host: string
  kb: number
  scripts: number
}

export interface CityReport {
  slug: string
  title: string
  city: string
  trade: string
  intro: string
  campaign: string
  measuredAt: string
  publishedAt?: string
  sites: number
  medianKb: number
  medianScripts: number
  // Shares of the measured sites, 0–100.
  businessDetails: number
  faq: number
  mobileReady: number
  oneHeading: number
  imagesDescribed: number
  lightest: ReportRow[]
  // A SaySites site of the same kind, measured the same way.
  ours?: { kb: number; scripts: number }
}

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10
}
const share = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

export function buildReport(input: { slug: string; title: string; city: string; trade: string; intro: string; campaign: string }, prospects: Prospect[], now = new Date()): CityReport | { error: string } {
  const measured = prospects.filter((p) => p.campaign === input.campaign && p.before)
  if (measured.length < REPORT_MIN_SITES) return { error: `A report needs at least ${REPORT_MIN_SITES} measured sites; this list has ${measured.length}.` }
  const a = measured.map((p) => p.before!)
  const withImages = a.filter((x) => x.images > 0)
  const lightest = measured
    .filter((p) => p.name && !p.unsubscribedAt)
    .sort((x, y) => x.before!.kb - y.before!.kb)
    .slice(0, REPORT_NAMED)
    .map((p) => ({ name: p.name!, host: hostOf(p.url), kb: p.before!.kb, scripts: p.before!.scripts }))
  const latest = measured.map((p) => p.createdAt).sort().at(-1) ?? now.toISOString()
  return {
    ...input,
    measuredAt: latest.slice(0, 10),
    sites: measured.length,
    medianKb: median(a.map((x) => x.kb)),
    medianScripts: median(a.map((x) => x.scripts)),
    businessDetails: share(a.filter((x) => x.schema.some((t) => LOCAL.test(t))).length, a.length),
    faq: share(a.filter((x) => x.schema.includes('FAQPage')).length, a.length),
    mobileReady: share(a.filter((x) => x.viewport).length, a.length),
    oneHeading: share(a.filter((x) => x.h1s === 1).length, a.length),
    imagesDescribed: share(withImages.filter((x) => x.imagesNoAlt === 0).length, withImages.length),
    lightest,
    ...(measured.some((p) => p.after) ? { ours: { kb: median(measured.filter((p) => p.after).map((p) => p.after!.kb)), scripts: median(measured.filter((p) => p.after).map((p) => p.after!.scripts)) } } : {}),
  }
}
