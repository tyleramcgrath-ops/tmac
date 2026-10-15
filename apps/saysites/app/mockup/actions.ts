'use server'

import { createHash, randomUUID } from 'crypto'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { mailReady, sendMail } from '@/lib/mail'
import { readMockupForm } from '@/lib/mockups'
import { getStore } from '@/lib/store'

export interface MockupState {
  error?: string
  done?: boolean
}

const PER_DAY = 3

export async function requestMockup(_prev: MockupState, form: FormData): Promise<MockupState> {
  // People never see this field; bots fill it in.
  if (String(form.get('website') ?? '')) return { done: true }
  const r = readMockupForm(form)
  if ('error' in r) return { error: r.error }
  const store = getStore()
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const who = createHash('sha256').update(`${ip}|${process.env.SAYSITES_SECRET ?? ''}`).digest('hex').slice(0, 24)
  const recent = (await store.mockups(500)).filter((m) => Date.now() - Date.parse(m.at) < 86_400_000)
  if (recent.filter((m) => m.email.toLowerCase() === r.ok.email.toLowerCase() || m.note === `ip:${who}`).length >= PER_DAY) return { error: 'We already have your request. Your mockup is on its way.' }
  const req = { id: `m_${randomUUID().replace(/-/g, '').slice(0, 16)}`, ...r.ok, at: new Date().toISOString(), status: 'new' as const }
  await store.saveMockup(req)
  // Tell the team there's one to make.
  const team = (process.env.SAYSITES_ADMIN_EMAILS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  if (team.length && mailReady())
    after(async () => {
      for (const to of team)
        await sendMail({ to, subject: `Mockup request: ${req.business ?? req.url}`, text: `${req.name} (${req.email}) asked for a free homepage mockup of ${req.url}.${req.note ? `\n\nTheir note: ${req.note}` : ''}\n\nAll requests: https://saysites.com/dashboard/mockups`, fromName: 'SaySites', replyTo: req.email }).catch(() => {})
    })
  return { done: true }
}
