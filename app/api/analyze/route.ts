import { newReport, runAnalysis } from '@/lib/pipeline'
import { validateCountry, validateKeyword, validateLanguage, validateUrl } from '@/lib/validate'
import type { ReportInput } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// One request runs the whole analysis and streams progress, so it needs the
// full pipeline budget. Vercel clamps this to the plan limit (Hobby ~60s, Pro 300s).
export const maxDuration = 300

// On-demand streaming analysis used when persistent history isn't available
// (serverless with no database). Runs the pipeline in a single request and
// streams each progress update as newline-delimited JSON; the final line is the
// complete report. No storage required.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const url = validateUrl(String(body.url ?? ''))
  if (!url.ok) return Response.json({ error: url.error }, { status: 400 })
  const keyword = validateKeyword(String(body.keyword ?? ''))
  if (!keyword.ok) return Response.json({ error: keyword.error }, { status: 400 })
  const country = validateCountry(String(body.country ?? 'us'))
  if (!country.ok) return Response.json({ error: country.error }, { status: 400 })
  const language = validateLanguage(body.language ? String(body.language) : undefined)
  if (!language.ok) return Response.json({ error: language.error }, { status: 400 })

  const input: ReportInput = {
    url: url.value!,
    keyword: keyword.value!,
    country: country.value!,
    device: body.device === 'mobile' ? 'mobile' : 'desktop',
    language: language.value || undefined,
  }

  const report = newReport(input)
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (r: typeof report) => {
        controller.enqueue(encoder.encode(JSON.stringify(r) + '\n'))
      }
      try {
        await runAnalysis(report, emit)
      } catch (err) {
        report.status = 'failed'
        report.error = err instanceof Error ? err.message : 'Unexpected error while building the report.'
        report.completedAt = new Date().toISOString()
        emit(report)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
