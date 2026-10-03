// Email from SaySites, sent through the saysites.com mailbox on SiteGround
// (SMTP). Free: the mailbox comes with the hosting plan. Off until
// SMTP_USER and SMTP_PASS are set; nothing pretends to send without them.
//
// Messages go out from the mailbox address under the business's name, with
// Reply-To set to the business, so a lead's reply reaches the owner.

import nodemailer, { type Transporter } from 'nodemailer'

export interface Mail {
  to: string
  subject: string
  text: string
  fromName?: string
  replyTo?: string
}

export type MailResult = { ok: true } | { ok: false; error: string }

export function mailReady(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function mailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || ''
}

let transport: Transporter | null = null
function transporter(): Transporter {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465)
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.saysites.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    })
  }
  return transport
}

// A display name can't break out of its quotes or add headers.
const cleanName = (s: string) => s.replace(/["\r\n<>]/g, '').trim().slice(0, 80)
const cleanLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

export async function sendMail(m: Mail): Promise<MailResult> {
  if (!mailReady()) return { ok: false, error: 'Email isn’t set up yet.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.to)) return { ok: false, error: 'That email address doesn’t look right.' }
  const from = mailFrom()
  try {
    await transporter().sendMail({
      from: m.fromName ? `"${cleanName(m.fromName)}" <${from}>` : from,
      to: m.to,
      subject: cleanLine(m.subject).slice(0, 200),
      text: m.text,
      ...(m.replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.replyTo) ? { replyTo: m.replyTo } : {}),
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : 'Could not send.' }
  }
}
