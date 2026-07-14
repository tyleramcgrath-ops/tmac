// Create work items from recommendations

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const projectId = String(body.projectId ?? '')
  const recommendations = Array.isArray(body.recommendations) ? body.recommendations : []

  if (!projectId || recommendations.length === 0) {
    return Response.json(
      { error: 'projectId and recommendations array are required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Create work items for each recommendation
    const created: string[] = []
    const errors: string[] = []

    for (const rec of recommendations) {
      try {
        const item = await prisma.workItem.create({
          data: {
            projectId,
            url: String(rec.url ?? ''),
            type: String(rec.type ?? ''),
            title: String(rec.title ?? ''),
            description: rec.description ? String(rec.description) : null,
            why: rec.why ? String(rec.why) : null,
            estimatedTraffic: parseInt(String(rec.impact?.traffic ?? 0), 10),
            estimatedRevenue: parseFloat(String(rec.impact?.revenue ?? 0)),
            priority: String(rec.priority ?? 'medium'),
            confidence: parseInt(String(rec.confidence ?? 0), 10),
            status: 'detected',
          },
        })
        created.push(item.id)
      } catch (err) {
        errors.push(`Failed to create work item for ${rec.type}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
      workItemIds: created,
    })
  } catch (err) {
    console.error('[work-items/create] Error', err)
    return Response.json(
      { error: `Failed to create work items: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
