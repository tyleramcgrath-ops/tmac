// Leads: every request a site brings in, worked like a CRM. Each lead is a
// form message (lib/store Message) plus its pipeline state here: stage,
// timeline, follow-up date. Per site, the owner also sets automations (an
// instant reply to the lead, an alert to themselves, a follow-up email, a
// reminder) and the CRMs each lead is sent to (lib/crm-sync).
//
// Email goes out through the saysites.com mailbox (lib/mail), free, so every
// plan gets it. Nothing here promises a result to the lead: the default
// wording only confirms the message arrived and how to reach the business.

import { randomBytes } from 'crypto'
import { INTEGRATIONS, pushLead, type IntegrationKind, type LeadPayload, type SyncResult } from './crm-sync'
import { mailReady, sendMail } from './mail'
import type { Site } from './schema'
import type { Message, Store } from './store'
import { liveUrl } from './urls'

export const STAGES = ['new', 'contacted', 'booked', 'won', 'lost'] as const
export type Stage = (typeof STAGES)[number]
export const STAGE_LABEL: Record<Stage, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', won: 'Won', lost: 'Lost' }
export const STAGE_HINT: Record<Stage, string> = {
  new: 'Not answered yet',
  contacted: 'You’ve been in touch',
  booked: 'A consultation, visit or job is booked',
  won: 'They became a client',
  lost: 'Not going ahead',
}

export type LeadEventKind = 'note' | 'stage' | 'email' | 'call' | 'sync' | 'auto' | 'reminder'
export interface LeadEvent {
  at: string
  kind: LeadEventKind
  text: string
  ok?: boolean
}

export interface LeadMeta {
  stage: Stage
  activity: LeadEvent[]
  // YYYY-MM-DD: the owner wants a reminder to follow up that day.
  followUpOn?: string
  // When the lead was first contacted (moved on from New), for response time.
  contactedAt?: string
  replied?: boolean
  followedUp?: boolean
  reminded?: boolean
  remindedOn?: string
}

export interface Automations {
  reply: { on: boolean; subject: string; body: string }
  alert: { on: boolean; to: string }
  followUp: { on: boolean; days: number; subject: string; body: string }
  remind: { on: boolean; hours: number }
}

export interface IntegrationState {
  on: boolean
  config: Record<string, string>
  last?: { at: string; ok: boolean; text: string }
}

export interface CrmState {
  // Leads that arrived before this were never automated (no surprise emails
  // about old messages when an owner first opens Leads).
  since: string
  leads: Record<string, LeadMeta>
  automations: Automations
  integrations: Partial<Record<IntegrationKind, IntegrationState>>
  // Signs webhook deliveries (lib/crm-sync).
  secret: string
}

export function defaultAutomations(): Automations {
  return {
    reply: {
      on: true,
      subject: 'Thanks for contacting {business}',
      body: 'Hi {first},\n\nThank you for getting in touch with {business}. We’ve received your message and will get back to you as soon as we can.\n\nIf it’s urgent, please call us at {phone}.\n\n{business}',
    },
    alert: { on: true, to: '' },
    followUp: {
      on: false,
      days: 2,
      subject: 'Following up from {business}',
      body: 'Hi {first},\n\nI wanted to follow up on the message you sent {business}. Are you still looking for help? Just reply to this email, or call us at {phone}, and we’ll take it from there.\n\n{business}',
    },
    remind: { on: true, hours: 24 },
  }
}

export function emptyCrm(now = new Date()): CrmState {
  return { since: now.toISOString(), leads: {}, automations: defaultAutomations(), integrations: {}, secret: randomBytes(24).toString('hex') }
}

export async function loadCrm(store: Store, siteId: string): Promise<CrmState> {
  const raw = (await store.crmState(siteId)) as Partial<CrmState> | null
  if (!raw) return emptyCrm()
  const d = defaultAutomations()
  const a = raw.automations ?? d
  return {
    since: raw.since ?? new Date().toISOString(),
    leads: raw.leads ?? {},
    automations: { reply: { ...d.reply, ...a.reply }, alert: { ...d.alert, ...a.alert }, followUp: { ...d.followUp, ...a.followUp }, remind: { ...d.remind, ...a.remind } },
    integrations: raw.integrations ?? {},
    secret: raw.secret ?? randomBytes(24).toString('hex'),
  }
}

// One change at a time per site, so a lead arriving while the owner edits
// can't overwrite either change. (SaySites runs as one Node process.)
const locks = new Map<string, Promise<unknown>>()
export async function withCrm<T>(store: Store, siteId: string, fn: (state: CrmState) => Promise<T> | T): Promise<T> {
  const prev = locks.get(siteId) ?? Promise.resolve()
  const run = prev.catch(() => null).then(async () => {
    const state = await loadCrm(store, siteId)
    const out = await fn(state)
    await store.saveCrmState(siteId, state)
    return out
  })
  locks.set(siteId, run)
  try {
    return await run
  } finally {
    if (locks.get(siteId) === run) locks.delete(siteId)
  }
}

export function metaFor(state: CrmState, id: string): LeadMeta {
  return (state.leads[id] ??= { stage: 'new', activity: [] })
}

export function addEvent(meta: LeadMeta, kind: LeadEventKind, text: string, ok?: boolean, at = new Date().toISOString()): void {
  meta.activity = [...meta.activity, { at, kind, text, ...(ok === undefined ? {} : { ok }) }].slice(-100)
}

export function setStage(meta: LeadMeta, stage: Stage, at = new Date().toISOString()): void {
  if (meta.stage === stage) return
  if (meta.stage === 'new' && !meta.contactedAt) meta.contactedAt = at
  addEvent(meta, 'stage', `Moved from ${STAGE_LABEL[meta.stage]} to ${STAGE_LABEL[stage]}`, undefined, at)
  meta.stage = stage
}

// Fills {first}, {name}, {business}, {phone}, {email}, {website}. A line
// whose placeholder has nothing to fill (no phone number, say) is dropped
// rather than sent half-empty.
export function fill(template: string, values: Record<string, string>): string {
  return template
    .split('\n')
    .filter((line) => !/\{(\w+)\}/.test(line) || [...line.matchAll(/\{(\w+)\}/g)].every(([, k]) => (values[k] ?? '').trim()))
    .join('\n')
    .replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function valuesFor(site: Site, m: Pick<Message, 'name' | 'email'>): Record<string, string> {
  const first = m.name.trim().split(/\s+/)[0] ?? ''
  return { first: first || 'there', name: m.name, business: site.business.name, phone: site.business.phone ?? '', email: site.business.email ?? '', website: liveUrl(site) }
}

export function payloadFor(site: Site, m: Message): LeadPayload {
  return { id: m.id, name: m.name, email: m.email, phone: m.phone, message: m.body, page: m.page, createdAt: m.createdAt, business: site.business.name, website: liveUrl(site) }
}

const APP = 'https://saysites.com'
export const leadLink = (siteId: string, id: string) => `${APP}/dashboard/sites/${siteId}/leads/${id}`

async function ownerEmail(store: Store, site: Site, state: CrmState): Promise<string> {
  return state.automations.alert.to || site.business.email || (await store.userById(site.orgId))?.email || ''
}

export async function syncLead(state: CrmState, site: Site, m: Message, only?: IntegrationKind): Promise<SyncResult[]> {
  const meta = metaFor(state, m.id)
  const out: SyncResult[] = []
  for (const kind of INTEGRATIONS) {
    const int = state.integrations[kind]
    if (!int?.on || (only && kind !== only)) continue
    const r = await pushLead(kind, int.config, payloadFor(site, m), state.secret)
    int.last = { at: new Date().toISOString(), ok: r.ok, text: r.text }
    addEvent(meta, 'sync', r.text, r.ok)
    out.push(r)
  }
  return out
}

// A new lead just arrived from the site's form: reply to them, tell the
// owner, and send it to their CRMs. Never throws; every outcome lands on
// the lead's timeline.
export async function onNewLead(store: Store, site: Site, m: Message): Promise<void> {
  await withCrm(store, site.id, async (state) => {
    const meta = metaFor(state, m.id)
    const a = state.automations
    const v = valuesFor(site, m)
    if (a.reply.on && m.email && mailReady()) {
      // One automatic reply per address per day, however many times the form is sent.
      const dayAgo = Date.now() - 86_400_000
      const already = Object.values(state.leads).some((x) => x !== meta && x.replied && x.activity.some((e) => e.kind === 'auto' && Date.parse(e.at) > dayAgo && e.text.includes(m.email)))
      if (!already) {
        const r = await sendMail({ to: m.email, subject: fill(a.reply.subject, v), text: fill(a.reply.body, v), fromName: site.business.name, replyTo: site.business.email })
        meta.replied = r.ok
        addEvent(meta, 'auto', r.ok ? `Instant reply sent to ${m.email}` : `Instant reply not sent: ${r.error}`, r.ok)
      }
    }
    if (a.alert.on && mailReady()) {
      const to = await ownerEmail(store, site, state)
      if (to) {
        const lines = [`${m.name || 'Someone'} just sent a request through ${site.business.name}’s website.`, '', m.body, '', [m.email && `Email: ${m.email}`, m.phone && `Phone: ${m.phone}`].filter(Boolean).join('\n'), '', `Open the lead: ${leadLink(site.id, m.id)}`]
        await sendMail({ to, subject: `New lead: ${m.name || 'website request'}`, text: lines.join('\n'), fromName: 'SaySites', ...(m.email ? { replyTo: m.email } : {}) })
      }
    }
    await syncLead(state, site, m)
  }).catch(() => null)
}

const DAY = 86_400_000

// Runs every few minutes: follow-up emails to leads nobody has answered,
// reminders to owners, and follow-up dates that have come round.
export async function runDue(store: Store, now = new Date()): Promise<number> {
  if (!mailReady()) return 0
  let sent = 0
  const today = now.toISOString().slice(0, 10)
  for (const { site } of await store.crmSites()) {
    const messages = (await store.messagesForSite(site.id, 200)).filter((m) => now.getTime() - Date.parse(m.createdAt) < 30 * DAY)
    if (!messages.length) continue
    await withCrm(store, site.id, async (state) => {
      const a = state.automations
      for (const m of messages) {
        if (Date.parse(m.createdAt) < Date.parse(state.since)) continue
        const meta = metaFor(state, m.id)
        const age = now.getTime() - Date.parse(m.createdAt)
        const v = valuesFor(site, m)
        if (a.followUp.on && meta.stage === 'new' && !meta.followedUp && m.email && age >= a.followUp.days * DAY) {
          const r = await sendMail({ to: m.email, subject: fill(a.followUp.subject, v), text: fill(a.followUp.body, v), fromName: site.business.name, replyTo: site.business.email })
          meta.followedUp = true
          addEvent(meta, 'auto', r.ok ? `Follow-up email sent to ${m.email}` : `Follow-up email not sent: ${r.error}`, r.ok)
          if (r.ok) sent++
        }
        const to = a.remind.on || meta.followUpOn ? await ownerEmail(store, site, state) : ''
        if (to && a.remind.on && meta.stage === 'new' && !meta.reminded && age >= a.remind.hours * 3_600_000) {
          const r = await sendMail({ to, subject: `Still waiting: ${m.name || 'a website lead'}`, text: `${m.name || 'Someone'} asked ${site.business.name} for help ${Math.round(age / 3_600_000)} hours ago and is still marked New.\n\nOpen the lead: ${leadLink(site.id, m.id)}`, fromName: 'SaySites' })
          meta.reminded = true
          addEvent(meta, 'reminder', r.ok ? 'Reminder sent to you: not answered yet' : `Reminder not sent: ${r.error}`, r.ok)
          if (r.ok) sent++
        }
        if (to && meta.followUpOn && meta.followUpOn <= today && meta.remindedOn !== meta.followUpOn && meta.stage !== 'won' && meta.stage !== 'lost') {
          const r = await sendMail({ to, subject: `Follow up today: ${m.name || 'a website lead'}`, text: `You set today to follow up with ${m.name || 'this lead'}.\n\nOpen the lead: ${leadLink(site.id, m.id)}`, fromName: 'SaySites' })
          meta.remindedOn = meta.followUpOn
          addEvent(meta, 'reminder', r.ok ? 'Follow-up reminder sent to you' : `Follow-up reminder not sent: ${r.error}`, r.ok)
          if (r.ok) sent++
        }
      }
    }).catch(() => null)
  }
  return sent
}

export interface LeadStats {
  total: number
  thisMonth: number
  byStage: Record<Stage, number>
  // Median minutes from arriving to first contact, for leads contacted.
  responseMins: number | null
  // Share of leads that became clients, among those decided (won or lost).
  winRate: number | null
}

export function leadStats(messages: Message[], state: CrmState, monthStart: string): LeadStats {
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>
  const waits: number[] = []
  for (const m of messages) {
    const meta = state.leads[m.id]
    byStage[meta?.stage ?? 'new']++
    if (meta?.contactedAt) waits.push((Date.parse(meta.contactedAt) - Date.parse(m.createdAt)) / 60_000)
  }
  waits.sort((x, y) => x - y)
  const decided = byStage.won + byStage.lost
  return {
    total: messages.length,
    thisMonth: messages.filter((m) => m.createdAt.slice(0, 10) >= monthStart).length,
    byStage,
    responseMins: waits.length ? Math.max(0, Math.round(waits[Math.floor(waits.length / 2)])) : null,
    winRate: decided ? Math.round((byStage.won / decided) * 100) : null,
  }
}

export function csvFor(messages: Message[], state: CrmState): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  // Spreadsheet apps run cells that start with these as formulas.
  const safe = (s: string) => esc(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s)
  const rows = [['Received', 'Name', 'Email', 'Phone', 'Stage', 'Follow up on', 'Page', 'Message']]
  for (const m of messages) {
    const meta = state.leads[m.id]
    rows.push([m.createdAt, m.name, m.email, m.phone, STAGE_LABEL[meta?.stage ?? 'new'], meta?.followUpOn ?? '', m.page, m.body])
  }
  return rows.map((r) => r.map(safe).join(',')).join('\r\n') + '\r\n'
}
