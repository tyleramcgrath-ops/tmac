// Admin sign-in: one owner account from environment variables, kept in a
// signed, httpOnly cookie (no session table), like SaySites.
//   ADMIN_EMAIL     the owner's email
//   ADMIN_PASSWORD  their password
//   ADMIN_SECRET    32+ random characters used to sign the cookie

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'lmn_admin'
const DAYS = 30

export const adminConfigured = () => adminSetupProblems().length === 0

/** What's wrong with the admin variables, by name only (never values), for the sign-in page. */
export function adminSetupProblems(): string[] {
  const out: string[] = []
  const val = (k: string) => process.env[k]?.trim() ?? ''
  if (!val('ADMIN_EMAIL')) out.push('ADMIN_EMAIL is not set')
  if (!val('ADMIN_PASSWORD')) out.push('ADMIN_PASSWORD is not set')
  if (!val('ADMIN_SECRET')) out.push('ADMIN_SECRET is not set')
  else if (val('ADMIN_SECRET').length < 32) out.push('ADMIN_SECRET is shorter than 32 characters')
  // Names that look like ours but aren't exactly (a space, a typo, lower case).
  const near = Object.keys(process.env).filter((k) => /admin/i.test(k) && !['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SECRET'].includes(k))
  if (out.length && near.length) out.push(`Found similar names that don't match exactly: ${near.map((k) => JSON.stringify(k)).join(', ')}`)
  return out
}

const sign = (payload: string) => createHmac('sha256', process.env.ADMIN_SECRET!.trim()).update(payload).digest('base64url')

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkCredentials(email: string, password: string) {
  if (!adminConfigured()) return false
  // Compare both, always, so timing doesn't reveal which one was wrong.
  const okEmail = same(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase())
  const okPass = same(password, process.env.ADMIN_PASSWORD!.trim())
  return okEmail && okPass
}

export async function startSession() {
  const exp = Date.now() + DAYS * 86400_000
  const payload = `${process.env.ADMIN_EMAIL}|${exp}`
  ;(await cookies()).set(COOKIE, `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: DAYS * 86400,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function isAdmin() {
  if (!adminConfigured()) return false
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return false
  const [b64, sig] = raw.split('.')
  if (!b64 || !sig) return false
  const payload = Buffer.from(b64, 'base64url').toString()
  if (!same(sig, sign(payload))) return false
  const [email, exp] = payload.split('|')
  return email === process.env.ADMIN_EMAIL && Number(exp) > Date.now()
}

/** For admin pages and actions: sends anyone else to the sign-in page. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login')
}
