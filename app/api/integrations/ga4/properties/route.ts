// List GA4 properties for a project to select which one to track

import { getPrismaClient } from '@/lib/db'
import { refreshAccessToken } from '@/lib/google-oauth'
import { getGA4Properties } from '@/lib/ga4-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
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

    const credential = await prisma.oAuthCredential.findUnique({
      where: {
        organizationId_provider_projectId: {
          organizationId: project.organizationId,
          projectId,
          provider: 'google',
        },
      },
    })

    if (!credential) {
      return Response.json(
        { error: 'Google not connected for this project.' },
        { status: 401 }
      )
    }

    // Refresh token if expired
    let accessToken = credential.accessToken
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      if (!credential.refreshToken) {
        return Response.json(
          { error: 'Refresh token expired. Reconnect Google.' },
          { status: 401 }
        )
      }

      const refreshed = await refreshAccessToken(credential.refreshToken)
      accessToken = refreshed.access_token

      // Update credential with new token
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
      await prisma.oAuthCredential.update({
        where: { id: credential.id },
        data: {
          accessToken,
          refreshToken: refreshed.refresh_token || credential.refreshToken,
          expiresAt: newExpiresAt,
        },
      })
    }

    // Fetch GA4 properties
    const properties = await getGA4Properties(accessToken)

    return Response.json({
      properties: properties.map((p) => ({
        id: p.id,
        name: p.displayName,
      })),
    })
  } catch (err) {
    console.error('[ga4/properties] Error', err)
    return Response.json(
      { error: `Failed to fetch GA4 properties: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
