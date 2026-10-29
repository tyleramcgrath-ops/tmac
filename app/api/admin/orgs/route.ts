import { handled, requireStaff, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Staff-only: every org across the whole deployment, with just enough
// context (owner email, member/project counts) to make a pilot decision —
// never the orgs' actual project/scan/recommendation data, which stays
// tenant-scoped even for staff.
export const GET = handled(async (request) => {
  const user = await requireUser(request)
  requireStaff(user)

  const store = await getStore()
  const orgs = await store.listOrgs()
  const rows = await Promise.all(
    orgs.map(async (org) => {
      const members = await store.listMembers(org.id)
      const owner = members.find((m) => m.role === 'owner')
      const ownerUser = owner ? await store.getUserById(owner.userId) : null
      const projects = await store.listProjects(org.id)
      return {
        id: org.id,
        name: org.name,
        pilot: org.pilot ?? null,
        ownerEmail: ownerUser?.email ?? null,
        memberCount: members.length,
        projectCount: projects.length,
        createdAt: org.createdAt,
      }
    })
  )
  return Response.json({ orgs: rows })
})
