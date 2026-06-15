import { NextResponse } from 'next/server'
import { reportToCsv } from '@/lib/export/csv'
import type { Report } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Stateless export: accepts a full report in the request body and returns the
// requested format. Used by the no-database (streaming) mode, where the report
// only exists in the browser and isn't in any store.
export async function POST(request: Request) {
  const format = new URL(request.url).searchParams.get('format') ?? 'json'

  let report: Report
  try {
    const body = await request.json()
    report = body.report as Report
    if (!report || typeof report !== 'object' || !report.input) throw new Error('missing report')
  } catch {
    return NextResponse.json({ error: 'A report object is required in the request body.' }, { status: 400 })
  }

  const slug = `seo-report-${report.input.keyword.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${(report.id ?? 'export').slice(0, 8)}`

  try {
    if (format === 'csv') {
      return new NextResponse(reportToCsv(report), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}.csv"`,
        },
      })
    }
    if (format === 'pdf') {
      const { reportToPdf } = await import('@/lib/export/pdf')
      const pdf = await reportToPdf(report)
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        },
      })
    }
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${slug}.json"`,
      },
    })
  } catch (err) {
    console.error('[api] stateless export failed:', err)
    return NextResponse.json({ error: 'Export failed.' }, { status: 500 })
  }
}
