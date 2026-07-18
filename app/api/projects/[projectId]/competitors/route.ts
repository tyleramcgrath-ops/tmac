// Competitor management (Phase G §1). Persist tracked competitors per project.
// Overlap metrics are computed by the Atlas endpoint from real crawls and
// graded — never invented here.

import { randomUUID } from 'crypto'
import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { Competitor } from '@/lib/foundation/types'

export const runtime = 'nodejs'

function normalizeDomain(raw: string): string | null {
  const t = raw.trim().toLowerCase()
  if (!t) return null
  try {
    const host = new URL(t.includes('://') ? t : `https://${t}`).hostname.replace(/^www\./, '')
    return /\.[a-z]{2,}$/.test(host) ? host : null
  } catch {
    return null
  }
}

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  return Response.json({ competitors: await store.listCompetitors(projectId) })
})

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const domain = normalizeDomain(String(body.domain ?? ''))
  if (!domain) return Response.json({ error: 'Enter a valid competitor domain, e.g. rival.com' }, { status: 400 })

  const store = await getStore()
  if ((await store.listCompetitors(projectId)).some((c) => c.domain === domain)) {
    return Response.json({ error: 'That competitor is already tracked.' }, { status: 409 })
  }
  const competitor: Competitor = {
    id: randomUUID(), projectId, domain, label: String(body.label ?? domain).slice(0, 80),
    addedBy: user.id, createdAt: new Date().toISOString(), lastSnapshotAt: null,
  }
  await store.createCompetitor(competitor)
  await audit(project.orgId, user.id, 'competitor.add', competitor.id, domain)
  return Response.json({ competitor }, { status: 201 })
})

export const DELETE = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const store = await getStore()
  const competitor = await store.getCompetitor(id)
  if (!competitor || competitor.projectId !== projectId) {
    return Response.json({ error: 'Competitor not found.' }, { status: 404 })
  }
  await store.deleteCompetitor(id)
  await audit(project.orgId, user.id, 'competitor.remove', id, competitor.domain)
  return Response.json({ ok: true })
})
