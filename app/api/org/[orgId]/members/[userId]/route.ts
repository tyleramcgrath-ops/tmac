import { audit, handled, HttpError, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { Role } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const VALID_ROLES: Role[] = ['owner', 'admin', 'member']

// Change a member's role. Admin-gated; only an owner may promote/demote
// another owner (an admin can't touch owners), and the last remaining owner
// can never be demoted — an org must always keep at least one.
export const PATCH = handled(async (request, ctx) => {
  const { orgId, userId } = await ctx.params
  const user = await requireUser(request)
  const { role: callerRole } = await requireOrgRole(user, orgId, 'admin')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const nextRole = String(body.role ?? '') as Role
  if (!VALID_ROLES.includes(nextRole)) {
    return Response.json({ error: 'Invalid role.' }, { status: 400 })
  }

  const store = await getStore()
  const target = await store.getMembership(orgId, userId)
  if (!target) return Response.json({ error: 'Member not found.' }, { status: 404 })
  if ((target.role === 'owner' || nextRole === 'owner') && callerRole !== 'owner') {
    throw new HttpError(403, 'Only an owner can grant or change owner access.')
  }
  if (target.role === 'owner' && nextRole !== 'owner') {
    const members = await store.listMembers(orgId)
    const otherOwners = members.filter((m) => m.role === 'owner' && m.userId !== userId)
    if (otherOwners.length === 0) {
      return Response.json({ error: 'An organization must have at least one owner.' }, { status: 400 })
    }
  }

  await store.addMember({ ...target, role: nextRole })
  await audit(orgId, user.id, 'member.role_change', userId, nextRole)
  return Response.json({ ok: true })
})

// Remove a member from the org. Same owner-protection rules as PATCH.
export const DELETE = handled(async (request, ctx) => {
  const { orgId, userId } = await ctx.params
  const user = await requireUser(request)
  const { role: callerRole } = await requireOrgRole(user, orgId, 'admin')

  const store = await getStore()
  const target = await store.getMembership(orgId, userId)
  if (!target) return Response.json({ error: 'Member not found.' }, { status: 404 })
  if (target.role === 'owner' && callerRole !== 'owner') {
    throw new HttpError(403, 'Only an owner can remove an owner.')
  }
  if (target.role === 'owner') {
    const members = await store.listMembers(orgId)
    const otherOwners = members.filter((m) => m.role === 'owner' && m.userId !== userId)
    if (otherOwners.length === 0) {
      return Response.json({ error: 'An organization must have at least one owner. Transfer ownership first.' }, { status: 400 })
    }
  }

  await store.removeMember(orgId, userId)
  await audit(orgId, user.id, 'member.remove', userId, '')
  return Response.json({ ok: true })
})
