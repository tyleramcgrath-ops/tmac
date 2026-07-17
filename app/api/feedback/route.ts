// Pilot feedback / issue reporting (RC2 P6). Any authenticated user can submit
// feedback or an issue report, attributed to their org + user. GET lists their
// org's submissions (so an operator on the same org can review). Rate-limited.

import { randomUUID } from 'crypto'
import { assertSameOrigin, audit, enforceRateLimit, handled, HttpError, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { PilotFeedback } from '@/lib/foundation/types'

export const runtime = 'nodejs'

// Resolve the caller's primary org (the personal workspace, or first membership).
async function primaryOrgId(userId: string): Promise<string | null> {
  const store = await getStore()
  const orgs = await store.listOrgsForUser(userId)
  return orgs[0]?.id ?? null
}

export const POST = handled(async (request) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'feedback', 20)
  const user = await requireUser(request)
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const kind = body.kind === 'issue' ? 'issue' : 'feedback'
  const message = String(body.message ?? '').trim().slice(0, 5000)
  const projectId = body.projectId ? String(body.projectId) : null
  if (!message) throw new HttpError(400, 'A message is required.')
  const orgId = await primaryOrgId(user.id)
  if (!orgId) throw new HttpError(400, 'No workspace found.')

  const entry: PilotFeedback = { id: randomUUID(), orgId, userId: user.id, projectId, kind, message, createdAt: new Date().toISOString() }
  const store = await getStore()
  await store.createFeedback(entry)
  await audit(orgId, user.id, `pilot.${kind}`, entry.id, message.slice(0, 120))
  return Response.json({ ok: true, id: entry.id }, { status: 201 })
})

export const GET = handled(async (request) => {
  const user = await requireUser(request)
  const orgId = await primaryOrgId(user.id)
  if (!orgId) return Response.json({ feedback: [] })
  const store = await getStore()
  const feedback = await store.listFeedback(orgId, 50)
  return Response.json({ feedback })
})
