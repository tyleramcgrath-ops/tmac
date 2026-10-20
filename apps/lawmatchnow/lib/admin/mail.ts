// Sends email through SMTP (a SiteGround mailbox, as SaySites does) or, if
// that isn't set up, through Resend. Either is optional.
//   SMTP_USER, SMTP_PASS, SMTP_HOST (default mail.lawmatchnow.com), SMTP_PORT (465)
//   RESEND_API_KEY
//   MAIL_FROM (default "LawMatchNow <leads@lawmatchnow.com>")

import nodemailer, { type Transporter } from 'nodemailer'

type Mail = { to: string | string[]; subject: string; html: string; replyTo?: string }

const FROM = () => process.env.MAIL_FROM || process.env.LEAD_EMAIL_FROM || 'LawMatchNow <leads@lawmatchnow.com>'

export const mailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS) || !!process.env.RESEND_API_KEY

let transport: Transporter | null = null

export async function sendMail(m: Mail): Promise<boolean> {
  const to = Array.isArray(m.to) ? m.to : m.to.split(',').map((s) => s.trim()).filter(Boolean)
  if (!to.length) return false
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 465
      transport ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.lawmatchnow.com', port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transport.sendMail({ from: FROM(), to, subject: m.subject, html: m.html, replyTo: m.replyTo })
      return true
    }
    if (process.env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM(), to, subject: m.subject, html: m.html, ...(m.replyTo ? { reply_to: m.replyTo } : {}) }),
      })
      return r.ok
    }
  } catch (err) {
    console.error('[mail]', (err as Error).message)
  }
  return false
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
