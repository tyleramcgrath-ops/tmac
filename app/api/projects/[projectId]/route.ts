import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const scans = await store.listScans(projectId, 10)
  return Response.json({
    project,
    scans: scans.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      error: s.error,
      summary: s.summary,
    })),
  })
})

export const PATCH = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const updated = {
    ...project,
    name: body.name !== undefined ? String(body.name).slice(0, 120) : project.name,
    industry: body.industry !== undefined ? String(body.industry).slice(0, 120) : project.industry,
    businessProfile:
      body.businessProfile !== undefined ? String(body.businessProfile).slice(0, 2000) : project.businessProfile,
    goals: Array.isArray(body.goals) ? body.goals.map(String).slice(0, 10) : project.goals,
    notes: body.notes !== undefined ? String(body.notes).slice(0, 4000) : project.notes,
    updatedAt: new Date().toISOString(),
  }
  const store = await getStore()
  await store.updateProject(updated)
  await audit(project.orgId, user.id, 'project.update', project.id)
  return Response.json({ project: updated })
})

export const DELETE = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'owner')
  const store = await getStore()
  await store.deleteProject(projectId)
  await audit(project.orgId, user.id, 'project.delete', project.id, project.domain)
  return Response.json({ ok: true })
})
