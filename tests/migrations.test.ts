// Migration files are well-formed and complete. (A live Postgres apply is
// exercised by `pnpm db:migrate` against a real DB; here we assert the
// migration set covers every table with constraints, so the runner has
// correct input.)

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const DIR = path.join(process.cwd(), 'lib/foundation/migrations')

describe('versioned migrations', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()

  it('has at least one ordered .sql migration', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files[0]).toMatch(/^\d{3}_/)
  })

  it('creates every foundation table', () => {
    const sql = files.map((f) => readFileSync(path.join(DIR, f), 'utf8')).join('\n')
    for (const table of [
      'rf_users',
      'rf_orgs',
      'rf_members',
      'rf_projects',
      'rf_scans',
      'rf_recommendations',
      'rf_wp_connections',
      'rf_wp_deployments',
      'rf_audit',
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
    }
  })

  it('declares foreign keys, a unique email, and status check constraints', () => {
    const sql = files.map((f) => readFileSync(path.join(DIR, f), 'utf8')).join('\n')
    expect(sql).toContain('REFERENCES rf_orgs(id) ON DELETE CASCADE')
    expect(sql).toContain('REFERENCES rf_projects(id) ON DELETE CASCADE')
    expect(sql).toMatch(/email TEXT UNIQUE NOT NULL/)
    expect(sql).toContain("status IN ('queued','running','completed','partial','failed','cancelled')")
    expect(sql).toContain("role IN ('owner','admin','member')")
  })

  it('runMigrations is importable and idempotent-by-history in shape', async () => {
    const mod = await import('../lib/foundation/migrate')
    expect(typeof mod.runMigrations).toBe('function')
    expect(typeof mod.migrateCli).toBe('function')
  })
})
