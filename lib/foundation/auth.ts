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

export async function sessionCookieFor(userId: string): Promise<string> {
  const token = await createSessionToken(userId)
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${7 * 24 * 3600}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

function tokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  return m ? m[1] : null
}

export async function currentUser(request: Request): Promise<User | null> {
  const token = tokenFromRequest(request)
  if (!token) return null
  const userId = await readSessionToken(token)
  if (!userId) return null
  const store = await getStore()
  return store.getUserById(userId)
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
