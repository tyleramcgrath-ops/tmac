import { getCurrentSession } from './session'
import { getPrismaClient } from './db'

export type Permission =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'analyst'
  | 'viewer'

const ROLE_HIERARCHY: Record<Permission, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1,
}

export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireOrganizationAccess(organizationId: string) {
  const session = await requireAuth()

  if (!session.organizationId) {
    throw new Error('No organization context')
  }

  if (session.organizationId !== organizationId) {
    throw new Error('Access denied: Not a member of this organization')
  }

  return session
}

export async function requireRole(organizationId: string, requiredRole: Permission) {
  const session = await requireOrganizationAccess(organizationId)
  const prisma = getPrismaClient()

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.userId,
      },
    },
  })

  if (!membership || membership.removedAt) {
    throw new Error('Access denied: Not a member of this organization')
  }

  const userRoleLevel = ROLE_HIERARCHY[membership.role as Permission]
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]

  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(`Access denied: Requires ${requiredRole} role`)
  }

  return { session, membership }
}

export async function requireProjectAccess(projectId: string) {
  const session = await requireAuth()
  const prisma = getPrismaClient()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true, status: true },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  if (project.status === 'deleted') {
    throw new Error('Project is deleted')
  }

  // Verify user is member of this organization
  await requireOrganizationAccess(project.organizationId)

  return { session, project }
}

export function createErrorResponse(message: string, status: number = 403) {
  return Response.json({ error: message }, { status })
}

export async function withAuth(handler: (session: any, req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      const session = await requireAuth()
      return handler(session, req)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unauthorized'
      if (message === 'Authentication required') {
        return createErrorResponse('Not authenticated', 401)
      }
      if (message.startsWith('Access denied')) {
        return createErrorResponse(message.replace('Access denied: ', ''), 403)
      }
      return createErrorResponse('Unauthorized', 403)
    }
  }
}

export async function withOrgAccess(
  handler: (organizationId: string, session: any, req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      const url = new URL(req.url)
      const organizationId = url.searchParams.get('organizationId')

      if (!organizationId) {
        return createErrorResponse('organizationId parameter required', 400)
      }

      const session = await requireOrganizationAccess(organizationId)
      return handler(organizationId, session, req)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unauthorized'
      if (message === 'Authentication required') {
        return createErrorResponse('Not authenticated', 401)
      }
      if (message.startsWith('Access denied')) {
        return createErrorResponse(message.replace('Access denied: ', ''), 403)
      }
      if (message === 'No organization context') {
        return createErrorResponse('No organization context', 400)
      }
      return createErrorResponse('Unauthorized', 403)
    }
  }
}
