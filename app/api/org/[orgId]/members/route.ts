import { handled, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Any member can see the roster (read-only) — inviting/revoking is admin-gated
// in the invitations routes.
export const GET = handled(async (request, ctx) => {
  const { orgId } = await ctx.params
  const user = await requireUser(request)
  const { org } = await requireOrgRole(user, orgId, 'member')
  const store = await getStore()
  const members = await store.listMembers(orgId)
  const users = await Promise.all(members.map((m) => store.getUserById(m.userId)))
  const roster = members.map((m, i) => ({
    userId: m.userId,
    email: users[i]?.email ?? '(deleted user)',
    name: users[i]?.name ?? '',
    role: m.role,
    createdAt: m.createdAt,
  }))
  const invitations = (await store.listInvitations(orgId))
    .filter((i) => i.status === 'pending')
    .map((i) => ({ id: i.id, email: i.email, role: i.role, createdAt: i.createdAt, expiresAt: i.expiresAt }))
  return Response.json({ org: { id: org.id, name: org.name }, members: roster, invitations })
})
