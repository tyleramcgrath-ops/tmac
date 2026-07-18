import { NextResponse } from 'next/server'
import { getStore, isHistoryEnabled, StoreConfigError } from '@/lib/engine/db'
import { scheduleBackground } from '@/lib/engine/background'
import { sanitizeKeyOverrides } from '@/lib/engine/config'
import { newReport, startPipeline } from '@/lib/engine/pipeline'
import { validateCountry, validateKeyword, validateLanguage, validateUrl } from '@/lib/engine/validate'
import type { ReportInput } from '@/lib/engine/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Keep the serverless instance alive long enough for the pipeline to finish via
// waitUntil(). Vercel clamps this to the plan limit (Hobby ~60s, Pro 300s).
export const maxDuration = 300

export async function GET() {
  if (!isHistoryEnabled()) {
    // No persistent store on this deployment — there is no history to list.
    return NextResponse.json({ reports: [], historyEnabled: false })
  }
  try {
    const store = await getStore()
    return NextResponse.json({ reports: await store.listReports(), historyEnabled: true })
  } catch (err) {
    console.error('[api] list reports failed:', err)
    return NextResponse.json({ error: 'Failed to load reports.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const url = validateUrl(String(body.url ?? ''))
  if (!url.ok) return NextResponse.json({ error: url.error }, { status: 400 })

  const keyword = validateKeyword(String(body.keyword ?? ''))
  if (!keyword.ok) return NextResponse.json({ error: keyword.error }, { status: 400 })

  const country = validateCountry(String(body.country ?? 'us'))
  if (!country.ok) return NextResponse.json({ error: country.error }, { status: 400 })

  const language = validateLanguage(body.language ? String(body.language) : undefined)
  if (!language.ok) return NextResponse.json({ error: language.error }, { status: 400 })

  const device = body.device === 'mobile' ? 'mobile' : 'desktop'
  const keyOverrides = sanitizeKeyOverrides(body.keys)

  const input: ReportInput = {
    url: url.value!,
    keyword: keyword.value!,
    country: country.value!,
    device,
    language: language.value || undefined,
  }

  try {
    const store = await getStore()
    const report = newReport(input)
    await store.saveReport(report)
    await scheduleBackground(startPipeline(report, keyOverrides))
    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (err) {
    if (err instanceof StoreConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    console.error('[api] create report failed:', err)
    return NextResponse.json({ error: 'Failed to start the analysis.' }, { status: 500 })
  }
}
