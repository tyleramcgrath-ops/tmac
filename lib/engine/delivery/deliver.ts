// Delivery surface — the Compass reaches out instead of waiting to be opened.
// Slack (incoming webhook) and email (Resend) are live when configured; each
// returns an honest result and never pretends to have sent when it hasn't.

import type { MonitoredSite } from '../monitoring/types'
import type { WhileYouWereAwayBrief } from '../monitoring/types'

export type DeliveryChannel = 'slack' | 'email'

export interface DeliveryResult {
  channel: DeliveryChannel
  delivered: boolean
  message: string
}

function briefLines(brief: WhileYouWereAwayBrief): string[] {
  if (brief.nothingChanged) return ['Nothing material moved since the last check.']
  return brief.items.map((it) => `${it.good ? '▲' : '▼'} ${it.headline} — ${it.detail}`)
}

function scoreLine(brief: WhileYouWereAwayBrief): string | null {
  if (brief.siteScore == null) return null
  const chg = brief.siteScoreChange
  const suffix = chg == null || chg === 0 ? '' : ` (${chg > 0 ? '+' : ''}${chg})`
  return `Site score: ${brief.siteScore}/100${suffix}`
}

async function sendSlack(webhookUrl: string, site: MonitoredSite, brief: WhileYouWereAwayBrief): Promise<DeliveryResult> {
  const header = `*North Star — ${site.label}*\n${brief.headline}`
  const score = scoreLine(brief)
  const text = [header, score, '', ...briefLines(brief)].filter(Boolean).join('\n')
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { channel: 'slack', delivered: false, message: `Slack returned HTTP ${res.status}.` }
    return { channel: 'slack', delivered: true, message: 'Brief posted to Slack.' }
  } catch (err) {
    return { channel: 'slack', delivered: false, message: `Could not reach Slack: ${err instanceof Error ? err.message : 'network error'}` }
  }
}

function briefHtml(site: MonitoredSite, brief: WhileYouWereAwayBrief): string {
  const rows = briefLines(brief)
    .map((l) => `<li style="margin:6px 0;color:#2b2b2b;font-size:15px;">${escapeHtml(l)}</li>`)
    .join('')
  const score = scoreLine(brief)
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;">
    <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9a8f78;">North Star · ${escapeHtml(site.label)}</p>
    <h1 style="font-size:22px;color:#1a1a1a;margin:6px 0 4px;">${escapeHtml(brief.headline)}</h1>
    ${score ? `<p style="color:#6b6b6b;margin:0 0 14px;">${escapeHtml(score)}</p>` : ''}
    <ul style="padding-left:18px;margin:0;">${rows}</ul>
  </div>`
}

async function sendEmail(to: string, site: MonitoredSite, brief: WhileYouWereAwayBrief): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { channel: 'email', delivered: false, message: 'Email not connected. Add a RESEND_API_KEY to send the brief by email.' }
  }
  const from = process.env.NORTH_STAR_FROM_EMAIL || 'North Star <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `North Star — ${brief.headline}`, html: briefHtml(site, brief) }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { channel: 'email', delivered: false, message: `Email provider returned HTTP ${res.status}.` }
    return { channel: 'email', delivered: true, message: `Brief emailed to ${to}.` }
  } catch (err) {
    return { channel: 'email', delivered: false, message: `Could not send email: ${err instanceof Error ? err.message : 'network error'}` }
  }
}

/** Deliver a brief to every channel the site has connected. */
export async function deliverBrief(site: MonitoredSite, brief: WhileYouWereAwayBrief): Promise<DeliveryResult[]> {
  const out: DeliveryResult[] = []
  const slack = site.connections?.slack
  if (slack?.connected && slack.webhookUrl) out.push(await sendSlack(slack.webhookUrl, site, brief))
  const email = site.connections?.email
  if (email?.connected && email.address) out.push(await sendEmail(email.address, site, brief))
  return out
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
