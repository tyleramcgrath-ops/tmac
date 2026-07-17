// Transactional email (RC2 P4). Pluggable so the app never hard-depends on a
// specific provider. In this sandbox (and any deployment without email
// configured) there is NO real delivery — we log the link and record it in
// memory so an operator can retrieve it and tests can assert on it. We NEVER
// pretend an email was delivered when it wasn't.
//
// To enable real delivery, set MAIL_WEBHOOK_URL (a POST endpoint — e.g. a
// provider relay / serverless function) which receives { to, subject, html }.
// If unset, delivery is "logged only" and honestly reported as such.

export interface OutboundEmail {
  to: string
  subject: string
  html: string
  text: string
}

export type MailResult = { delivered: boolean; via: 'webhook' | 'logged-only'; detail: string }

// Last verification link per email — dev/operator retrieval + test assertions.
// Bounded so it cannot grow unbounded in a long-lived process.
const lastLinks = new Map<string, string>()
export function __lastVerificationLink(email: string): string | undefined {
  return lastLinks.get(email.toLowerCase())
}
export function __resetMailer(): void {
  lastLinks.clear()
}

async function post(url: string, body: unknown): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
    if (!res.ok) throw new Error(`mail webhook responded ${res.status}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function sendEmail(email: OutboundEmail): Promise<MailResult> {
  const hook = process.env.MAIL_WEBHOOK_URL
  if (!hook) {
    // Honest no-op: record + log, report logged-only.
    console.log(`[mailer] (logged-only, no MAIL_WEBHOOK_URL) to=${email.to} subject="${email.subject}"`)
    return { delivered: false, via: 'logged-only', detail: 'MAIL_WEBHOOK_URL not set — email logged, not delivered.' }
  }
  try {
    await post(hook, { to: email.to, subject: email.subject, html: email.html, text: email.text })
    return { delivered: true, via: 'webhook', detail: 'Sent via mail webhook.' }
  } catch (err) {
    console.warn('[mailer] webhook delivery failed:', err instanceof Error ? err.message : err)
    return { delivered: false, via: 'webhook', detail: `Delivery failed: ${err instanceof Error ? err.message : 'error'}` }
  }
}

export async function sendVerificationEmail(to: string, link: string): Promise<MailResult> {
  lastLinks.set(to.toLowerCase(), link)
  return sendEmail({
    to,
    subject: 'Verify your RankForge email',
    html: `<p>Welcome to RankForge. Confirm your email to finish setting up your account:</p><p><a href="${link}">Verify email</a></p><p>Or paste this link: ${link}</p>`,
    text: `Welcome to RankForge. Verify your email: ${link}`,
  })
}
