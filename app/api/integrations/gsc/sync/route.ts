// Syncs Google Search Console data for a project

import { getPrismaClient } from '@/lib/db'
import { refreshAccessToken } from '@/lib/google-oauth'
import { fetchGSCPageMetrics, fetchGSCQueriesForPage } from '@/lib/gsc-api'
import { checkRateLimit, clientKey } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const rl = checkRateLimit(clientKey(request, 'gsc-sync'), 5, 60_000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many sync requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const projectId = String(body.projectId ?? '')
  const startDate = String(body.startDate ?? '') // YYYY-MM-DD
  const endDate = String(body.endDate ?? '') // YYYY-MM-DD

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
  }

  try {
    const prisma = getPrismaClient()

    // Get project to find organizationId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true, domain: true },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Get OAuth credential for this project
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
        { error: 'Google Search Console not connected for this project.' },
        { status: 401 }
      )
    }

    // Refresh token if expired
    let accessToken = credential.accessToken
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      if (!credential.refreshToken) {
        return Response.json(
          { error: 'Refresh token expired. Reconnect Google Search Console.' },
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

    // Build date range (if not provided, use last 28 days)
    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // GSC API requires property URL in the format: https://example.com/
    const propertyUrl = `https://${project.domain}/`

    // Fetch page metrics
    const pageMetrics = await fetchGSCPageMetrics(propertyUrl, accessToken, start, end)

    // Store/update metrics for each page
    let syncedCount = 0
    let errors: string[] = []

    for (const metric of pageMetrics) {
      try {
        const normalizedUrl = metric.page.startsWith('http') ? metric.page : `https://${project.domain}${metric.page}`

        // Fetch queries for this page
        const queries = await fetchGSCQueriesForPage(propertyUrl, accessToken, metric.page, start, end)

        // Upsert the metric
        await prisma.googleSearchConsoleMetric.upsert({
          where: {
            organizationId_projectId_url: {
              organizationId: project.organizationId,
              projectId,
              url: normalizedUrl,
            },
          },
          create: {
            organizationId: project.organizationId,
            projectId,
            url: normalizedUrl,
            clicks: metric.clicks,
            impressions: metric.impressions,
            ctr: Math.round(metric.ctr * 100) / 100,
            position: Math.round(metric.position * 100) / 100,
            topQueries: JSON.stringify(queries.slice(0, 10)),
            dataDate: new Date(end),
          },
          update: {
            clicks: metric.clicks,
            impressions: metric.impressions,
            ctr: Math.round(metric.ctr * 100) / 100,
            position: Math.round(metric.position * 100) / 100,
            topQueries: JSON.stringify(queries.slice(0, 10)),
            dataDate: new Date(end),
            syncedAt: new Date(),
          },
        })

        syncedCount += 1
      } catch (err) {
        console.error('[gsc/sync] Error syncing metric for page', metric.page, err)
        errors.push(`Failed to sync ${metric.page}`)
      }
    }

    return Response.json({
      success: true,
      syncedPages: syncedCount,
      totalPages: pageMetrics.length,
      dateRange: { start, end },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[gsc/sync] Sync failed', err)
    return Response.json(
      { error: `GSC sync failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
