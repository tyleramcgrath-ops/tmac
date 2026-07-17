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

export async function runMigrations(pool: Pool): Promise<MigrationResult> {
  await pool.query(HISTORY)
  const done = new Set(
    (await pool.query<{ version: string }>('SELECT version FROM rf_schema_migrations')).rows.map(
      (r) => r.version
    )
  )
  const migrations = await listMigrations()
  const result: MigrationResult = { applied: [], skipped: [] }

  for (const m of migrations) {
    if (done.has(m.version)) {
      result.skipped.push(m.version)
      continue
    }
    const client: PoolClient = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(m.sql)
      await client.query('INSERT INTO rf_schema_migrations (version) VALUES ($1)', [m.version])
      await client.query('COMMIT')
      result.applied.push(m.version)
    } catch (err) {
      await client.query('ROLLBACK')
      throw new Error(`Migration ${m.version} failed: ${err instanceof Error ? err.message : err}`)
    } finally {
      client.release()
    }
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
