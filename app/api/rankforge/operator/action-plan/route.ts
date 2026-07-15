import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'
import { buildActionPlan } from '@/lib/operator/action-plans'
import type { Candidate } from '@/lib/operator/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const candidateId = searchParams.get('candidateId')
      if (!projectId || !candidateId) {
        return Response.json({ error: 'Missing projectId or candidateId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const row = await prisma.operatorCandidate.findFirst({
        where: { id: candidateId, projectId },
      })
      if (!row) return Response.json({ error: 'Candidate not found' }, { status: 404 })

      // Hydrate into the in-memory Candidate shape the plan builder expects.
      const candidate: Candidate = {
        id: row.id,
        pageUrl: row.primaryPageUrl,
        recommendationType: row.actionType,
        source: row.sourceSystem as any,
        estimatedMinutes: row.estimatedMinutes,
        rawScore: 0,
        confidence: row.confidence,
        evidence: (row.evidence as any) ?? [],
        metadata: (row.decisionScores as any) ?? {},
      }
      const plan = buildActionPlan(candidate, {
        hasWordpressIntegration: false,
        moneyPageSupportingCount: 0,
      })
      return Response.json({ success: true, plan })
    } catch (error) {
      console.error('[operator:action-plan]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Action-plan failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
