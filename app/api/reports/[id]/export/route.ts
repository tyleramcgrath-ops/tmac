import { NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { reportToCsv } from '@/lib/export/csv'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const format = new URL(request.url).searchParams.get('format') ?? 'json'

  const store = await getStore()
  const report = await store.getReport(id)
  if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
  if (report.status !== 'complete') {
    return NextResponse.json({ error: 'The report is not complete yet.' }, { status: 409 })
  }

  const slug = `seo-report-${report.input.keyword.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${id.slice(0, 8)}`

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
    // Raw JSON — full crawl/analysis data for inspection and debugging.
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${slug}.json"`,
      },
    })
  } catch (err) {
    console.error('[api] export failed:', err)
    return NextResponse.json({ error: 'Export failed.' }, { status: 500 })
  }
}
