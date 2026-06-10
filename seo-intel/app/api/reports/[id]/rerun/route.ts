import { NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { newReport, startPipeline } from '@/lib/pipeline'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  try {
    const store = await getStore()
    const existing = await store.getReport(id)
    if (!existing) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })

    const report = newReport(existing.input)
    await store.saveReport(report)
    startPipeline(report)
    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (err) {
    console.error('[api] rerun report failed:', err)
    return NextResponse.json({ error: 'Failed to re-run the report.' }, { status: 500 })
  }
}
