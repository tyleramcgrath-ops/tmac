// Tracked-query management for AI citation history. Config only — the
// actual citation data lives in rf_ai_citation_snapshots, written by either
// a manual "Check now" (POST action:'check') or the ai_citation_check
// scheduled job.

import { randomUUID } from 'crypto'
import { audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { checkCitation, perplexityApiKey } from '@/lib/foundation/ai-citations'
import { hostOf } from '@/lib/foundation/serp'
import type { TrackedAiQuery } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const MAX_TRACKED_QUERIES = 25

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json({ queries: await store.listTrackedAiQueries(projectId) })
})

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const store = await getStore()

  if (body.action === 'check') {
    enforceRateLimit(request, 'ai-citation-check', 15)
    const query = String(body.query ?? '')
    const tracked = (await store.listTrackedAiQueries(projectId)).find((q) => q.query === query)
    if (!tracked) throw new HttpError(404, 'That query is not tracked.')
    const key = perplexityApiKey()
    if (!key) return Response.json({ error: 'Connect Perplexity (set PERPLEXITY_API_KEY) to check AI citations.' }, { status: 400 })
    let host: string
    try {
      host = hostOf(project.domain)
    } catch {
      throw new HttpError(400, 'Project domain is not a valid host.')
    }
    const c = await checkCitation(query, host, key)
    const snapshot = {
      id: randomUUID(), projectId, query, engine: 'perplexity' as const,
      available: c.available, cited: c.cited, position: c.position, citedUrl: c.citedUrl,
      sourceCount: c.sourceCount, message: c.message, checkedAt: new Date().toISOString(),
    }
    await store.recordAiCitationSnapshot(snapshot)
    return Response.json({ snapshot })
  }

  const query = String(body.query ?? '').trim().slice(0, 300)
  if (!query) return Response.json({ error: 'Enter a query to track.' }, { status: 400 })

  const existing = await store.listTrackedAiQueries(projectId)
  if (existing.length >= MAX_TRACKED_QUERIES) {
    return Response.json({ error: `You can track up to ${MAX_TRACKED_QUERIES} queries per project.` }, { status: 400 })
  }
  if (existing.some((q) => q.query === query)) {
    return Response.json({ error: 'That query is already tracked.' }, { status: 409 })
  }
  const tracked: TrackedAiQuery = { id: randomUUID(), projectId, query, addedBy: user.id, createdAt: new Date().toISOString() }
  await store.addTrackedAiQuery(tracked)
  await audit(project.orgId, user.id, 'citations.query.add', tracked.id, query)
  return Response.json({ query: tracked }, { status: 201 })
})

export const DELETE = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const store = await getStore()
  const tracked = (await store.listTrackedAiQueries(projectId)).find((q) => q.id === id)
  if (!tracked) return Response.json({ error: 'Tracked query not found.' }, { status: 404 })
  await store.removeTrackedAiQuery(id)
  await audit(project.orgId, user.id, 'citations.query.remove', id, tracked.query)
  return Response.json({ ok: true })
})
