'use server'

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { sendMail } from '@/lib/mail'
import { pruneReleases } from '@/lib/prune-releases'
import { requireUser } from '@/lib/session'

async function admin() {
  const user = await requireUser()
  if (!isAdmin(user.email)) redirect('/dashboard')
  return user
}

// Sends one email to the signed-in admin through the same mailbox the
// lead emails use, and reports exactly what the mail server answered.
export async function sendTestEmail(): Promise<void> {
  const user = await admin()
  const r = await sendMail({
    to: user.email,
    subject: 'SaySites test email',
    text: 'This is a test from SaySites. If you can read it, lead replies, alerts, review requests and the monthly report can be sent.\n\nhttps://saysites.com/dashboard/health',
    fromName: 'SaySites',
  })
  redirect(`/dashboard/health?mail=${r.ok ? 'ok' : encodeURIComponent(r.error)}`)
}

// Runs the old-release cleanup now instead of waiting for the next start.
export async function cleanUpNow(): Promise<void> {
  await admin()
  const removed = pruneReleases()
  redirect(`/dashboard/health?pruned=${removed.length}`)
}
