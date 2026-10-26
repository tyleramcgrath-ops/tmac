// The browser check of a preview's exact copy reports here
// (scripts/compare-preview.ts --preview <id>); see recordCheck.

import { recordCheck } from '@/lib/redesign'
import { getStore } from '@/lib/store'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const r = await recordCheck(getStore(), id, req.headers.get('authorization') ?? '', body)
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}
