import { withAuth } from '@/lib/authorize'
import { readLatencyStats, resetLatencyStats } from '@/lib/pipeline/graph/metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async () => {
    return Response.json({ success: true, stats: readLatencyStats() })
  })
  return handler(request)
}

export async function DELETE(request: Request) {
  const handler = await withAuth(async () => {
    resetLatencyStats()
    return Response.json({ success: true, reset: true })
  })
  return handler(request)
}
