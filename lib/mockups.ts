// Free homepage mockups: a business asks (on /mockup, or by replying
// "mockup" to an outreach email) and the team sends back one picture of
// their homepage redesigned on SaySites (scripts/mockup.ts makes it). The
// requests list lives at /dashboard/mockups for admins.

export interface MockupRequest {
  id: string
  url: string
  name: string
  email: string
  business?: string
  note?: string
  at: string
  status: 'new' | 'sent'
  sentAt?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The website address, tidied, or null when it isn't one.
export function cleanSiteUrl(input: string): string | null {
  const t = input.trim().slice(0, 300)
  if (!t) return null
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return null
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return null
  }
}

export function readMockupForm(form: FormData): { ok: Omit<MockupRequest, 'id' | 'at' | 'status'> } | { error: string } {
  const s = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max)
  const url = cleanSiteUrl(s('url', 300))
  if (!url) return { error: 'Enter your website’s address, like yourbusiness.com.' }
  const name = s('name', 120)
  if (!name) return { error: 'Tell us your name.' }
  const email = s('email', 200)
  if (!EMAIL.test(email)) return { error: 'That email address doesn’t look right.' }
  const business = s('business', 120)
  const note = s('note', 600)
  return { ok: { url, name, email, ...(business ? { business } : {}), ...(note ? { note } : {}) } }
}
