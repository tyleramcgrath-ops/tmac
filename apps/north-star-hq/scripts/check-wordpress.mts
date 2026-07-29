// Regression checks for the real WordPress execution port (see
// lib/foundation/wp-execution.ts and lib/foundation/url-guard.ts, ported from
// the root RankForge app's live-validated implementation).
//
// NO REAL WORDPRESS SITE IS USED OR CLAIMED. This drives the real code —
// real HTTP requests, real Basic-Auth header built from a real
// encrypt/decrypt round trip, the real SSRF guard, real verify-by-read-back —
// against a local HTTP test double standing in for a WordPress REST API.
// That proves the transport, auth, verification, and rollback logic are
// correctly wired end to end. It does NOT prove any specific real
// WordPress/plugin combination behaves the way this test double does — that
// remains genuinely unproven in this environment, same as the root app's own
// KNOWN_LIMITATIONS.md documents for anything "unproven, environment-blocked"
// rather than claiming coverage it doesn't have.
//
//   npm run check:wordpress

import { createServer } from 'http'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { register } from 'module'

// wp-execution.ts reaches its dependencies (url-guard, crypto, store, ...) via
// extensionless imports, matching the app's own bundler-resolution
// convention — only Next's bundler resolves those; plain Node needs this
// hook. Same pattern as check-migrations.mts.
register('./ts-resolve-hook.mjs', import.meta.url)

process.env.APP_SECRET = process.env.APP_SECRET ?? 'check-wordpress-test-secret-not-real-32-chars'

const { FileFoundationStore } = await import('../lib/foundation/filestore.ts')
const { __setStoreForTests } = await import('../lib/foundation/store.ts')
const { encryptSecret, decryptSecret } = await import('../lib/foundation/crypto.ts')
const { sessionCookieFor } = await import('../lib/foundation/auth.ts')
const { __setTrustedHostsForTests } = await import('../lib/foundation/url-guard.ts')
const { detectSeoPlugin, executeWpDeployment, resolveWpTarget, rollbackWpDeployment } = await import('../lib/foundation/wp-execution.ts')
const { PUT: wpConnectPUT, GET: wpConnectGET, DELETE: wpConnectDELETE } = await import('../app/api/projects/[projectId]/wordpress/route.ts')

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (ok) pass++
  else fail++
}

// ── Fake WordPress REST server ──────────────────────────────────────────────
// In-memory post table keyed by id. dropsMeta simulates a plugin that 200s a
// write but silently never persists the meta field — the case
// executeWpDeployment must catch as verify_failed, never a false 'verified'.
const USERNAME = 'nshq-check'
const PASSWORD = 'app-password-not-real'
let dropsMeta = false
const posts = new Map<number, { title: string; content: string; excerpt: string; meta: Record<string, string>; link: string }>()
posts.set(42, { title: 'Original Title', content: 'Original body.', excerpt: '', meta: { rank_math_description: 'Original description.' }, link: 'http://TESTHOST/best-tents' })

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  // A real WordPress site's namespace index is public — no credentials
  // needed to discover what's installed. detectSeoPlugin (correctly) never
  // sends an Authorization header for this call, since plugin detection
  // happens before a connection even has stored credentials. Auth is
  // enforced below, only for the /wp/v2 content endpoints.
  if (url.pathname === '/wp-json') {
    send(200, { namespaces: ['oembed/1.0', 'rankmath/v1', 'wp/v2'] })
    return
  }

  const auth = req.headers.authorization ?? ''
  const [, b64] = auth.split(' ')
  const decoded = b64 ? Buffer.from(b64, 'base64').toString('utf8') : ''
  if (decoded !== `${USERNAME}:${PASSWORD}`) {
    res.writeHead(401, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ code: 'rest_forbidden', message: 'bad credentials' }))
    return
  }
  // The connect route (app/api/projects/[projectId]/wordpress/route.ts)
  // probes this exact endpoint to validate credentials against the live site
  // before ever storing a connection — a real WordPress REST API always has
  // it once authenticated.
  if (url.pathname === '/wp-json/wp/v2/users/me') {
    send(200, { id: 1, name: USERNAME })
    return
  }

  const listMatch = url.pathname.match(/^\/wp-json\/wp\/v2\/(posts|pages)$/)
  if (listMatch && req.method === 'GET') {
    const slug = url.searchParams.get('slug')
    if (slug === 'best-tents') {
      send(200, [{ id: 42, title: { raw: posts.get(42)!.title } }])
    } else {
      send(200, [])
    }
    return
  }

  const itemMatch = url.pathname.match(/^\/wp-json\/wp\/v2\/(posts|pages)\/(\d+)$/)
  if (itemMatch) {
    const id = Number(itemMatch[2])
    const post = posts.get(id)
    if (!post) return send(404, { code: 'rest_post_invalid_id' })

    if (req.method === 'GET') {
      send(200, {
        title: { raw: post.title },
        content: { raw: post.content },
        excerpt: { raw: post.excerpt },
        meta: post.meta,
        link: post.link,
      })
      return
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        const changes = JSON.parse(body || '{}') as { title?: string; excerpt?: string; meta?: Record<string, string> }
        if (changes.title !== undefined) post.title = changes.title
        if (changes.excerpt !== undefined) post.excerpt = changes.excerpt
        if (changes.meta && !dropsMeta) Object.assign(post.meta, changes.meta)
        send(200, { id })
      })
      return
    }
  }

  send(404, { code: 'not_found' })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const addr = server.address()
if (!addr || typeof addr === 'string') throw new Error('server did not bind a port')
const siteUrl = `http://127.0.0.1:${addr.port}`
// The literal address is what the SSRF guard actually classifies, so it has
// to be the trusted host — a hostname alias wouldn't exercise the guard's
// own IP-literal path at all.
__setTrustedHostsForTests(['127.0.0.1'])

// ── Store + fixtures ─────────────────────────────────────────────────────
const dataDir = mkdtempSync(path.join(tmpdir(), 'nshq-wp-check-'))
const store = new FileFoundationStore(dataDir)
__setStoreForTests(store)

const orgId = randomUUID()
const projectId = randomUUID()
const now = new Date().toISOString()
// Only a Project record is needed: rollbackWpDeployment's own activity-log
// call reads store.getProject(dep.projectId) for the org id to log against.
// Nothing exercised here reads a User/OrgMember record.
await store.createProject({
  id: projectId, orgId, domain: 'example.test', name: 'Check Project', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now, updatedAt: now,
})

const conn = {
  id: randomUUID(),
  projectId,
  siteUrl,
  username: USERNAME,
  appPasswordEnc: encryptSecret(PASSWORD),
  aioseo: false,
  seoPlugin: 'rankmath' as const,
  createdBy: 'check-script',
  createdAt: now,
}

// ── 1. Plugin detection reads the fake site's real REST namespace list ─────
const detected = await detectSeoPlugin(siteUrl)
check('detectSeoPlugin reads real /wp-json namespaces', detected === 'rankmath', `got ${detected}`)

// ── 2. resolveWpTarget does a real slug lookup against the fake site ───────
const target = await resolveWpTarget(conn, `${siteUrl}/best-tents`)
check('resolveWpTarget finds the real post by slug', target?.postId === 42, JSON.stringify(target))
const missing = await resolveWpTarget(conn, `${siteUrl}/does-not-exist`)
check('resolveWpTarget returns null honestly for no match', missing === null)

// ── 3. A real deploy: apply, then INDEPENDENTLY confirm the write landed ───
const dep = await executeWpDeployment({
  projectId, orgId, connection: conn, postId: 42, postType: 'pages',
  changes: { title: 'New Title', metaDescription: 'New description.' },
  approvedBy: 'check-script', reason: 'check:wordpress',
})
check('executeWpDeployment verifies a real write', dep.status === 'verified', dep.status)
check('captured a real BEFORE from the fake site', dep.before.title === 'Original Title', dep.before.title)
check('the fake site was actually mutated (not just the deployment record)', posts.get(42)!.title === 'New Title', posts.get(42)!.title)
check('meta description landed in the rankmath field the plugin renders', posts.get(42)!.meta.rank_math_description === 'New description.')
const persisted = await store.getWpDeployment(dep.id)
check('the deployment record itself persisted to the store', Boolean(persisted), persisted ? 'found' : 'missing')

// ── 4. A plugin that silently drops a write must surface as verify_failed ──
dropsMeta = true
const dep2 = await executeWpDeployment({
  projectId, orgId, connection: conn, postId: 42, postType: 'pages',
  changes: { title: 'Second Title', metaDescription: 'Dropped description.' },
  approvedBy: 'check-script', reason: 'check:wordpress-drop',
})
check('a write the plugin drops is reported verify_failed, never a false verified', dep2.status === 'verify_failed', dep2.status)
check('the title half (which the plugin DID accept) still shows as matched', dep2.verification?.titleMatches === true)
check('the meta half (which was dropped) shows as NOT matched', dep2.verification?.metaMatches === false)
dropsMeta = false

// ── 5. Rollback restores the captured before-values and is itself verified ─
const rolledBack = await rollbackWpDeployment({ deployment: dep, connection: conn, actorId: 'check-script' })
check('rollback reports rolled_back', rolledBack.status === 'rolled_back', rolledBack.status)
check('rollback actually restored the real title on the fake site', posts.get(42)!.title === 'Original Title', posts.get(42)!.title)
check('rollback restored the real meta description', posts.get(42)!.meta.rank_math_description === 'Original description.')

// ── 6. The SSRF guard is actually wired into the request path, not just present in source ──
const metadataConn = { ...conn, siteUrl: 'http://169.254.169.254' }
let blockedCorrectly = false
let blockReason = ''
try {
  await executeWpDeployment({
    projectId, orgId, connection: metadataConn, postId: 1, postType: 'pages',
    changes: { title: 'should never run' }, approvedBy: 'check-script', reason: 'ssrf-probe',
  })
} catch (err) {
  blockedCorrectly = err instanceof Error && /unsafe WordPress target/.test(err.message)
  blockReason = err instanceof Error ? err.message : String(err)
}
check('a connection pointed at cloud metadata is refused before any request', blockedCorrectly, blockReason)

// ── 7. The real PUT/GET route handlers, end to end ──────────────────────────
// Everything above drives wp-execution.ts directly. This section drives the
// actual exported route handlers (app/api/projects/[projectId]/wordpress/
// route.ts) with real Request objects and a real signed session cookie — the
// same objects Next.js would construct from an HTTP request — to prove the
// connect UI's one real gap (there was no way to ever create a WpConnection)
// is now closed end to end, not just at the library layer.
const adminId = randomUUID()
const memberId = randomUUID()
const routeOrgId = randomUUID()
const routeProjectId = randomUUID()
await store.createUser({ id: adminId, email: 'admin@check.test', name: 'Admin', passwordHash: 'x', createdAt: now })
await store.createUser({ id: memberId, email: 'member@check.test', name: 'Member', passwordHash: 'x', createdAt: now })
await store.createOrg({ id: routeOrgId, name: 'Check Org', createdAt: now }, adminId)
await store.addMember({ orgId: routeOrgId, userId: memberId, role: 'member', createdAt: now })
await store.createProject({
  id: routeProjectId, orgId: routeOrgId, domain: 'route-check.test', name: 'Route Check', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now, updatedAt: now,
})
const adminCookie = await sessionCookieFor(adminId)
const memberCookie = await sessionCookieFor(memberId)
const cookieHeader = (setCookie: string) => setCookie.split(';')[0]

function wpRequest(body: unknown, cookie: string, method = 'PUT') {
  return new Request(`http://localhost/api/projects/${routeProjectId}/wordpress`, {
    method,
    headers: { 'content-type': 'application/json', cookie: cookieHeader(cookie) },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  })
}
const ctx = { params: Promise.resolve({ projectId: routeProjectId }) }

const badCreds = await wpConnectPUT(wpRequest({ siteUrl, username: USERNAME, appPassword: 'wrong-password' }, adminCookie), ctx)
check('PUT with wrong credentials fails honestly, never silently succeeds', badCreds.status === 502, String(badCreds.status))

const memberDenied = await wpConnectPUT(wpRequest({ siteUrl, username: USERNAME, appPassword: PASSWORD }, memberCookie), ctx)
check('PUT is refused for a member (admin role required to connect)', memberDenied.status === 403, String(memberDenied.status))

const noConnBeforeConnect = await wpConnectGET(wpRequest(null, memberCookie, 'GET'), ctx)
const noConnBody = await noConnBeforeConnect.json()
check('GET reports no connection before one is created', noConnBody.connection === null, JSON.stringify(noConnBody.connection))

const okConnect = await wpConnectPUT(wpRequest({ siteUrl, username: USERNAME, appPassword: PASSWORD }, adminCookie), ctx)
const okBody = await okConnect.json()
check('PUT with real credentials against the live site succeeds', okConnect.status === 200, String(okConnect.status))
check('...and the response never carries the password', !JSON.stringify(okBody).includes(PASSWORD))

const persistedConn = await store.getWpConnection(routeProjectId)
check('a WpConnection actually persisted to the store', Boolean(persistedConn), persistedConn ? 'found' : 'missing')
check('the stored password is encrypted, not plaintext', persistedConn ? !persistedConn.appPasswordEnc.includes(PASSWORD) : false)
check('...and round-trips back to the real password via decryptSecret', persistedConn ? decryptSecret(persistedConn.appPasswordEnc) === PASSWORD : false)

const afterConnect = await wpConnectGET(wpRequest(null, memberCookie, 'GET'), ctx)
const afterBody = await afterConnect.json()
check('GET (as a plain member) now shows the connection, minus the password', afterBody.connection?.siteUrl === siteUrl && !('appPassword' in afterBody.connection) && !('appPasswordEnc' in afterBody.connection), JSON.stringify(afterBody.connection))

const metadataAttempt = await wpConnectPUT(wpRequest({ siteUrl: 'http://169.254.169.254', username: 'x', appPassword: 'y' }, adminCookie), ctx)
check('PUT refuses to even probe an unsafe (cloud-metadata) siteUrl', metadataAttempt.status === 400, String(metadataAttempt.status))

// ── 8. Disconnect — the only way past a seeded/demo connection to a real one ─
const deleteDenied = await wpConnectDELETE(wpRequest(null, memberCookie, 'DELETE'), ctx)
check('DELETE is refused for a member (admin role required)', deleteDenied.status === 403, String(deleteDenied.status))

const deleteOk = await wpConnectDELETE(wpRequest(null, adminCookie, 'DELETE'), ctx)
check('DELETE (as admin) succeeds', deleteOk.status === 200, String(deleteOk.status))

const afterDelete = await store.getWpConnection(routeProjectId)
check('...and the connection is actually gone from the store', afterDelete === null, afterDelete ? 'still present' : 'gone')

const getAfterDelete = await wpConnectGET(wpRequest(null, memberCookie, 'GET'), ctx)
const getAfterDeleteBody = await getAfterDelete.json()
check('GET now reports no connection, so a real PUT can replace it', getAfterDeleteBody.connection === null, JSON.stringify(getAfterDeleteBody.connection))

// The site itself was never mutated by disconnect — reconnecting must reuse
// the same live credentials without re-probing anything destructive.
const reconnect = await wpConnectPUT(wpRequest({ siteUrl, username: USERNAME, appPassword: PASSWORD }, adminCookie), ctx)
check('a real PUT after disconnect succeeds — the seeded/demo connection no longer blocks it', reconnect.status === 200, String(reconnect.status))

server.close()
rmSync(dataDir, { recursive: true, force: true })

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
