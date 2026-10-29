// A business's personal link from an outreach email (lib/outreach): counts
// the visit, then opens their free redesign preview.

import { PROSPECT_TOKEN } from '@/lib/prospects'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const home = new URL('/redesign', req.url)
  if (!PROSPECT_TOKEN.test(token)) return Response.redirect(home, 302)
  const store = getStore()
  const p = await store.prospect(token)
  if (!p?.previewId) return Response.redirect(home, 302)
  // Link checkers in mail systems open links too; a HEAD or bot visit still
  // counts, which only means we follow up less. Never more.
  await store.saveProspect({ ...p, views: (p.views ?? 0) + 1, viewedAt: p.viewedAt ?? new Date().toISOString() })
  const preview = await store.preview(p.previewId)
  return Response.redirect(new URL(preview ? `/redesign/${p.previewId}` : '/redesign', req.url), 302)
}
