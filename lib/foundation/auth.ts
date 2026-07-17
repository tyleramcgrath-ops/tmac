// Session + authorization helpers for foundation API routes.
//
// Sessions: HttpOnly cookie holding a signed JWT (jose HS256, APP_SECRET).
// Authorization: every project-scoped route resolves the project, then
// verifies the caller is a member of its organization with a sufficient
// role. Tenant isolation lives here — routes never trust client-sent org
// or project ownership claims.

import { randomUUID } from 'crypto'
import { createSessionToken, readSessionToken } from './crypto'
import { getStore } from './store'
import type { Project, Role, User } from './types'

export const SESSION_COOKIE = 'rf_session'

export async function sessionCookieFor(userId: string, tokenVersion = 0): Promise<string> {
  const token = await createSessionToken(userId, tokenVersion)
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${7 * 24 * 3600}`
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`
}

// Revoke ALL of a user's sessions (logout-everywhere, password change, or a
// suspected compromise) by bumping the server-side tokenVersion. Every
// previously-issued token now fails the tokenVersion check in currentUser.
// Returns the new tokenVersion so the caller can mint a fresh session.
export async function revokeSessions(userId: string): Promise<number> {
  const store = await getStore()
  const user = await store.getUserById(userId)
  if (!user) throw new HttpError(404, 'User not found.')
  const next = (user.tokenVersion ?? 0) + 1
  await store.updateUser({ ...user, tokenVersion: next })
  return next
}

function tokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  return m ? m[1] : null
}

export async function currentUser(request: Request): Promise<User | null> {
  const token = tokenFromRequest(request)
  if (!token) return null
  const claims = await readSessionToken(token)
  if (!claims) return null
  const store = await getStore()
  const user = await store.getUserById(claims.userId)
  if (!user) return null
  // Session revocation (Phase D.6 P6): a token minted before the user's current
  // tokenVersion is dead, even though its signature + expiry are still valid.
  if ((user.tokenVersion ?? 0) !== claims.tokenVersion) return null
  return user
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireUser(request: Request): Promise<User> {
  const user = await currentUser(request)
  if (!user) throw new HttpError(401, 'Sign in required.')
  return user
}

// CSRF defense-in-depth (Phase D.6 P6). The session cookie is SameSite=Lax,
// which already blocks it from cross-site sub-requests, but on state-changing
// requests we ALSO reject a mismatched Origin. When Origin is absent (same-
// origin GETs, some tooling) we do not block — Lax remains the primary guard.
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (!origin) return
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw new HttpError(403, 'Invalid request origin.')
  }
  const host = request.headers.get('host') ?? new URL(request.url).host
  if (originHost !== host) {
    throw new HttpError(403, 'Cross-origin request rejected.')
  }
}

const ROLE_RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 }

// Resolves the project and enforces that `user` belongs to its org with at
// least `minRole`. Returns project + the caller's role.
export async function requireProjectRole(
  user: User,
  projectId: string,
  minRole: Role
): Promise<{ project: Project; role: Role }> {
  const store = await getStore()
  const project = await store.getProject(projectId)
  // 404 (not 403) for projects outside the caller's tenancy — existence of
  // other tenants' resources is never disclosed.
  if (!project) throw new HttpError(404, 'Project not found.')
  const membership = await store.getMembership(project.orgId, user.id)
  if (!membership) throw new HttpError(404, 'Project not found.')
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `This action requires the ${minRole} role.`)
  }
  return { project, role: membership.role }
}

export async function audit(
  orgId: string,
  actorId: string,
  action: string,
  target: string,
  detail = ''
): Promise<void> {
  const store = await getStore()
  await store.appendAudit({
    id: randomUUID(),
    orgId,
    actorId,
    action,
    target,
    detail,
    at: new Date().toISOString(),
  })
}

// Route-handler wrapper: converts HttpError to a JSON response.
export function handled(
  fn: (request: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return async (request: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(request, ctx)
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status })
      }
      const message = err instanceof Error ? err.message : 'Unexpected error.'
      const status = message === 'email_taken' ? 409 : 500
      return Response.json(
        { error: status === 409 ? 'An account with this email already exists.' : 'Unexpected error.' },
        { status }
      )
    }
  }
}
