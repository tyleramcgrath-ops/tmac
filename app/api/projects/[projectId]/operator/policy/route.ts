import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { DEFAULT_POLICY, type AutomationPolicy } from '@/lib/foundation/operator/policy'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  return Response.json({ policy: (project.operatorPolicy as AutomationPolicy) ?? DEFAULT_POLICY })
})

export const PUT = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'admin')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const incoming = (body.policy ?? {}) as Partial<AutomationPolicy>
  // Sanitize: never allow auto-approve of dangerous kinds; clamp cap.
  const policy: AutomationPolicy = {
    autoApprove: {
      title: incoming.autoApprove?.title === 'low' || incoming.autoApprove?.title === 'medium' ? incoming.autoApprove.title : undefined,
      metaDescription:
        incoming.autoApprove?.metaDescription === 'low' || incoming.autoApprove?.metaDescription === 'medium' ? incoming.autoApprove.metaDescription : undefined,
      schema: incoming.autoApprove?.schema === 'low' ? 'low' : undefined,
    },
    alwaysRequireApproval: ['robots-directive', 'canonical', 'redirect', 'sitemap', 'noindex'],
    maxAutoApprovePages: Math.max(1, Math.min(50, Number(incoming.maxAutoApprovePages) || DEFAULT_POLICY.maxAutoApprovePages)),
  }
  const store = await getStore()
  await store.updateProject({ ...project, operatorPolicy: policy, updatedAt: new Date().toISOString() })
  await audit(project.orgId, user.id, 'operator.policy.update', projectId, JSON.stringify(policy.autoApprove))
  return Response.json({ policy })
})
