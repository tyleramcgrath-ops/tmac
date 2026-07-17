// Project-scoped rank tracking with persistence.
//
// Runs a live rank check for a project's tracked keywords (or a supplied list),
// stores each result as a RankingCheck row, and updates the Keyword's
// current/previous/best position. Honesty rules from the spec are enforced in
// lib/rankings/track.ts: unavailable checks are recorded as unavailable and
// never overwrite a previously observed position with a guess.

import { getCurrentSession } from '@/lib/session'
import { summarizeRankChecks, type RankCheckResult } from '@/lib/rankings/track'
import { getRankProvider, getProviderStatus } from '@/lib/rankings/provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Sign in to track rankings.' }, { status: 401 })
  }
  const organizationId = session.organizationId

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const projectId = String(body.projectId ?? '')
  if (!projectId) return Response.json({ error: 'Missing projectId.' }, { status: 400 })

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.organizationId !== organizationId) {
    return Response.json({ error: 'Project not found.' }, { status: 404 })
  }

  // Which keywords to check: an explicit list, or the project's tracked keywords.
  const explicit: string[] = Array.isArray(body.keywords)
    ? body.keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
    : []

  let keywordRecords: { id: string; keyword: string; currentPosition: number | null; bestPosition: number | null }[]
  if (explicit.length > 0) {
    // Ensure each explicit keyword exists as a tracked Keyword, then check those.
    keywordRecords = []
    for (const kw of explicit.slice(0, 25)) {
      const normalizedKeyword = kw.toLowerCase().replace(/\s+/g, ' ').trim()
      const rec = await prisma.keyword.upsert({
        where: { projectId_normalizedKeyword: { projectId, normalizedKeyword } },
        create: {
          organizationId, projectId, keyword: kw, normalizedKeyword,
          type: 'primary', intent: 'informational', status: 'tracking', confidence: 0,
        },
        update: { status: 'tracking' },
        select: { id: true, keyword: true, currentPosition: true, bestPosition: true },
      })
      keywordRecords.push(rec)
    }
  } else {
    keywordRecords = await prisma.keyword.findMany({
      where: { projectId, status: { notIn: ['ignored', 'not_recommended'] } },
      orderBy: { confidence: 'desc' },
      take: 25,
      select: { id: true, keyword: true, currentPosition: true, bestPosition: true },
    })
  }

  if (keywordRecords.length === 0) {
    return Response.json({ error: 'No keywords to track. Run an audit to discover keywords, or pass a keyword list.' }, { status: 400 })
  }

  const provider = getRankProvider()
  const device = body.device === 'mobile' ? 'mobile' : 'desktop'
  const country = body.country ?? null
  const language = body.language ?? null
  const results: RankCheckResult[] = []

  for (const rec of keywordRecords) {
    const result = await provider.check({ keyword: rec.keyword, domain: project.domain, device, country, language })
    results.push(result)

    // Always record the check — including unavailable ones, so the reason is auditable.
    await prisma.rankingCheck.create({
      data: {
        keywordId: rec.id,
        position: result.position,
        device,
        country: body.country ?? null,
        language: body.language ?? null,
        rankingUrl: result.rankingUrl,
        serpFeatures: result.serpFeatures.length ? JSON.stringify(result.serpFeatures) : null,
        source: result.source,
        available: result.available,
        unavailableReason: result.unavailableReason,
      },
    })

    // Only mutate the keyword's stored position when the check was observed.
    // An unavailable check preserves the last verified position untouched.
    if (result.available) {
      const newBest = result.position !== null
        ? Math.min(rec.bestPosition ?? Number.POSITIVE_INFINITY, result.position)
        : rec.bestPosition
      await prisma.keyword.update({
        where: { id: rec.id },
        data: {
          previousPosition: rec.currentPosition,
          currentPosition: result.position,
          bestPosition: newBest === Number.POSITIVE_INFINITY ? null : newBest,
          rankingUrl: result.rankingUrl,
          dataSource: result.source,
          lastCheckedAt: new Date(),
          status: result.position !== null
            ? (result.position <= 10 ? 'winning' : 'tracking')
            : 'tracking',
        },
      })
    }
  }

  const providerStatus = getProviderStatus()
  return Response.json({
    ok: true,
    projectId,
    checkedAt: new Date().toISOString(),
    liveSourceConfigured: providerStatus.configured,
    provider: providerStatus,
    summary: summarizeRankChecks(results),
    results: results.map((r) => ({
      keyword: r.keyword,
      position: r.position,
      rankingUrl: r.rankingUrl,
      source: r.source,
      available: r.available,
      unavailableReason: r.unavailableReason,
      serpFeatures: r.serpFeatures,
    })),
  })
}
