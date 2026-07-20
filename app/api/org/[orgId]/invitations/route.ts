import { randomUUID } from 'crypto'
import { audit, enforceRateLimit, handled, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { sendInvitationEmail } from '@/lib/foundation/mailer'
import { getStore } from '@/lib/foundation/store'
import type { Invitation, Role } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const INVITE_LIMIT = 20 // per org owner/admin per hour — generous for real team growth, blocks spam
const INVITE_WINDOW_MS = 60 * 60 * 1000
const INVITE_TTL_MS = 7 * 24 * 3600 * 1000
// Invites grant admin/member only — owner access is transferred via the
// member-role endpoint by an existing owner, never handed out over email.
const INVITABLE_ROLES: Role[] = ['admin', 'member']

export const POST = handled(async (request, ctx) => {
  const { orgId } = await ctx.params
  const user = await requireUser(request)
  enforceRateLimit(request, `invite:${orgId}`, INVITE_LIMIT, INVITE_WINDOW_MS)
  const { org } = await requireOrgRole(user, orgId, 'admin')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email ?? '').trim().toLowerCase()
  const role = String(body.role ?? 'member') as Role
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!INVITABLE_ROLES.includes(role)) {
    return Response.json({ error: 'Invitations can only grant the admin or member role.' }, { status: 400 })
  }

  const store = await getStore()
  const existingUser = await store.getUserByEmail(email)
  if (existingUser) {
    const membership = await store.getMembership(orgId, existingUser.id)
    if (membership) return Response.json({ error: 'This person is already a member of this organization.' }, { status: 409 })
  }
  // Re-inviting: supersede any still-pending invite to the same address rather
  // than accumulating duplicates that could later be double-accepted.
  const existing = (await store.listInvitations(orgId)).filter((i) => i.email === email && i.status === 'pending')
  const now = new Date().toISOString()
  for (const inv of existing) {
    await store.updateInvitation({ ...inv, status: 'revoked' })
  }

  const invitation: Invitation = {
    id: randomUUID(),
    orgId,
    email,
    role,
    invitedBy: user.id,
    token: randomUUID(),
    status: 'pending',
    createdAt: now,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  }
  await store.createInvitation(invitation)
  await audit(orgId, user.id, 'invitation.create', invitation.id, email)

  const link = `${new URL(request.url).origin}/invite/${invitation.token}`
  const mail = await sendInvitationEmail(email, org.name, user.name, role, link)

  return Response.json(
    { invitation: { id: invitation.id, email, role, createdAt: invitation.createdAt, expiresAt: invitation.expiresAt }, emailDelivery: mail.via },
    { status: 201 }
  )
})
