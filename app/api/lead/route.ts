// Receives case reviews, attorney messages, profile claims and contact notes.
// Delivery goes to LEAD_WEBHOOK_URL (Zapier, Make, a CRM, PocketBase hook...)
// and/or email through Resend. If neither is set up, the visitor is told so
// rather than shown a success message for a lead nobody will see.

import { NextResponse } from 'next/server'

const KINDS = new Set(['evaluation', 'contact-attorney', 'claim', 'general'])
const FIELDS = ['name', 'email', 'phone', 'location', 'practice', 'timing', 'message', 'attorney', 'bar', 'firm', 'page'] as const
const recent = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  hits.push(now)
  recent.set(ip, hits)
  if (recent.size > 5000) recent.clear()
  return hits.length > 6
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

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

  lead.received = new Date().toISOString()
  const deliveries: Promise<boolean>[] = []

  const hook = process.env.LEAD_WEBHOOK_URL
  if (hook)
    deliveries.push(
      fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
        .then((r) => r.ok).catch(() => false),
    )

  const key = process.env.RESEND_API_KEY
  const to = process.env.LEAD_EMAIL_TO
  if (key && to)
    deliveries.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.LEAD_EMAIL_FROM || 'LawMatchNow <leads@lawmatchnow.com>',
          to: to.split(',').map((s) => s.trim()),
          reply_to: lead.email,
          subject: `New ${kind.replace('-', ' ')}: ${lead.name}${lead.practice ? ` (${lead.practice})` : ''}`,
          html: `<table>${Object.entries(lead).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`,
        }),
      }).then((r) => r.ok).catch(() => false),
    )

  if (!deliveries.length) {
    console.error('[lead] no delivery configured; set LEAD_WEBHOOK_URL or RESEND_API_KEY + LEAD_EMAIL_TO')
    return NextResponse.json({ error: 'Our form is temporarily unavailable. Please email us instead.' }, { status: 503 })
  }
  const results = await Promise.all(deliveries)
  if (!results.some(Boolean)) return NextResponse.json({ error: 'We couldn’t send that just now. Please try again.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
