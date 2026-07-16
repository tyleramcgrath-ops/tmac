// Finds the signed-in user's project for a domain within their organization,
// creating it if this is the first time the domain has been audited. Used by
// the /app dashboard so "type a domain, run an audit" keeps working while
// every audit still lands under a real, persisted project.

import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session || !session.organizationId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const domain = normalizeDomain(String(body.domain ?? ''))
    if (!domain) {
      return Response.json({ error: 'domain is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()
    const organizationId = session.organizationId

    const existing = await prisma.project.findUnique({
      where: { organizationId_domain: { organizationId, domain } },
      select: { id: true, name: true, domain: true, status: true, isFavorite: true, createdAt: true, updatedAt: true },
    })
    if (existing) {
      return Response.json({ success: true, project: existing, created: false })
    }

    const project = await prisma.project.create({
      data: { organizationId, name: domain, domain, status: 'active', isFavorite: false },
      select: { id: true, name: true, domain: true, status: true, isFavorite: true, createdAt: true, updatedAt: true },
    })

    await prisma.event.create({
      data: { organizationId, projectId: project.id, type: 'project', action: 'created' },
    }).catch(() => {})

    return Response.json({ success: true, project, created: true })
  } catch (err) {
    console.error('[projects/resolve] Error', err)
    return Response.json({ error: 'Failed to resolve project.' }, { status: 500 })
  }
}
