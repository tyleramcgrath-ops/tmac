'use server'

import { randomUUID } from 'crypto'
import { validEmail } from '@/lib/auth'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export interface FeedbackState {
  sent?: boolean
  error?: string
}

// Anyone can tell us what they think: signed-in owners from the dashboard,
// or visitors from the birthday page.
export async function sendFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  if (String(form.get('website') ?? '')) return { sent: true } // bots fill the hidden field
  const text = String(form.get('text') ?? '').trim().slice(0, 3000)
  if (text.length < 3) return { error: 'Write a few words first.' }
  const user = await currentUser()
  const email = user?.email ?? String(form.get('email') ?? '').trim().slice(0, 200)
  if (!user && email && !validEmail(email)) return { error: 'That email doesn’t look right.' }
  await getStore().addFeedback({
    id: randomUUID(),
    userId: user?.id ?? null,
    name: user?.name ?? String(form.get('name') ?? '').trim().slice(0, 80),
    email,
    text,
    page: String(form.get('page') ?? '').slice(0, 200),
    at: new Date().toISOString(),
  })
  return { sent: true }
}
