import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin/auth'
import { leadsCsv, listLeads } from '@/lib/admin/leads'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await isAdmin())) return new NextResponse('Not found', { status: 404 })
  const p = new URL(req.url).searchParams
  const leads = await listLeads({ stage: p.get('stage') ?? undefined, kind: p.get('kind') ?? undefined, search: p.get('q') ?? undefined, limit: 10000 })
  return new NextResponse(leadsCsv(leads), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="lawmatchnow-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  })
}
