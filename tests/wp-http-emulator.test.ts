// Real-HTTP proof of the WordPress execution path against a WP-REST-compatible
// PHP emulator (NOT WordPress). Unlike the in-process double, this makes REAL
// network calls to a separate PHP process — proving transport, Basic-auth, and
// read-back verification end to end.
//
// HONEST SCOPE: the target is a protocol emulator, explicitly not the
// WordPress application. This is transport-level evidence, not live-WordPress
// validation. Skips automatically when `php` is unavailable.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, spawnSync, type ChildProcess } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { encryptSecret } from '../lib/foundation/crypto'
import { executeWpDeployment, resolveWpTarget, rollbackWpDeployment } from '../lib/foundation/wp-execution'
import { __setStoreForTests } from '../lib/foundation/store'
import { FileFoundationStore } from '../lib/foundation/filestore'
import type { WpConnection } from '../lib/foundation/types'

process.env.APP_SECRET = 'wp-http-emu-secret'

const hasPhp = spawnSync('php', ['-v']).status === 0
const d = hasPhp ? describe : describe.skip

const USER = 'admin'
const PASS = 'app-pass-1234'

function startEmulator(port: number, env: Record<string, string>): { proc: ChildProcess; state: string } {
  const state = path.join(mkdtempSync(path.join(tmpdir(), 'wpemu-')), 'state.json')
  const proc = spawn('php', ['-S', `127.0.0.1:${port}`, 'e2e/wp-emulator.php'], {
    env: { ...process.env, ...env, WP_USER: USER, WP_PASS: PASS, WP_STATE: state },
    stdio: 'ignore',
  })
  return { proc, state }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function waitUp(base: string) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/wp-json`)).ok) return
    } catch {
      /* not up yet */
    }
    await sleep(150)
  }
  throw new Error('emulator did not start')
}
function conn(base: string, password = PASS): WpConnection {
  return {
    id: 'c1', projectId: 'p1', siteUrl: base, username: USER,
    appPasswordEnc: encryptSecret(password), aioseo: true, createdBy: 'u', createdAt: new Date().toISOString(),
  }
}

d('WordPress execution over real HTTP (PHP WP-REST emulator, not WordPress)', () => {
  beforeAll(() => {
    __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'wphttp-'))))
  })
  afterAll(() => __setStoreForTests(null))

  it('resolves slug, deploys, verifies by read-back, and rolls back — over HTTP', async () => {
    const port = 8790
    const base = `http://127.0.0.1:${port}`
    const { proc, state } = startEmulator(port, {})
    try {
      await waitUp(base)
      const target = await resolveWpTarget(conn(base), `${base}/services`)
      expect(target).toMatchObject({ postId: 10, postType: 'pages' })

      const dep = await executeWpDeployment({
        projectId: 'p1', connection: conn(base), postId: 10, postType: 'pages',
        changes: { title: 'HTTP New Title', metaDescription: 'HTTP new meta' },
        approvedBy: 'u', reason: 'http proof',
      })
      expect(dep.status).toBe('verified')
      expect(dep.before.title).toBe('Original Title')
      expect(dep.verification?.titleMatches).toBe(true)
      expect(dep.verification?.metaMatches).toBe(true)

      const rolled = await rollbackWpDeployment({ deployment: dep, connection: conn(base), actorId: 'u2' })
      expect(rolled.status).toBe('rolled_back')

      // Independent read confirms the live emulator state actually reverted.
      const post = await fetch(`${base}/wp-json/wp/v2/pages/10?context=edit`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64') },
      }).then((r) => r.json())
      expect(post.title.raw).toBe('Original Title')
    } finally {
      proc.kill()
      rmSync(state, { force: true })
    }
  })

  it('reports verify_failed when the server returns 200 but drops the value (no false verified)', async () => {
    const port = 8791
    const base = `http://127.0.0.1:${port}`
    const { proc, state } = startEmulator(port, { WP_DROP_META: '1' })
    try {
      await waitUp(base)
      const dep = await executeWpDeployment({
        projectId: 'p1', connection: conn(base), postId: 10, postType: 'pages',
        changes: { metaDescription: 'will not stick' }, approvedBy: 'u', reason: 'drop',
      })
      expect(dep.status).toBe('verify_failed')
      expect(dep.verification?.metaMatches).toBe(false)
    } finally {
      proc.kill()
      rmSync(state, { force: true })
    }
  })

  it('aborts (never applies) on invalid credentials — real 401 on before-capture', async () => {
    const port = 8792
    const base = `http://127.0.0.1:${port}`
    const { proc, state } = startEmulator(port, {})
    try {
      await waitUp(base)
      // Invalid creds fail the BEFORE-capture read, so the deployment is
      // aborted before any write — a change is never applied without rollback
      // data. This surfaces as a rejection, not a silent success.
      await expect(
        executeWpDeployment({
          projectId: 'p1', connection: conn(base, 'wrong-password'), postId: 10, postType: 'pages',
          changes: { title: 'x' }, approvedBy: 'u', reason: 'bad creds',
        })
      ).rejects.toThrow(/401/)
    } finally {
      proc.kill()
      rmSync(state, { force: true })
    }
  })
})
