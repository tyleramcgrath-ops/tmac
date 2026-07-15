import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { moneyPageIntelligence, moneyPagePortfolio } from '@/lib/pipeline/graph/money-pages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const url = searchParams.get('url')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)

      if (url) {
        const intel = await moneyPageIntelligence({ projectId }, url)
        if (!intel) return Response.json({ error: 'Money page not found in graph' }, { status: 404 })
        return Response.json({ success: true, intel })
      }
      const portfolio = await moneyPagePortfolio({ projectId })
      return Response.json({ success: true, portfolio })
    } catch (error) {
      console.error('[graph:money-pages] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Money page lookup failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
