'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { INTEGRATIONS, INTEGRATION_INFO, pushLead, validConfig, type IntegrationKind } from '@/lib/crm-sync'
import { STAGES, addEvent, metaFor, setStage, syncLead, withCrm, type Stage } from '@/lib/leads'
import { sendMail } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

async function owned(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) redirect('/dashboard')
  return { user, store, site }
}

async function lead(siteId: string, leadId: string) {
  const o = await owned(siteId)
  const m = (await o.store.messagesForSite(siteId)).find((x) => x.id === leadId)
  if (!m) redirect(`/dashboard/sites/${siteId}/leads`)
  return { ...o, m }
}

const base = (siteId: string) => `/dashboard/sites/${siteId}/leads`
function back(path: string, note = ''): never {
  revalidatePath(path)
  redirect(`${path}${note ? `?note=${note}` : ''}`)
}

const isStage = (s: string): s is Stage => (STAGES as readonly string[]).includes(s)

export async function moveLead(siteId: string, leadId: string, form: FormData): Promise<void> {
  const { store } = await lead(siteId, leadId)
  const stage = String(form.get('stage') ?? '')
  if (isStage(stage)) await withCrm(store, siteId, (s) => setStage(metaFor(s, leadId), stage))
  const from = String(form.get('from') ?? '')
  back(from === 'board' ? base(siteId) : `${base(siteId)}/${leadId}`)
}

export async function addNote(siteId: string, leadId: string, form: FormData): Promise<void> {
  const { store } = await lead(siteId, leadId)
  const text = String(form.get('note') ?? '').trim().slice(0, 2000)
  if (text) await withCrm(store, siteId, (s) => addEvent(metaFor(s, leadId), 'note', text))
  back(`${base(siteId)}/${leadId}`)
}

export async function logCall(siteId: string, leadId: string): Promise<void> {
  const { store } = await lead(siteId, leadId)
  await withCrm(store, siteId, (s) => {
    const meta = metaFor(s, leadId)
    addEvent(meta, 'call', 'You called them')
    if (meta.stage === 'new') setStage(meta, 'contacted')
  })
  back(`${base(siteId)}/${leadId}`)
}

export async function setFollowUp(siteId: string, leadId: string, form: FormData): Promise<void> {
  const { store } = await lead(siteId, leadId)
  const day = String(form.get('day') ?? '')
  await withCrm(store, siteId, (s) => {
    const meta = metaFor(s, leadId)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      meta.followUpOn = day
      addEvent(meta, 'note', `Follow-up set for ${new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}`)
    } else {
      delete meta.followUpOn
    }
  })
  back(`${base(siteId)}/${leadId}`)
}

export async function emailLead(siteId: string, leadId: string, form: FormData): Promise<void> {
  const { store, site, m } = await lead(siteId, leadId)
  const subject = String(form.get('subject') ?? '').trim().slice(0, 200)
  const text = String(form.get('body') ?? '').trim().slice(0, 10_000)
  if (!subject || !text || !m.email) back(`${base(siteId)}/${leadId}`, 'empty')
  const r = await sendMail({ to: m.email, subject, text, fromName: site.business.name, replyTo: site.business.email })
  await withCrm(store, siteId, (s) => {
    const meta = metaFor(s, leadId)
    addEvent(meta, 'email', r.ok ? `You emailed them: “${subject}”` : `Email not sent: ${r.error}`, r.ok)
    if (r.ok && meta.stage === 'new') setStage(meta, 'contacted')
  })
  back(`${base(siteId)}/${leadId}`, r.ok ? 'sent' : 'notsent')
}

export async function resendLead(siteId: string, leadId: string): Promise<void> {
  const { store, site, m } = await lead(siteId, leadId)
  await withCrm(store, siteId, (s) => syncLead(s, site, m))
  back(`${base(siteId)}/${leadId}`)
}

export async function deleteLead(siteId: string, leadId: string): Promise<void> {
  const { store } = await lead(siteId, leadId)
  await store.deleteMessage(siteId, leadId)
  await withCrm(store, siteId, (s) => {
    delete s.leads[leadId]
  })
  back(base(siteId))
}

const days = (v: FormDataEntryValue | null, min: number, max: number, dflt: number) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt
}

export async function saveAutomations(siteId: string, form: FormData): Promise<void> {
  const { store } = await owned(siteId)
  const str = (k: string, max: number) => String(form.get(k) ?? '').replace(/\r\n/g, '\n').trim().slice(0, max)
  const to = str('alertTo', 200)
  await withCrm(store, siteId, (s) => {
    const a = s.automations
    a.reply = { on: form.get('replyOn') === 'on', subject: str('replySubject', 200) || a.reply.subject, body: str('replyBody', 4000) || a.reply.body }
    a.alert = { on: form.get('alertOn') === 'on', to: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ? to : '' }
    a.followUp = { on: form.get('followOn') === 'on', days: days(form.get('followDays'), 1, 14, 2), subject: str('followSubject', 200) || a.followUp.subject, body: str('followBody', 4000) || a.followUp.body }
    a.remind = { on: form.get('remindOn') === 'on', hours: days(form.get('remindHours'), 1, 72, 24) }
    a.review = { on: form.get('reviewOn') === 'on', days: days(form.get('reviewDays'), 0, 30, 1), subject: str('reviewSubject', 200) || a.review.subject, body: str('reviewBody', 4000) || a.review.body }
    a.report = { on: form.get('reportOn') === 'on' }
  })
  back(`${base(siteId)}/automations`, 'saved')
}

const isKind = (k: string): k is IntegrationKind => (INTEGRATIONS as readonly string[]).includes(k)

export async function connectIntegration(siteId: string, kind: string, form: FormData): Promise<void> {
  const { store } = await owned(siteId)
  if (!isKind(kind)) back(`${base(siteId)}/integrations`)
  const raw = Object.fromEntries(INTEGRATION_INFO[kind].fields.map((f) => [f.key, String(form.get(f.key) ?? '')]))
  const v = validConfig(kind, raw)
  if (!v.ok) back(`${base(siteId)}/integrations`, `bad-${kind}`)
  await withCrm(store, siteId, (s) => {
    s.integrations[kind] = { on: true, config: v.config }
  })
  back(`${base(siteId)}/integrations`, `on-${kind}`)
}

export async function disconnectIntegration(siteId: string, kind: string): Promise<void> {
  const { store } = await owned(siteId)
  if (isKind(kind)) {
    await withCrm(store, siteId, (s) => {
      delete s.integrations[kind]
    })
  }
  back(`${base(siteId)}/integrations`)
}

// A clearly-labelled sample lead, so the owner can see it arrive.
export async function testIntegration(siteId: string, kind: string): Promise<void> {
  const { store, site, user } = await owned(siteId)
  if (!isKind(kind)) back(`${base(siteId)}/integrations`)
  await withCrm(store, siteId, async (s) => {
    const int = s.integrations[kind]
    if (!int) return
    const r = await pushLead(kind, int.config, { id: 'test', name: 'Test Lead', email: user.email, phone: '', message: `A test lead from ${site.business.name}’s website on SaySites. You can delete it.`, page: '/', createdAt: new Date().toISOString(), business: site.business.name, website: `https://${site.subdomain}.saysites.com` }, s.secret)
    int.last = { at: new Date().toISOString(), ok: r.ok, text: `Test: ${r.text}` }
  })
  back(`${base(siteId)}/integrations`)
}
