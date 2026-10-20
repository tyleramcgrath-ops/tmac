// Receives case reviews, attorney messages, profile claims and contact notes.
// Each lead is saved to the database (DATABASE_URL) for the admin dashboard,
// emailed to LEAD_EMAIL_TO, acknowledged to the visitor, and posted to
// LEAD_WEBHOOK_URL (Zapier, Make, a CRM...) — whichever are set up. If none
// is, the visitor is told so rather than shown a success message for a lead
// nobody will see.

import { NextResponse } from 'next/server'
import { hasDb } from '@/lib/admin/db'
import { KIND_LABEL, markDelivered, saveLead } from '@/lib/admin/leads'
import { esc, mailConfigured, sendMail } from '@/lib/admin/mail'
import { classify, recordEvent } from '@/lib/admin/traffic'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { SITE, abs } from '@/lib/site'

const KINDS = new Set(['evaluation', 'contact-attorney', 'claim', 'general'])
const FIELDS = ['name', 'email', 'phone', 'location', 'practice', 'timing', 'message', 'attorney', 'bar', 'firm', 'page'] as const
const SOURCE_KEYS = ['landing', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'fbclid', 'msclkid', 'first'] as const
const recent = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  hits.push(now)
  recent.set(ip, hits)
  if (recent.size > 5000) recent.clear()
  return hits.length > 6
}

const practiceName = (slug?: string) => PRACTICE_AREAS.find((p) => p.slug === slug)?.name ?? slug ?? ''

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  // Bots fill the hidden field; pretend it worked.
  if (body.company_website) return NextResponse.json({ ok: true })

  const kind = String(body.kind ?? '')
  if (!KINDS.has(kind)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const lead: Record<string, string> = { kind }
  for (const f of FIELDS) {
    const v = body[f]
    if (typeof v === 'string' && v.trim()) lead[f] = v.trim().slice(0, f === 'message' ? 3000 : 200)
  }
  if (!lead.name || !lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))
    return NextResponse.json({ error: 'Please enter your name and a valid email address.' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (limited(ip)) return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 })

  // Where the visitor first came from (recorded in their browser by the tracker).
  const raw = (body.source && typeof body.source === 'object' ? body.source : {}) as Record<string, unknown>
  const source: Record<string, string> = {}
  for (const k of SOURCE_KEYS) if (typeof raw[k] === 'string' && raw[k]) source[k] = (raw[k] as string).slice(0, 200)
  const params = new URLSearchParams(SOURCE_KEYS.filter((k) => k.startsWith('utm_') || k.endsWith('clid')).flatMap((k) => (source[k] ? [[k, source[k]]] : [])))
  source.source = classify(source.referrer ?? '', params, new URL(SITE.url).host)

  lead.received = new Date().toISOString()
  const delivered: Record<string, boolean> = {}

  // 1. Database, so it shows in the dashboard.
  let id: string | null = null
  if (hasDb()) {
    try {
      const { kind: k, name, email, phone = '', location = '', practice = '', message = '', page = '', ...rest } = lead
      id = await saveLead({ kind: k, name, email, phone, location, practice, message, page, data: rest, source })
      delivered.database = !!id
    } catch (err) {
      console.error('[lead] database', (err as Error).message)
      delivered.database = false
    }
  }

  const label = KIND_LABEL[kind] ?? kind
  const jobs: Promise<void>[] = []

  // 2. Email to the owner.
  const to = process.env.LEAD_EMAIL_TO
  if (to && mailConfigured()) {
    const rows = { ...lead, practice: practiceName(lead.practice), source: source.source, landing: source.landing ?? '', campaign: source.utm_campaign ?? '' }
    jobs.push(sendMail({
      to, replyTo: lead.email,
      subject: `New ${label.toLowerCase()}: ${lead.name}${lead.practice ? ` (${practiceName(lead.practice)})` : ''}${lead.location ? `, ${lead.location}` : ''}`,
      html: `<table cellpadding="6">${Object.entries(rows).filter(([, v]) => v).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(String(v)).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>${id ? `<p><a href="${abs(`/admin/leads/${id}`)}">Open in the dashboard</a></p>` : ''}`,
    }).then((ok) => { delivered.email = ok }))
  }

  // 3. A confirmation to the visitor, so they know it arrived.
  if (mailConfigured() && process.env.LEAD_AUTOREPLY !== 'off' && (kind === 'evaluation' || kind === 'contact-attorney')) {
    jobs.push(sendMail({
      to: lead.email,
      subject: kind === 'evaluation' ? 'We received your case review request' : 'Your message was sent',
      html: `<p>Hi ${esc(lead.name.split(' ')[0])},</p><p>Thanks for contacting ${SITE.name}. ${kind === 'evaluation' ? 'We’re reviewing what you shared and will connect you with attorneys who handle this kind of case, usually within one business day.' : 'The attorney’s office has your message and will reply directly.'}</p><p>If anything is urgent or a deadline is close, please say so by replying to this email.</p><p>— The ${SITE.name} team<br><a href="${SITE.url}">${SITE.url.replace(/^https?:\/\//, '')}</a></p><p style="color:#777;font-size:12px">${SITE.name} is not a law firm and this email is not legal advice. Sending us information doesn’t create an attorney-client relationship.</p>`,
    }).then((ok) => { delivered.autoreply = ok }))
  }

  // 4. Webhook (Zapier, Make, a CRM).
  const hook = process.env.LEAD_WEBHOOK_URL
  if (hook)
    jobs.push(fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, id, source }) })
      .then((r) => { delivered.webhook = r.ok }).catch(() => { delivered.webhook = false }))

  await Promise.all(jobs)
  if (id) await markDelivered(id, delivered).catch(() => {})
  recordEvent('lead_submit', kind).catch(() => {})

  const received = delivered.database || delivered.email || delivered.webhook
  if (!('database' in delivered) && !('email' in delivered) && !('webhook' in delivered)) {
    console.error('[lead] no delivery configured; set DATABASE_URL, LEAD_EMAIL_TO + SMTP/Resend, or LEAD_WEBHOOK_URL')
    return NextResponse.json({ error: 'Our form is temporarily unavailable. Please email us instead.' }, { status: 503 })
  }
  if (!received) return NextResponse.json({ error: 'We couldn’t send that just now. Please try again.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
