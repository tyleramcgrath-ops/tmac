import { NextResponse } from 'next/server'
import { getStore } from '@/lib/engine/db'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  try {
    const store = await getStore()
    const report = await store.getReport(id)
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    return NextResponse.json({ report })
  } catch (err) {
    console.error('[api] get report failed:', err)
    return NextResponse.json({ error: 'Failed to load the report.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  try {
    const store = await getStore()
    const deleted = await store.deleteReport(id)
    if (!deleted) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api] delete report failed:', err)
    return NextResponse.json({ error: 'Failed to delete the report.' }, { status: 500 })
  }
}
