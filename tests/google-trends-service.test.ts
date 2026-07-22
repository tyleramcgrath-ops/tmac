// fetchGoogleTrends / resolveGoogleProviders (Phase H follow-up): the service
// seam the Atlas dashboard's trend charts read through. Uses a real
// FileFoundationStore (temp dir) so token decode/refresh/persist is exercised
// end-to-end, driven by a fake fetch — never the real network.

import { describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { fetchGoogleBreakdowns, fetchGoogleTrends, resolveGoogleProviders } from '../lib/foundation/external/service'
import { encodeTokenBundle, type GoogleTokenBundle } from '../lib/foundation/oauth/google'
import type { Organization, Project, ProviderConnection, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'google-trends-service-secret-01'
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'

function newStore(): FileFoundationStore {
  const dir = mkdtempSync(path.join(tmpdir(), 'rf-google-trends-'))
  return new FileFoundationStore(dir)
}

const uid = () => randomUUID()
const now = () => new Date().toISOString()
function project(orgId: string): Project {
  return { id: uid(), orgId, domain: 'example.com', name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
}

const future: GoogleTokenBundle = { accessToken: 'at', refreshToken: 'rt', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), scope: 's', tokenType: 'Bearer' }

async function seedProject(store: FileFoundationStore) {
  const u: User = { id: uid(), email: `u_${uid()}@x.com`, name: 'u', passwordHash: 'scrypt.x', tokenVersion: 0, createdAt: now() }
  await store.createUser(u)
  const org: Organization = { id: uid(), name: 'Org', createdAt: now() }
  await store.createOrg(org, u.id)
  const p = project(org.id)
  await store.createProject(p)
  return p
}

describe('resolveGoogleProviders', () => {
  it('returns nulls when OAuth is not configured', async () => {
    const savedId = process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_ID
    const store = newStore()
    const p = await seedProject(store)
    const resolved = await resolveGoogleProviders(store, p.id, p, Date.now())
    expect(resolved.searchConsole).toBeNull()
    expect(resolved.analytics).toBeNull()
    process.env.GOOGLE_CLIENT_ID = savedId
  })

  it('resolves live providers from a stored connected credential', async () => {
    const store = newStore()
    const p = await seedProject(store)
    const conn: ProviderConnection = {
      projectId: p.id, kind: 'search-console', vendor: 'google', status: 'connected', detail: 'Connected.',
      accountEmail: 'a@x.com', resourceId: null, scope: 'gsc', credentialEnc: encodeTokenBundle(future),
      connectedBy: 'u', createdAt: now(), updatedAt: now(),
    }
    await store.upsertProviderConnection(conn)
    const resolved = await resolveGoogleProviders(store, p.id, p, Date.now())
    expect(resolved.searchConsole).not.toBeNull()
    expect(resolved.analytics).toBeNull()
  })
})

describe('fetchGoogleTrends', () => {
  it('degrades each side independently when neither provider is connected', async () => {
    const store = newStore()
    const p = await seedProject(store)
    const trends = await fetchGoogleTrends(store, p.id, p, Date.now())
    expect(trends.gsc.ok).toBe(false)
    expect(trends.analytics.ok).toBe(false)
  })
})

describe('fetchGoogleBreakdowns', () => {
  it('degrades all three views independently when nothing is connected', async () => {
    const store = newStore()
    const p = await seedProject(store)
    const breakdowns = await fetchGoogleBreakdowns(store, p.id, p, Date.now())
    expect(breakdowns.gscDevice.ok).toBe(false)
    expect(breakdowns.gscCountry.ok).toBe(false)
    expect(breakdowns.ga4Channel.ok).toBe(false)
  })
})
