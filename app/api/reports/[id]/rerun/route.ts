import { NextResponse } from 'next/server'
import { getStore, StoreConfigError } from '@/lib/engine/db'
import { scheduleBackground } from '@/lib/engine/background'
import { sanitizeKeyOverrides } from '@/lib/engine/config'
import { newReport, startPipeline } from '@/lib/engine/pipeline'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  let keyOverrides
  try {
    keyOverrides = sanitizeKeyOverrides((await request.json())?.keys)
  } catch {
    keyOverrides = undefined
  }
  try {
    const store = await getStore()
    const existing = await store.getReport(id)
    if (!existing) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })

    const report = newReport(existing.input)
    await store.saveReport(report)
    await scheduleBackground(startPipeline(report, keyOverrides))
    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (err) {
    if (err instanceof StoreConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    console.error('[api] rerun report failed:', err)
    return NextResponse.json({ error: 'Failed to re-run the report.' }, { status: 500 })
  }
}
