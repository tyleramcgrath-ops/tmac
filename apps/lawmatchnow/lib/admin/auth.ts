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

export const adminConfigured = () =>
  !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD && (process.env.ADMIN_SECRET?.length ?? 0) >= 32

const sign = (payload: string) => createHmac('sha256', process.env.ADMIN_SECRET!).update(payload).digest('base64url')

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkCredentials(email: string, password: string) {
  if (!adminConfigured()) return false
  // Compare both, always, so timing doesn't reveal which one was wrong.
  const okEmail = same(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase())
  const okPass = same(password, process.env.ADMIN_PASSWORD!)
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
