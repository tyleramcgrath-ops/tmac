// Sends each new lead to the CRM the owner already uses. Every connector
// uses the CRM's own documented way in, with a key the owner pastes from
// their CRM's settings, so there's nothing for us to host or approve:
//
// - HubSpot: a private app access token (CRM contacts API).
// - Salesforce: Web-to-Lead with the org's ID (no token needed).
// - Pipedrive: a personal API token (a person, a lead and a note).
// - Clio Grow: the Lead Inbox token (built for law firms).
// - Zapier, Make or any other app: a webhook address, signed.
//
// Free for us (no metered APIs), so free for every plan. Each call reports
// exactly what the CRM answered; nothing is shown as synced unless it was.

import { createHmac } from 'crypto'
import { isSafeFetchTarget } from './rankforge/seo-scan/url-guard'

export const INTEGRATIONS = ['hubspot', 'salesforce', 'pipedrive', 'clio', 'webhook'] as const
export type IntegrationKind = (typeof INTEGRATIONS)[number]

export interface IntegrationField {
  key: string
  label: string
  hint: string
  secret?: boolean
  pattern?: RegExp
}

export const INTEGRATION_INFO: Record<IntegrationKind, { name: string; blurb: string; fields: IntegrationField[]; steps: string[] }> = {
  hubspot: {
    name: 'HubSpot',
    blurb: 'Each lead becomes a HubSpot contact, marked as a lead.',
    fields: [{ key: 'token', label: 'Private app access token', hint: 'Starts with pat-', secret: true, pattern: /^pat-[\w-]{10,}$/ }],
    steps: ['In HubSpot, open Settings, then Integrations, then Private Apps.', 'Create a private app. Under Scopes, tick crm.objects.contacts.write.', 'Copy the access token and paste it here.'],
  },
  salesforce: {
    name: 'Salesforce',
    blurb: 'Each lead arrives as a Salesforce Lead, with its message in the description.',
    fields: [{ key: 'orgId', label: 'Organization ID', hint: '15 or 18 characters, starts with 00D', pattern: /^00D[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?$/ }],
    steps: ['In Salesforce, open Setup and search for Company Information.', 'Copy the Salesforce.com Organization ID and paste it here.', 'Make sure Web-to-Lead is enabled (Setup, then Web-to-Lead).'],
  },
  pipedrive: {
    name: 'Pipedrive',
    blurb: 'Each lead becomes a Pipedrive person and lead, with their message as a note.',
    fields: [{ key: 'token', label: 'API token', hint: '40 characters', secret: true, pattern: /^[a-f0-9]{40}$/i }],
    steps: ['In Pipedrive, open your profile menu, then Personal preferences, then API.', 'Copy your personal API token and paste it here.'],
  },
  clio: {
    name: 'Clio Grow',
    blurb: 'Each lead lands in your Clio Grow inbox, ready to turn into a matter.',
    fields: [{ key: 'token', label: 'Lead Inbox token', hint: 'From Clio Grow settings', secret: true, pattern: /^[\w-]{16,}$/ }],
    steps: ['In Clio Grow, open Settings, then Lead Inbox.', 'Copy your Lead Inbox token and paste it here.'],
  },
  webhook: {
    name: 'Zapier, Make and other apps',
    blurb: 'Sends each lead to a webhook, so it can reach Zoho, Monday, Google Sheets, Slack or anything else you use.',
    fields: [{ key: 'url', label: 'Webhook address', hint: 'https://hooks.zapier.com/…', pattern: /^https:\/\/\S{8,500}$/ }],
    steps: ['In Zapier, make a Zap that starts with “Webhooks by Zapier”, then “Catch Hook”. (In Make, use a “Custom webhook”.)', 'Copy the webhook address it gives you and paste it here.', 'Press “Send a test lead”, then finish your Zap with the app you want.'],
  },
}

export interface LeadPayload {
  id: string
  name: string
  email: string
  phone: string
  message: string
  page: string
  createdAt: string
  business: string
  website: string
  // Which ad or tagged link brought them, e.g. "Google Ads (Probate)".
  source?: string
}

export type SyncResult = { ok: boolean; text: string }

const TIMEOUT = 15_000

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: 'Website lead' }
  if (parts.length === 1) return { first: '', last: parts[0] }
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1)! }
}

async function answer(res: Response): Promise<string> {
  try {
    const text = await res.text()
    try {
      const j = JSON.parse(text)
      return String(j.message ?? j.error ?? j.error_info ?? j.errors?.[0]?.message ?? text).slice(0, 200)
    } catch {
      return text.slice(0, 200)
    }
  } catch {
    return ''
  }
}

async function hubspot(cfg: Record<string, string>, lead: LeadPayload): Promise<SyncResult> {
  const { first, last } = splitName(lead.name)
  const properties: Record<string, string> = { firstname: first, lastname: last, lifecyclestage: 'lead' }
  if (lead.email) properties.email = lead.email
  if (lead.phone) properties.phone = lead.phone
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ properties }),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (res.ok) return { ok: true, text: 'Added to HubSpot as a contact.' }
  if (res.status === 409) return { ok: true, text: 'Already a contact in HubSpot.' }
  if (res.status === 401 || res.status === 403) return { ok: false, text: 'HubSpot didn’t accept the token. Check it has the crm.objects.contacts.write scope.' }
  return { ok: false, text: `HubSpot said: ${await answer(res)}` }
}

async function salesforce(cfg: Record<string, string>, lead: LeadPayload): Promise<SyncResult> {
  const { first, last } = splitName(lead.name)
  const body = new URLSearchParams({
    oid: cfg.orgId,
    first_name: first,
    last_name: last,
    company: lead.name || 'Website lead',
    email: lead.email,
    phone: lead.phone,
    description: `${lead.message}\n\nSent from ${lead.website}${lead.page === '/' ? '' : lead.page}${lead.source ? `\nSource: ${lead.source}` : ''}`.slice(0, 32000),
    lead_source: 'Website',
  })
  const res = await fetch('https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(TIMEOUT),
  })
  // Web-to-Lead always answers 200 and never says whether the lead was
  // created, so this is reported as sent, not as confirmed.
  if (res.ok) return { ok: true, text: 'Sent to Salesforce Web-to-Lead.' }
  return { ok: false, text: `Salesforce answered ${res.status}.` }
}

async function pipedrive(cfg: Record<string, string>, lead: LeadPayload): Promise<SyncResult> {
  const api = (path: string, payload: unknown) =>
    fetch(`https://api.pipedrive.com/v1/${path}?api_token=${encodeURIComponent(cfg.token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT),
    })
  const person = await api('persons', {
    name: lead.name || 'Website lead',
    ...(lead.email ? { email: [{ value: lead.email, primary: true }] } : {}),
    ...(lead.phone ? { phone: [{ value: lead.phone, primary: true }] } : {}),
  })
  if (person.status === 401) return { ok: false, text: 'Pipedrive didn’t accept the API token.' }
  if (!person.ok) return { ok: false, text: `Pipedrive said: ${await answer(person)}` }
  const personId = (await person.json())?.data?.id
  const created = await api('leads', { title: `${lead.name || 'Website lead'} (${lead.business} website)`, person_id: personId })
  if (!created.ok) return { ok: false, text: `Pipedrive added the person but not the lead: ${await answer(created)}` }
  const leadId = (await created.json())?.data?.id
  if (lead.message && leadId) await api('notes', { content: lead.message, lead_id: leadId }).catch(() => null)
  return { ok: true, text: 'Added to Pipedrive as a person and a lead.' }
}

async function clio(cfg: Record<string, string>, lead: LeadPayload): Promise<SyncResult> {
  const { first, last } = splitName(lead.name)
  const res = await fetch('https://grow.clio.com/inbox_leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      inbox_lead: { from_first: first, from_last: last, from_message: lead.message, from_email: lead.email, from_phone: lead.phone, referring_url: `${lead.website}${lead.page === '/' ? '' : lead.page}`, from_source: lead.source ? `SaySites website: ${lead.source}`.slice(0, 100) : 'SaySites website' },
      inbox_lead_token: cfg.token,
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (res.ok) return { ok: true, text: 'Added to your Clio Grow inbox.' }
  if (res.status === 401 || res.status === 403 || res.status === 422) return { ok: false, text: 'Clio Grow didn’t accept the Lead Inbox token.' }
  return { ok: false, text: `Clio Grow said: ${await answer(res)}` }
}

// The signature lets the receiving app check the lead really came from us.
export const webhookSignature = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('hex')

async function webhook(cfg: Record<string, string>, lead: LeadPayload, secret: string): Promise<SyncResult> {
  const safe = await isSafeFetchTarget(cfg.url)
  if (!safe.ok) return { ok: false, text: 'That webhook address can’t be reached from the internet.' }
  const body = JSON.stringify({ event: 'lead.created', lead })
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-saysites-signature': webhookSignature(secret, body) },
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (res.ok) return { ok: true, text: 'Delivered to your webhook.' }
  return { ok: false, text: `The webhook answered ${res.status}.` }
}

export async function pushLead(kind: IntegrationKind, cfg: Record<string, string>, lead: LeadPayload, secret: string): Promise<SyncResult> {
  try {
    switch (kind) {
      case 'hubspot':
        return await hubspot(cfg, lead)
      case 'salesforce':
        return await salesforce(cfg, lead)
      case 'pipedrive':
        return await pipedrive(cfg, lead)
      case 'clio':
        return await clio(cfg, lead)
      case 'webhook':
        return await webhook(cfg, lead, secret)
    }
  } catch (err) {
    return { ok: false, text: err instanceof Error && err.name === 'TimeoutError' ? 'No answer in time. It will be tried again with the next lead.' : 'Could not reach it.' }
  }
}

export function validConfig(kind: IntegrationKind, raw: Record<string, string>): { ok: true; config: Record<string, string> } | { ok: false; field: string } {
  const config: Record<string, string> = {}
  for (const f of INTEGRATION_INFO[kind].fields) {
    const v = (raw[f.key] ?? '').trim()
    if (f.pattern && !f.pattern.test(v)) return { ok: false, field: f.label }
    config[f.key] = v
  }
  return { ok: true, config }
}
