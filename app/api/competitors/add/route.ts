// Add competitor to a project

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
  const domain = String(body.domain ?? '').toLowerCase().trim()
  const displayName = String(body.displayName ?? domain)
  const industry = body.industry ? String(body.industry) : undefined
  const notes = body.notes ? String(body.notes) : undefined

  if (!projectId || !domain) {
    return Response.json(
      { error: 'projectId and domain are required.' },
      { status: 400 }
    )
  }

  // Basic domain validation
  if (!domain.includes('.')) {
    return Response.json(
      { error: 'Invalid domain format.' },
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

    // Check if competitor already exists
    const existing = await prisma.competitor.findUnique({
      where: { projectId_domain: { projectId, domain } },
    })

    if (existing) {
      return Response.json(
        { error: 'Competitor already added for this domain.' },
        { status: 409 }
      )
    }

    // Create competitor
    const competitor = await prisma.competitor.create({
      data: {
        projectId,
        domain,
        displayName,
        industry,
        notes,
        monitoringStatus: 'active',
        crawlFrequency: 7,
      },
    })

    return Response.json({
      success: true,
      competitor: {
        id: competitor.id,
        domain: competitor.domain,
        displayName: competitor.displayName,
        industry: competitor.industry,
        monitoringStatus: competitor.monitoringStatus,
        crawlFrequency: competitor.crawlFrequency,
        dateAdded: competitor.dateAdded,
      },
    })
  } catch (err) {
    console.error('[competitors/add] Error', err)
    return Response.json(
      { error: `Failed to add competitor: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
