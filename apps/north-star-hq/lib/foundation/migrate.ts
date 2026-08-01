// Idempotent, forward-only migration runner.
//
// Reads lib/foundation/migrations/*.sql in filename order, applies any not
// yet recorded in rf_schema_migrations, each in its own transaction. Safe to
// run repeatedly: already-applied migrations are skipped. This replaces
// request-time table creation as the production schema strategy.

import { promises as fs } from 'fs'
import path from 'path'
import { Pool, type PoolClient } from 'pg'

const MIGRATIONS_DIR = path.join(process.cwd(), 'lib/foundation/migrations')

const HISTORY = `
CREATE TABLE IF NOT EXISTS rf_schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

export interface MigrationResult {
  applied: string[]
  skipped: string[]
}

async function listMigrations(): Promise<{ version: string; sql: string }[]> {
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  return Promise.all(
    files.map(async (f) => ({
      version: f.replace(/\.sql$/, ''),
      sql: await fs.readFile(path.join(MIGRATIONS_DIR, f), 'utf8'),
    }))
  )
}

// A fixed advisory-lock key so that concurrent runners (multiple serverless
// instances cold-starting at once, or parallel test workers sharing a DB)
// serialize instead of racing on the migration-history insert.
const MIGRATION_LOCK_KEY = 748_113_902

// How long a runner will wait for the migration lock before giving up. The
// wait used to be unbounded, which on a serverless platform meant a cold start
// blocked until the 300s function ceiling killed it.
const LOCK_WAIT_MS = 10_000

// CREATE TABLE IF NOT EXISTS is NOT race-safe in Postgres: concurrent runners
// can both pass the existence check and then collide inserting into pg_type,
// failing with 23505 (unique_violation) or 42P07 (duplicate_table). This runs
// before the advisory lock — and has to, since the lock's own bookkeeping lives
// in this table — so the lock never protected it. Two instances cold-starting
// against a freshly provisioned database was enough to crash one of them.
// Losing the race is a success for our purposes: the table now exists.
async function ensureHistoryTable(pool: Pool): Promise<void> {
  try {
    await pool.query(HISTORY)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code !== '23505' && code !== '42P07') throw err
  }
}

export async function runMigrations(pool: Pool): Promise<MigrationResult> {
  await ensureHistoryTable(pool)
  const migrations = await listMigrations()
  const result: MigrationResult = { applied: [], skipped: [] }

  // Fast path: check for pending work BEFORE reaching for the lock. In steady
  // state — every deploy after the one that introduced a migration — there is
  // nothing to apply, yet the old code still took a global advisory lock on
  // every single cold start. That turned a schema-management tool into an
  // instance-wide mutex on the hot path: one stalled holder blocked every
  // other cold start indefinitely, and each blocked request burned the full
  // 300s function budget serving a read that needed no schema work at all.
  //
  // This is only an optimization, never the correctness boundary: the locked
  // section below re-reads the applied set and the history insert is ON
  // CONFLICT DO NOTHING, so a migration racing in between is still safe.
  const preApplied = new Set(
    (await pool.query<{ version: string }>('SELECT version FROM rf_schema_migrations')).rows.map((r) => r.version)
  )
  if (migrations.every((m) => preApplied.has(m.version))) {
    result.skipped = migrations.map((m) => m.version)
    return result
  }

  // Serialize all migration runners on one session-level advisory lock. Held
  // for the whole loop on a dedicated connection; released in finally.
  const lock: PoolClient = await pool.connect()
  try {
    // Bound the wait so a stuck holder surfaces as a fast, named error rather
    // than a request that hangs until the platform kills it.
    await lock.query(`SET lock_timeout = ${LOCK_WAIT_MS}`)
    await lock.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY])
  } catch (err) {
    lock.release()
    throw new Error(
      `Timed out after ${LOCK_WAIT_MS}ms waiting for the migration lock; another instance may be mid-migration: ${
        err instanceof Error ? err.message : err
      }`
    )
  }
  try {
    // Read applied set AFTER acquiring the lock so a runner that waited sees
    // everything the previous holder applied.
    const done = new Set(
      (await lock.query<{ version: string }>('SELECT version FROM rf_schema_migrations')).rows.map((r) => r.version)
    )
    for (const m of migrations) {
      if (done.has(m.version)) {
        result.skipped.push(m.version)
        continue
      }
      const client: PoolClient = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(m.sql)
        // ON CONFLICT: belt-and-braces against any second writer.
        await client.query('INSERT INTO rf_schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [m.version])
        await client.query('COMMIT')
        result.applied.push(m.version)
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${m.version} failed: ${err instanceof Error ? err.message : err}`)
      } finally {
        client.release()
      }
    }
  } finally {
    await lock.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY])
    // node-pg does not reset session state on release, so drop the
    // lock_timeout we set rather than handing an altered session back to the
    // pool for unrelated queries to inherit.
    await lock.query('RESET lock_timeout')
    lock.release()
  }
  return result
}

// CLI entry: `pnpm db:migrate`. Uses DATABASE_URL/POSTGRES_URL.
export async function migrateCli(): Promise<void> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) {
    console.error('DATABASE_URL (or POSTGRES_URL) is required to run migrations.')
    process.exit(1)
  }
  const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }
  const pool = new Pool({ connectionString: url, ssl })
  try {
    const res = await runMigrations(pool)
    console.log(
      `Migrations complete. Applied: ${res.applied.join(', ') || 'none'}. Skipped (already applied): ${res.skipped.length}.`
    )
  } finally {
    await pool.end()
  }
}
