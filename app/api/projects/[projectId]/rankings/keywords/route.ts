// Tracked-keyword management for rank history. This is config only — the
// actual position data lives in rf_rank_snapshots, written by either a manual
// "Check now" (POST action:'check') or the rank_tracking scheduled job.

import { randomUUID } from 'crypto'
import { audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { fetchKeywordPosition, hostOf, serpApiKey } from '@/lib/foundation/serp'
import type { TrackedKeyword } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const MAX_TRACKED_KEYWORDS = 25

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json({ keywords: await store.listTrackedKeywords(projectId) })
})

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const store = await getStore()

  // Manual "check now": one immediate snapshot for one already-tracked
  // keyword, without waiting for the schedule. Rate-limited well below
  // ordinary write limits since it's an outbound SERP API call.
  if (body.action === 'check') {
    enforceRateLimit(request, 'rank-check', 15)
    const keyword = String(body.keyword ?? '')
    const tracked = (await store.listTrackedKeywords(projectId)).find((k) => k.keyword === keyword)
    if (!tracked) throw new HttpError(404, 'That keyword is not tracked.')
    const key = serpApiKey()
    if (!key) return Response.json({ error: 'Connect a SERP API (set SERPAPI_KEY) to check live positions.' }, { status: 400 })
    let host: string
    try {
      host = hostOf(project.domain)
    } catch {
      throw new HttpError(400, 'Project domain is not a valid host.')
    }
    const { position, url } = await fetchKeywordPosition(keyword, host, key)
    const checkedAt = new Date().toISOString()
    const snapshot = { id: randomUUID(), projectId, keyword, position, url, checkedAt }
    await store.recordRankSnapshot(snapshot)
    return Response.json({ snapshot })
  }

  const keyword = String(body.keyword ?? '').trim().toLowerCase().slice(0, 200)
  if (!keyword) return Response.json({ error: 'Enter a keyword to track.' }, { status: 400 })

  const existing = await store.listTrackedKeywords(projectId)
  if (existing.length >= MAX_TRACKED_KEYWORDS) {
    return Response.json({ error: `You can track up to ${MAX_TRACKED_KEYWORDS} keywords per project.` }, { status: 400 })
  }
  if (existing.some((k) => k.keyword === keyword)) {
    return Response.json({ error: 'That keyword is already tracked.' }, { status: 409 })
  }
  const tracked: TrackedKeyword = { id: randomUUID(), projectId, keyword, addedBy: user.id, createdAt: new Date().toISOString() }
  await store.addTrackedKeyword(tracked)
  await audit(project.orgId, user.id, 'rankings.keyword.add', tracked.id, keyword)
  return Response.json({ keyword: tracked }, { status: 201 })
})

export const DELETE = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const store = await getStore()
  const tracked = (await store.listTrackedKeywords(projectId)).find((k) => k.id === id)
  if (!tracked) return Response.json({ error: 'Tracked keyword not found.' }, { status: 404 })
  await store.removeTrackedKeyword(id)
  await audit(project.orgId, user.id, 'rankings.keyword.remove', id, tracked.keyword)
  return Response.json({ ok: true })
})
