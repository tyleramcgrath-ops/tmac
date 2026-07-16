// Property picker — lists the accessible GSC properties / GA4 accounts+
// properties for the connected Google account. When OAuth isn't configured, it
// returns the mock provider's data clearly flagged with source: "mock" and
// preview: true, so the picker UI is fully functional up to the credential
// boundary without pretending the data is real.

import { getCurrentSession } from '@/lib/session'
import { getGoogleReadiness } from '@/lib/google/config'
import { getGoogleProvider } from '@/lib/google/providers'
import { decryptTokenTolerant } from '@/lib/crypto/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const service = url.searchParams.get('service') // 'gsc' | 'ga4'
  const accountId = url.searchParams.get('accountId') // for GA4 properties
  if (!projectId || (service !== 'gsc' && service !== 'ga4')) {
    return Response.json({ error: 'projectId and service (gsc|ga4) are required.' }, { status: 400 })
  }

  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, domain: true, organizationId: true } })
  if (!project || project.organizationId !== session.organizationId) {
    return Response.json({ error: 'Project not found.' }, { status: 404 })
  }

  const readiness = getGoogleReadiness()
  const provider = getGoogleProvider({ configured: readiness.configured, domain: project.domain })
  const isMock = provider.kind === 'mock'

  // With live provider, we need a decrypted access token.
  let accessToken = ''
  if (!isMock) {
    const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' }, select: { accessToken: true } })
    if (!cred?.accessToken) {
      return Response.json({ error: 'Google account not connected for this project.', source: 'live', preview: false }, { status: 409 })
    }
    try { accessToken = decryptTokenTolerant(cred.accessToken) } catch {
      return Response.json({ error: 'Stored token could not be decrypted.', source: 'live', preview: false }, { status: 500 })
    }
  }

  try {
    if (service === 'gsc') {
      const properties = await provider.listGscProperties(accessToken)
      return Response.json({ ok: true, service: 'gsc', source: provider.kind, preview: isMock, properties })
    }
    // GA4: accounts, then (if accountId given) properties.
    if (accountId) {
      const properties = await provider.listGa4Properties(accessToken, accountId)
      return Response.json({ ok: true, service: 'ga4', source: provider.kind, preview: isMock, properties })
    }
    const accounts = await provider.listGa4Accounts(accessToken)
    return Response.json({ ok: true, service: 'ga4', source: provider.kind, preview: isMock, accounts })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed to list properties.', source: provider.kind, preview: isMock }, { status: 502 })
  }
}
