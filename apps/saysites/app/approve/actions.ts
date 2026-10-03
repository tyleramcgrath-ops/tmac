'use server'

import { getStore } from '@/lib/store'
import { APPROVE_CODE } from '@/lib/urls'

export interface ChangeState {
  error?: string
  saved?: string
}

// The client asks for changes before approving: it lands in the site's
// Messages, where the team building it sees it.
export async function requestChanges(code: string, _prev: ChangeState, form: FormData): Promise<ChangeState> {
  if (!APPROVE_CODE.test(code)) return { error: 'This link is not valid.' }
  if (String(form.get('website') ?? '')) return { saved: 'Thanks, we have your notes.' }
  const store = getStore()
  const site = await store.siteByHandoff(code)
  if (!site) return { error: 'This link has already been used, or has been replaced.' }
  const body = String(form.get('notes') ?? '').trim().slice(0, 4000)
  if (body.length < 3) return { error: 'Tell us what you would like changed.' }
  const name = String(form.get('name') ?? '').trim().slice(0, 80)
  const email = String(form.get('email') ?? '').trim().slice(0, 200)
  await store.addMessage({ siteId: site.id, name: name || 'Client', email, phone: '', body: `Changes requested before approval:\n\n${body}`, page: `/approve/${code}` })
  return { saved: 'Thanks. We will make the changes and send you the same link again when they are ready.' }
}
