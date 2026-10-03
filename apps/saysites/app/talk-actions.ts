'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { validEmail } from '@/lib/auth'
import { getStore } from '@/lib/store'

// "Let's talk": a business asking SaySites to build its site. It lands in the
// team's inbox (dashboard Feedback, marked "Let's talk"), then the visitor
// sees a thank-you on the page they came from. Works without JavaScript.
export async function sendLead(form: FormData): Promise<void> {
  const from = String(form.get('from') ?? '/')
  const back = /^\/[\w/-]*$/.test(from) ? from : '/'
  if (String(form.get('website_hp') ?? '')) redirect(`${back}?sent=1#talk`) // bots fill the hidden field
  const get = (k: string, max: number) => String(form.get(k) ?? '').trim().replace(/\s+/g, ' ').slice(0, max)
  const name = get('name', 80)
  const email = get('email', 200)
  const phone = get('phone', 40)
  if (!name || (!validEmail(email) && phone.replace(/\D/g, '').length < 7)) redirect(`${back}?talk=missing#talk`)
  const lines = [
    get('business', 120) && `Business: ${get('business', 120)}`,
    get('industry', 60) && `Industry: ${get('industry', 60)}`,
    get('site', 200) && `Website: ${get('site', 200)}`,
    phone && `Phone: ${phone}`,
    String(form.get('message') ?? '').trim().slice(0, 2000),
  ].filter(Boolean)
  await getStore().addFeedback({ id: randomUUID(), userId: null, name, email, text: lines.join('\n'), page: `Let’s talk, ${back}`, at: new Date().toISOString() })
  redirect(`${back}?sent=1#talk`)
}
