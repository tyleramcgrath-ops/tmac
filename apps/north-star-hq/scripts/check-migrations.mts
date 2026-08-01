// Regression checks for the migration runner and store pooling.
//
// Guards the failure that took /api/projects/[id]/agents/roster to a 300-second
// function timeout in production: runMigrations() acquired a global advisory
// lock on EVERY cold start, including the overwhelming majority where no
// migration was pending, and every wait involved (the lock, and pool.connect()
// inside the locked section) was unbounded. One stalled holder therefore
// blocked every other instance until the platform killed the request.
//
// Needs a real Postgres — these are lock/race behaviours a mock cannot show.
//   PGURL=postgres://user:pw@127.0.0.1:5432/postgres npm run check:db
//
// The URL must point at a database the script may create/drop siblings of; it
// creates throwaway databases named nshq_check_* and drops them afterwards.

import { readdirSync } from 'fs'
import { register } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { Pool } from 'pg'
import { runMigrations } from '../lib/foundation/migrate.ts'

// store.ts reaches its dependencies via extensionless dynamic imports, which
// only Next's bundler resolves. Register before check 6 imports it.
register('./ts-resolve-hook.mjs', import.meta.url)

const ADMIN = process.env.PGURL || 'postgres://postgres:pw@127.0.0.1:5432/postgres'
const MIGRATION_LOCK_KEY = 748_113_902
// Counted from the directory rather than hardcoded, so adding a migration does
// not fail these checks for the wrong reason.
const EXPECTED_MIGRATIONS = readdirSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/foundation/migrations')
).filter((f) => f.endsWith('.sql')).length

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (ok) pass++
  else fail++
}

function urlFor(db: string): string {
  const u = new URL(ADMIN)
  u.pathname = `/${db}`
  return u.toString()
}

const created: string[] = []
async function freshDb(name: string): Promise<string> {
  const admin = new Pool({ connectionString: ADMIN, max: 1 })
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`)
  await admin.query(`CREATE DATABASE ${name}`)
  await admin.end()
  created.push(name)
  return urlFor(name)
}

async function dropAll() {
  const admin = new Pool({ connectionString: ADMIN, max: 1 })
  for (const db of created) await admin.query(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`).catch(() => {})
  await admin.end()
}

// 1. A fresh database migrates from scratch.
{
  const pool = new Pool({ connectionString: await freshDb('nshq_check_fresh'), max: 5 })
  const r = await runMigrations(pool)
  check('fresh database applies every migration', r.applied.length === EXPECTED_MIGRATIONS, `applied=${r.applied.length}`)
  await pool.end()
}

// 2. THE REGRESSION. In steady state there is nothing to apply, so a cold start
//    must not touch the advisory lock at all. Proven by holding the lock from
//    another session and showing a cold start still completes promptly.
{
  const url = await freshDb('nshq_check_steady')
  const pool = new Pool({ connectionString: url, max: 5 })
  await runMigrations(pool) // reach steady state

  const holder = new Pool({ connectionString: url, max: 1 })
  const hc = await holder.connect()
  await hc.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY])

  const t0 = Date.now()
  const r = await runMigrations(pool)
  const ms = Date.now() - t0

  check('steady-state cold start ignores a held migration lock', ms < 1_000, `${ms}ms`)
  check('...and reports everything already applied', r.applied.length === 0 && r.skipped.length === EXPECTED_MIGRATIONS)

  await hc.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY])
  hc.release()
  await holder.end()
  await pool.end()
}

// 3. Concurrent cold starts against a fresh database: exactly-once, no crash.
//    Covers both the advisory-lock race and the CREATE TABLE IF NOT EXISTS race
//    (not concurrency-safe in Postgres, and it runs before the lock is taken).
{
  const url = await freshDb('nshq_check_race')
  const pools = Array.from({ length: 6 }, () => new Pool({ connectionString: url, max: 5 }))
  const results = await Promise.all(pools.map((p) => runMigrations(p)))
  const applied = results.reduce((a, r) => a + r.applied.length, 0)
  const dupes = await pools[0].query<{ n: string }>(
    `SELECT count(*)::text n FROM (SELECT version FROM rf_schema_migrations GROUP BY version HAVING count(*)>1) d`
  )
  check('6 concurrent runners apply each migration exactly once', applied === EXPECTED_MIGRATIONS, `applied=${applied}`)
  check('no duplicate migration-history rows', dupes.rows[0].n === '0')
  for (const p of pools) await p.end()
}

// 4. Pending work behind a stuck holder must fail fast and say why, rather than
//    hanging until the platform's function ceiling kills the request.
{
  const url = await freshDb('nshq_check_stuck')
  const holder = new Pool({ connectionString: url, max: 1 })
  const hc = await holder.connect()
  await hc.query(
    `CREATE TABLE IF NOT EXISTS rf_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  )
  await hc.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY])

  const pool = new Pool({ connectionString: url, max: 5 })
  const t0 = Date.now()
  let message = '(unexpectedly succeeded)'
  try {
    await runMigrations(pool)
  } catch (e) {
    message = (e as Error).message
  }
  const ms = Date.now() - t0
  check('stuck holder with pending work fails fast', ms < 20_000, `${ms}ms`)
  check('...with an error naming the migration lock', /migration lock/i.test(message), message.slice(0, 60))

  await hc.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY])
  hc.release()
  await holder.end()
  await pool.end()
}

// 5. No state leaks back into the pool: neither a held lock nor lock_timeout.
{
  const pool = new Pool({ connectionString: await freshDb('nshq_check_leak'), max: 5 })
  await runMigrations(pool)
  await runMigrations(pool)
  const held = await pool.query<{ n: string }>(`SELECT count(*)::text n FROM pg_locks WHERE locktype='advisory'`)
  const lt = await pool.query<{ lock_timeout: string }>(`SHOW lock_timeout`)
  check('no advisory lock left held', held.rows[0].n === '0', `${held.rows[0].n} held`)
  check('lock_timeout not leaked to pooled clients', lt.rows[0].lock_timeout === '0', `= ${lt.rows[0].lock_timeout}`)
  await pool.end()
}

// 6. getStore() must hand every concurrent caller the same store — one Pool per
//    instance, not one per in-flight request.
{
  const url = await freshDb('nshq_check_store')
  process.env.DATABASE_URL = url
  process.env.APP_SECRET = 'x'.repeat(40)
  const { getStore, __setStoreForTests } = await import('../lib/foundation/store.ts')
  __setStoreForTests(null)

  const probe = new Pool({ connectionString: url, max: 2 })
  const backends = async () =>
    (await probe.query<{ n: number }>(`SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database()`))
      .rows[0].n

  const before = await backends()
  const stores = await Promise.all(Array.from({ length: 8 }, () => getStore()))
  const opened = (await backends()) - before

  check('8 concurrent getStore() calls share one store', new Set(stores).size === 1, `${new Set(stores).size} distinct`)
  check('...opening a single pool, not one per caller', opened <= 2, `${opened} backends opened`)
  __setStoreForTests(null)
  await probe.end()
}

// 7. THE STRUCTURAL FIX. With RF_SKIP_MIGRATE_ON_CONNECT=1 — what deployed
//    instances run (vercel.json) — creating the store must not touch the
//    migration path at all. Proven under the worst case the old code had: a
//    migration genuinely pending AND another session holding the lock. Before,
//    that combination is exactly what pinned a cold start until the platform
//    killed it at 300s.
{
  const url = await freshDb('nshq_check_skip')
  const holder = new Pool({ connectionString: url, max: 1 })
  const hc = await holder.connect()
  await hc.query(
    `CREATE TABLE IF NOT EXISTS rf_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  )
  await hc.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]) // nothing applied yet => work IS pending

  process.env.RF_SKIP_MIGRATE_ON_CONNECT = '1'
  const { PostgresFoundationStore } = await import('../lib/foundation/postgres.ts')
  const t0 = Date.now()
  let built = false
  try {
    await PostgresFoundationStore.create(url)
    built = true
  } catch {
    built = false
  }
  const ms = Date.now() - t0
  check('runtime store creation skips migrations entirely', built && ms < 2_000, `${ms}ms`)

  // And it really did skip: nothing was applied while the lock was held.
  const applied = await hc.query<{ n: string }>(`SELECT count(*)::text n FROM rf_schema_migrations`)
  check('...applying nothing, leaving schema to the deploy step', applied.rows[0].n === '0', `${applied.rows[0].n} applied`)

  delete process.env.RF_SKIP_MIGRATE_ON_CONNECT
  await hc.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY])
  hc.release()
  await holder.end()
}

await dropAll()
console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
