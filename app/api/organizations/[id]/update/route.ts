import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, logoUrl } = body

    const prisma = getPrismaClient()

    // Verify user has owner role in this organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: session.userId,
        },
      },
    })

    if (!member || member.role !== 'owner') {
      return Response.json({ error: 'Only organization owners can update settings' }, { status: 403 })
    }

    // Update organization
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        updatedAt: true,
      },
    })

    return Response.json({
      success: true,
      organization: updated,
    })
  } catch (err) {
    console.error('[organizations/update] Error', err)
    return Response.json(
      { error: `Failed to update organization: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
