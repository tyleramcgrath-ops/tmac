import { audit, handled, requireStaff, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import type { Organization } from '@/lib/foundation/types'

export const runtime = 'nodejs'

const VALID_STATUSES = ['active', 'expired', 'disabled'] as const

// Staff-only: set an org's pilot status/expiry/notes — the operation that,
// per KNOWN_LIMITATIONS.md, was previously a direct DB/script edit.
export const PATCH = handled(async (request, ctx) => {
  const { orgId } = await ctx.params
  const user = await requireUser(request)
  requireStaff(user)

  const store = await getStore()
  const org = await store.getOrg(orgId)
  if (!org) return Response.json({ error: 'Organization not found.' }, { status: 404 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const status = String(body.status ?? '')
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return Response.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }
  const expiresAt = body.expiresAt === null || body.expiresAt === undefined ? null : String(body.expiresAt)
  if (expiresAt !== null && Number.isNaN(Date.parse(expiresAt))) {
    return Response.json({ error: 'expiresAt must be a valid date or null.' }, { status: 400 })
  }
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : org.pilot?.notes

  const updated: Organization = {
    ...org,
    pilot: { status: status as (typeof VALID_STATUSES)[number], expiresAt, notes },
  }
  await store.updateOrg(updated)
  await audit(orgId, user.id, 'admin.pilot_update', orgId, `${status}${expiresAt ? ` until ${expiresAt}` : ''}`)
  return Response.json({ org: { id: updated.id, name: updated.name, pilot: updated.pilot } })
})
