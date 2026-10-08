// Unsubscribe from outreach emails: the one-click button mail apps show
// (List-Unsubscribe-Post) and the form on /unsubscribe/<token>. The business
// is never emailed again, by address or website (lib/prospects blockedBy).

import { PROSPECT_TOKEN } from '@/lib/prospects'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const url = new URL(req.url)
  let token = url.searchParams.get('t') ?? ''
  if (!token) {
    const form = await req.formData().catch(() => null)
    token = String(form?.get('t') ?? '')
  }
  if (PROSPECT_TOKEN.test(token)) {
    const store = getStore()
    const p = await store.prospect(token)
    if (p && !p.unsubscribedAt) await store.saveProspect({ ...p, unsubscribedAt: new Date().toISOString() })
  }
  // Mail apps' one-click requests only need a 200; people get the page.
  if (url.searchParams.get('t')) return new Response('Unsubscribed.', { headers: { 'content-type': 'text/plain' } })
  return Response.redirect(new URL(`/unsubscribe/${PROSPECT_TOKEN.test(token) ? token : 'x'}?done=1`, req.url), 303)
}
