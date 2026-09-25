'use server'

import { randomUUID } from 'crypto'
import { validEmail } from '@/lib/auth'
import { FEEDBACK_MIN_CHARS, newBilling, withFeedbackReward } from '@/lib/billing'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export interface FeedbackState {
  sent?: boolean
  error?: string
  // Set when this feedback earned the account its free months.
  freeUntil?: string
}

// Anyone can tell us what they think: signed-in owners from the dashboard,
// or visitors from the birthday page. A signed-in owner's first real
// feedback (a few sentences) earns three months free (lib/billing).
export async function sendFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  if (String(form.get('website') ?? '')) return { sent: true } // bots fill the hidden field
  const text = String(form.get('text') ?? '').trim().slice(0, 3000)
  if (text.length < 3) return { error: 'Write a few words first.' }
  const user = await currentUser()
  const email = user?.email ?? String(form.get('email') ?? '').trim().slice(0, 200)
  if (!user && email && !validEmail(email)) return { error: 'That email doesn’t look right.' }
  const store = getStore()
  await store.addFeedback({
    id: randomUUID(),
    userId: user?.id ?? null,
    name: user?.name ?? String(form.get('name') ?? '').trim().slice(0, 80),
    email,
    text,
    page: String(form.get('page') ?? '').slice(0, 200),
    at: new Date().toISOString(),
  })
  if (user && text.length >= FEEDBACK_MIN_CHARS) {
    const current = (await store.billing(user.id)) ?? newBilling(new Date(user.createdAt).getTime())
    const next = withFeedbackReward(current)
    if (next) {
      await store.saveBilling(user.id, next)
      return { sent: true, freeUntil: next.trialEndsAt }
    }
  }
  return { sent: true }
}
