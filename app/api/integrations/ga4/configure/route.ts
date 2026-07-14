// Configure which GA4 property to use for a project

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
  const ga4PropertyId = String(body.ga4PropertyId ?? '')

  if (!projectId || !ga4PropertyId) {
    return Response.json(
      { error: 'projectId and ga4PropertyId are required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    // Get project to find organizationId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Update OAuth credential with GA4 property ID
    await prisma.oAuthCredential.update({
      where: {
        organizationId_provider_projectId: {
          organizationId: project.organizationId,
          projectId,
          provider: 'google',
        },
      },
      data: {
        ga4PropertyId,
      },
    })

    return Response.json({
      success: true,
      message: `GA4 property configured for project ${projectId}`,
    })
  } catch (err) {
    console.error('[ga4/configure] Error', err)
    return Response.json(
      { error: `Failed to configure GA4 property: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
