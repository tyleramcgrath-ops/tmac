import { randomUUID } from 'crypto'
import { audit, handled, HttpError, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { Project } from '@/lib/foundation/types'

export const runtime = 'nodejs'

export const GET = handled(async (request) => {
  const user = await requireUser(request)
  const store = await getStore()
  const orgs = await store.listOrgsForUser(user.id)
  const projects: Project[] = []
  for (const org of orgs) projects.push(...(await store.listProjects(org.id)))
  return Response.json({ projects })
})

export const POST = handled(async (request) => {
  const user = await requireUser(request)
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const domain = String(body.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain || !domain.includes('.')) {
    return Response.json({ error: 'Enter a valid domain.' }, { status: 400 })
  }

  const store = await getStore()
  const orgs = await store.listOrgsForUser(user.id)
  const orgId = String(body.orgId ?? orgs[0]?.id ?? '')
  const membership = orgId ? await store.getMembership(orgId, user.id) : null
  if (!membership) throw new HttpError(403, 'You are not a member of that organization.')
  if (membership.role === 'member') {
    throw new HttpError(403, 'Creating projects requires the admin role.')
  }

  const now = new Date().toISOString()
  const project: Project = {
    id: randomUUID(),
    orgId,
    domain,
    name: String(body.name ?? domain).slice(0, 120),
    industry: String(body.industry ?? '').slice(0, 120),
    businessProfile: String(body.businessProfile ?? '').slice(0, 2000),
    goals: Array.isArray(body.goals) ? body.goals.map(String).slice(0, 10) : [],
    notes: String(body.notes ?? '').slice(0, 4000),
    createdAt: now,
    updatedAt: now,
  }
  await store.createProject(project)
  await audit(orgId, user.id, 'project.create', project.id, domain)
  return Response.json({ project }, { status: 201 })
})
