// Initiates Google OAuth flow for GSC and GA4 integrations

import { buildGoogleOAuthUrl } from '@/lib/google-oauth'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const projectId = String(body.projectId ?? '')
  const provider = String(body.provider ?? 'google') // 'google' for both GSC and GA4

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
  }

  try {
    const { getPrismaClient } = await import('@/lib/db')
    const prisma = getPrismaClient()
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } })
    if (!project || project.organizationId !== session.organizationId) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Build state: projectId:provider:timestamp:organizationId (base64 encoded).
    // The callback verifies BOTH that the caller's session still owns this
    // project AND that the organizationId embedded here matches — binding the
    // OAuth round-trip to the session that started it, so a state value
    // crafted or replayed against a different account cannot attach its
    // Google credential to a project the attacker doesn't own.
    const state = Buffer.from(
      `${projectId}:${provider}:${Date.now()}:${session.organizationId}`
    ).toString('base64')

    // GSC and GA4 use the same scopes
    const scopes = [
      'https://www.googleapis.com/auth/webmasters', // Google Search Console
      'https://www.googleapis.com/auth/analytics.readonly', // Google Analytics (read-only)
    ]

    const authUrl = buildGoogleOAuthUrl(scopes, state)

    return Response.json({ authUrl })
  } catch (err) {
    console.error('[auth/google] OAuth URL build failed', err)
    return Response.json(
      { error: 'Failed to build OAuth URL. Check GOOGLE_OAUTH_* environment variables.' },
      { status: 502 }
    )
  }
}
